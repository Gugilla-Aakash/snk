import { getColor, isEmpty, isInside } from "@snk/types/grid";
import type { Grid } from "@snk/types/grid";
import { around4 } from "@snk/types/point";
import type { Point } from "@snk/types/point";
import {
  createSnakeFromCells,
  getHeadX,
  getHeadY,
  nextSnake,
  snakeToCells,
  snakeWillSelfCollide,
} from "@snk/types/snake";
import type { Snake } from "@snk/types/snake";
import { MAX_SNAKE_LENGTH } from "@snk/svg-creator/snake";
import { planRegions, serpentineRect } from "./hamiltonianRoute";

const key = (p: Point): string => `${p.x},${p.y}`;
const manhattan = (a: Point, b: Point): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

type SearchNode = {
  x: number;
  y: number;
  g: number;
  f: number;
  parent: SearchNode | null;
};

/**
 * A* shortest path on the grid, 4-neighborhood, Manhattan heuristic, with an
 * optional per-cell extra cost (soft walls: steered around, never blocking).
 * returns the cells to step onto (excluding start, including goal), or null.
 * deterministic: fixed neighbor order, first-minimum wins ties.
 */
export const astarPath = (
  grid: Grid,
  blocked: Set<string>,
  start: Point,
  goal: Point,
  extraCost: (x: number, y: number) => number = () => 0,
): Point[] | null => {
  if (start.x === goal.x && start.y === goal.y) return [];

  const open: SearchNode[] = [
    { ...start, g: 0, f: manhattan(start, goal), parent: null },
  ];
  const best = new Map<string, number>([[key(start), 0]]);
  const closed = new Set<string>();

  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi++;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur);
    if (closed.has(ck)) continue;
    closed.add(ck);

    if (cur.x === goal.x && cur.y === goal.y) {
      const path: Point[] = [];
      let n: SearchNode | null = cur;
      while (n && !(n.x === start.x && n.y === start.y)) {
        path.push({ x: n.x, y: n.y });
        n = n.parent;
      }
      return path.reverse();
    }

    for (const a of around4) {
      const nx = cur.x + a.x;
      const ny = cur.y + a.y;
      if (!isInside(grid, nx, ny)) continue;
      const nk = `${nx},${ny}`;
      if (closed.has(nk)) continue;
      if (blocked.has(nk) && !(nx === goal.x && ny === goal.y)) continue;
      const g = cur.g + 1 + extraCost(nx, ny);
      if ((best.get(nk) ?? Infinity) <= g) continue;
      best.set(nk, g);
      open.push({
        x: nx,
        y: ny,
        g,
        f: g + manhattan({ x: nx, y: ny }, goal),
        parent: cur,
      });
    }
  }

  return null;
};

/** unweighted reachability, used for the lookahead. */
export const bfsPath = (
  grid: Grid,
  blocked: Set<string>,
  start: Point,
  goal: Point,
): Point[] | null => {
  if (start.x === goal.x && start.y === goal.y) return [];
  const seen = new Set<string>([key(start)]);
  const queue: { p: Point; path: Point[] }[] = [{ p: start, path: [] }];

  while (queue.length) {
    const { p, path } = queue.shift()!;
    for (const a of around4) {
      const nx = p.x + a.x;
      const ny = p.y + a.y;
      if (!isInside(grid, nx, ny)) continue;
      if (nx === goal.x && ny === goal.y) return [...path, { x: nx, y: ny }];
      const nk = `${nx},${ny}`;
      if (seen.has(nk) || blocked.has(nk)) continue;
      seen.add(nk);
      queue.push({ p: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
    }
  }

  return null;
};

type Body = Point[];

/** exact nokia body update for one step (matches the renderer's growth rule). */
const simStep = (
  grid: Grid,
  body: Body,
  eaten: Set<string>,
  next: Point,
): { body: Body; ate: boolean; collision: boolean } => {
  const k = key(next);
  const food =
    isInside(grid, next.x, next.y) &&
    !isEmpty(getColor(grid, next.x, next.y)) &&
    !eaten.has(k);
  const grows = food && body.length < MAX_SNAKE_LENGTH;
  // a growing move keeps the tail: it stays a solid obstacle.
  const obstacle = grows ? body : body.slice(0, -1);
  if (obstacle.some((c) => c.x === next.x && c.y === next.y))
    return { body, ate: false, collision: true };

  const nextBody = grows ? [next, ...body] : [next, ...body.slice(0, -1)];
  if (food) eaten.add(k);
  return { body: nextBody, ate: food, collision: false };
};

const bodySet = (body: Body, excludeTailTip: boolean): Set<string> =>
  new Set((excludeTailTip ? body.slice(0, -1) : body).map(key));

/** dense runs (this wide or wider) are swept decisively, not hunted. */
const SWEEP_MIN_WIDTH = 2;

/** steering penalty per future-sweep cell: detoured around, never blocking. */
const RUN_PENALTY = 1000;

/**
 * greedy-TSP foraging with A* legs and reach-tail lookahead, in three parts.
 *
 * Phase 1 hunts sparse food nearest-first (future sweeps softly walled off):
 * a target is committed only if the exact simulation eats collision-free AND
 * the head can still reach the tail afterwards — so the grown body can never
 * trap (or touch) itself.
 *
 * Phase 2 sweeps each dense run top-down in fixed serpentine order: zero
 * decisions, zero dither. Runs whose interior already holds body fall back
 * to the leftovers pool instead of risking a collision.
 *
 * Phase 3 hunts the leftovers with the same greedy machinery and no walls.
 *
 * Every step everywhere is exact-simulated, so output can never overlap;
 * anything unexpected throws and the caller falls back to the sweep/solvers.
 * deterministic.
 */
export const getForagingRoute = (
  grid: Grid,
  snake0: Snake,
): { chain: Snake[]; stats: string; stallsAt: number[] } => {
  const chain: Snake[] = [];
  let snake = snake0;

  // entry: walk the off-grid head to the top-left corner.
  while (getHeadX(snake) !== 0 || getHeadY(snake) !== 0) {
    const hx = getHeadX(snake);
    const hy = getHeadY(snake);
    const dx = hx !== 0 ? Math.sign(0 - hx) : 0;
    const dy = hx !== 0 ? 0 : Math.sign(0 - hy);
    if (snakeWillSelfCollide(snake, dx, dy))
      throw new Error("foraging route collides on entry");
    snake = nextSnake(snake, dx, dy);
    chain.push(snake);
  }

  let body = snakeToCells(snake);
  const eaten = new Set<string>();
  // the entry step itself may land on food: the renderer counts it, so do we.
  // (length bookkeeping stays exact unless (0,0) itself is green, in which
  // case the renderer parks exactly one extra segment inside the tail.)
  {
    const head = body[0];
    const k = key(head);
    if (
      isInside(grid, head.x, head.y) &&
      !isEmpty(getColor(grid, head.x, head.y))
    ) {
      eaten.add(k);
      if (body.length < MAX_SNAKE_LENGTH)
        body = [...body, { ...body[body.length - 1] }];
    }
  }

  const foods: Point[] = [];
  for (let x = 0; x < grid.width; x++)
    for (let y = 0; y < grid.height; y++)
      if (!isEmpty(getColor(grid, x, y)) && !eaten.has(`${x},${y}`))
        foods.push({ x, y });
  foods.sort((a, b) => a.x - b.x || a.y - b.y);

  const denseRuns = planRegions(grid).filter(
    (r) => r.kind === "green" && r.to - r.from + 1 >= SWEEP_MIN_WIDTH,
  );
  const runCells = (list: typeof denseRuns): Set<string> => {
    const s = new Set<string>();
    for (const o of list)
      for (let x = o.from; x <= o.to; x++)
        for (let y = 0; y < grid.height; y++) s.add(`${x},${y}`);
    return s;
  };
  const inDenseRun = (x: number): boolean =>
    denseRuns.some((r) => x >= r.from && x <= r.to);
  const runCost = (walls: Set<string>) => (x: number, y: number) =>
    walls.has(`${x},${y}`) ? RUN_PENALTY : 0;

  const budget = 8 * grid.width * grid.height + 64;
  let stalls = 0;
  let legs = 0;
  let swept = 0;
  const stallsAt: number[] = [];

  const purgeEaten = () => {
    for (let i = foods.length - 1; i >= 0; i--)
      if (eaten.has(key(foods[i]))) foods.splice(i, 1);
  };

  const takeStep = (cell: Point) => {
    if (chain.length > budget)
      throw new Error("foraging route over step budget");
    const r = simStep(grid, body, eaten, cell);
    if (r.collision) throw new Error("foraging step collides");
    body = r.body;
    chain.push(createSnakeFromCells(body));
    purgeEaten();
  };

  // Greedy hunt over a target subset: nearest first, lookahead-validated,
  // tail-chase stalls. When the preferred targets yield nothing committable,
  // the fallback pool (dense food) is tried before stalling, so walled-off
  // situations degrade to opportunistic eating instead of deadlocking.
  // Throws when truly stuck (caller falls back).
  const hunt = (
    targets: () => Point[],
    blocked: (b: Body) => Set<string>,
    cost: (x: number, y: number) => number,
    fallbackTargets?: () => Point[],
  ): void => {
    for (;;) {
      const primary = targets();
      if (!primary.length) return;
      const head = body[0];
      const walls = blocked(body);

      const tryPool = (pool: Point[]): boolean => {
        const ranked: { food: Point; path: Point[] }[] = [];
        for (const food of pool) {
          const path = astarPath(grid, walls, head, food, cost);
          if (path) ranked.push({ food, path });
        }
        ranked.sort(
          (a, b) =>
            a.path.length - b.path.length ||
            a.food.x - b.food.x ||
            a.food.y - b.food.y,
        );

        for (const { food, path } of ranked) {
          let trialBody = body.map((c) => ({ ...c }));
          const trialEaten = new Set(eaten);
          let ok = true;
          for (const cell of path) {
            const r = simStep(grid, trialBody, trialEaten, cell);
            if (r.collision) {
              ok = false;
              break;
            }
            trialBody = r.body;
          }
          if (!ok) continue;

          // lookahead: the new head must still reach the new tail afterwards.
          // an off-grid tail (first steps) is trivially satisfied.
          const newHead = trialBody[0];
          const newTail = trialBody[trialBody.length - 1];
          if (
            isInside(grid, newTail.x, newTail.y) &&
            bfsPath(grid, bodySet(trialBody, true), newHead, newTail) === null
          ) {
            if (process.env.FORAGE_DEBUG)
              console.log(
                `veto target=${key(food)} path=${path.map(key).join(" ")} body=${trialBody.map(key).join(" ")}`,
              );
            continue;
          }

          for (const cell of path) takeStep(cell);
          legs++;
          stalls = 0;
          return true;
        }
        return false;
      };

      if (tryPool(primary)) continue;
      if (fallbackTargets) {
        const primaryKeys = new Set(primary.map(key));
        if (tryPool(fallbackTargets().filter((f) => !primaryKeys.has(key(f)))))
          continue;
      }

      // no safe target: chase the tail one step and re-evaluate.
      const tail = body[body.length - 1];
      const stallPath =
        astarPath(grid, walls, head, tail, cost) ??
        astarPath(grid, bodySet(body, true), head, tail);
      if (!stallPath || !stallPath.length) {
        if (!isInside(grid, tail.x, tail.y)) {
          // off-grid tail: step straight at it (exact-simulated).
          const options = around4
            .map((a) => ({ x: head.x + a.x, y: head.y + a.y }))
            .filter((c) => {
              const r = simStep(grid, body, new Set(eaten), c);
              return !r.collision;
            })
            .sort(
              (a, b) =>
                manhattan(a, tail) - manhattan(b, tail) ||
                around4.findIndex(
                  (d) => head.x + d.x === a.x && head.y + d.y === a.y,
                ) -
                  around4.findIndex(
                    (d) => head.x + d.x === b.x && head.y + d.y === b.y,
                  ),
            );
          if (!options.length) throw new Error("foraging route is trapped");
          takeStep(options[0]);
          stallsAt.push(chain.length - 1);
          if (++stalls > grid.width * grid.height)
            throw new Error("foraging route stalled too long");
          continue;
        }
        throw new Error("foraging route is trapped");
      }
      takeStep(stallPath[0]);
      stallsAt.push(chain.length - 1);
      if (++stalls > grid.width * grid.height)
        throw new Error(
          `foraging route stalled too long (foods=${foods.map(key).join(" ")} body=${body.map(key).join(" ")})`,
        );
    }
  };

  // Phase 1: hunt sparse food; future sweeps softly walled off. Dense food
  // is only touched opportunistically when nothing sparse is committable.
  const sparseWalls = runCells(denseRuns);
  hunt(
    () => foods.filter((f) => !inDenseRun(f.x)),
    (b) => new Set([...bodySet(b, true), ...sparseWalls]),
    runCost(sparseWalls),
    () => foods.slice(),
  );

  // Phase 2: sweep each pristine dense run top-down, left to right.
  const leftovers: Point[] = [];
  const sweptRuns: typeof denseRuns = [];
  denseRuns.forEach((run) => {
    const tainted = body.some((c) => c.x >= run.from && c.x <= run.to);
    const uneaten = foods.filter((f) => f.x >= run.from && f.x <= run.to);
    if (tainted || !uneaten.length) {
      leftovers.push(...uneaten);
      return;
    }
    const corner = { x: run.from, y: 0 };
    try {
      const blockedBody = bodySet(body, true);
      const beeline =
        astarPath(
          grid,
          new Set([
            ...blockedBody,
            ...runCells(
              denseRuns.filter((o) => o !== run && !sweptRuns.includes(o)),
            ),
            ...(() => {
              const s = runCells([run]);
              s.delete(`${corner.x},${corner.y}`);
              return s;
            })(),
          ]),
          body[0],
          corner,
        ) ??
        astarPath(
          grid,
          new Set([
            ...blockedBody,
            ...runCells(
              denseRuns.filter((o) => o !== run && !sweptRuns.includes(o)),
            ),
          ]),
          body[0],
          corner,
        ) ??
        astarPath(grid, blockedBody, body[0], corner);
      if (!beeline) throw new Error("foraging sweep cannot reach its run");
      for (const cell of beeline) takeStep(cell);

      const sweep = serpentineRect(
        run.from,
        run.to,
        grid.height,
        "top-left",
        "column",
      );
      const list = sweep.slice();
      if (list.length && list[0].x === body[0].x && list[0].y === body[0].y)
        list.shift();
      for (const cell of list) takeStep(cell);
      sweptRuns.push(run);
      swept++;
      stalls = 0;
    } catch (err) {
      if (/budget/.test((err as Error).message)) throw err;
      for (const f of foods)
        if (f.x >= run.from && f.x <= run.to && !eaten.has(key(f)))
          leftovers.push(f);
    }
  });

  // Phase 3: hunt whatever is left, no walls left to protect.
  hunt(
    () =>
      foods.filter((f) => leftovers.some((l) => l.x === f.x && l.y === f.y)),
    (b) => bodySet(b, true),
    () => 0,
  );

  return {
    chain,
    stats: `${eaten.size} foods (${swept} swept), ${chain.length} steps, ${legs} legs, ${stalls} stalls`,
    stallsAt,
  };
};
