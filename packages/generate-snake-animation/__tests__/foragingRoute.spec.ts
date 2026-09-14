import { it, expect } from "bun:test";
import {
  Color,
  createEmptyGrid,
  getColor,
  isEmpty,
  type Grid,
} from "@snk/types/grid";
import { setColor } from "@snk/types/grid";
import { snakeToCells } from "@snk/types/snake";
import { snake4 } from "@snk/types/__fixtures__/snake";
import { getForagingRoute } from "../foragingRoute";

const withFoods = (w: number, h: number, foods: [number, number][]): Grid => {
  const grid = createEmptyGrid(w, h);
  for (const [x, y] of foods) setColor(grid, x, y, 1 as Color);
  return grid;
};

const headsOf = (grid: Grid) => {
  const { chain } = getForagingRoute(grid, snake4);
  return { chain, heads: chain.map((s) => snakeToCells(s)[0]) };
};

/** foraging contract: every food eaten, contiguous, never touches itself. */
const checkForage = (grid: Grid, label: string) => {
  const { chain, heads } = headsOf(grid);

  let greens = 0;
  for (let x = 0; x < grid.width; x++)
    for (let y = 0; y < grid.height; y++)
      if (!isEmpty(getColor(grid, x, y))) greens++;
  expect(greens).toBeGreaterThan(0);

  // contiguous from the initial head.
  let prev = snakeToCells(snake4)[0];
  for (const head of heads) {
    expect(
      Math.abs(head.x - prev.x) + Math.abs(head.y - prev.y),
      `${label}: jump to (${head.x},${head.y})`,
    ).toBe(1);
    prev = head;
  }

  // every food eaten at least once.
  const seen = new Set<string>();
  let eats = 0;
  for (const head of heads) {
    const k = `${head.x},${head.y}`;
    if (!isEmpty(getColor(grid, head.x, head.y)) && !seen.has(k)) eats++;
    seen.add(k);
  }
  expect(eats).toBe(greens);

  // nokia rule on the exact (varying-length) bodies.
  let body = snakeToCells(snake4);
  for (const snake of chain) {
    const cells = snakeToCells(snake);
    const head = cells[0];
    expect(
      body.slice(0, -1).some((c) => c.x === head.x && c.y === head.y),
      `${label}: head touches tail at (${head.x},${head.y})`,
    ).toBe(false);
    body = cells;
  }

  return chain;
};

it("forages scattered food in the open", () => {
  checkForage(
    withFoods(8, 8, [
      [1, 1],
      [6, 1],
      [3, 4],
      [7, 6],
      [0, 7],
      [5, 3],
    ]),
    "open",
  );
});

it("forages along a corridor", () => {
  checkForage(
    withFoods(11, 5, [
      [1, 2],
      [4, 2],
      [7, 2],
      [9, 0],
      [9, 4],
    ]),
    "corridor",
  );
});

it("enters and leaves a two-wide pocket", () => {
  checkForage(
    withFoods(7, 7, [
      [0, 6],
      [3, 3],
      [4, 3],
      [3, 4],
      [6, 0],
    ]),
    "pocket",
  );
});

it("handles a profile-like cluster", () => {
  const foods: [number, number][] = [];
  for (let x = 8; x < 12; x++) for (let y = 0; y < 7; y++) foods.push([x, y]);
  foods.push([2, 2], [5, 5]);
  checkForage(withFoods(12, 7, foods), "cluster");
});

it("is deterministic", () => {
  const grid = withFoods(8, 8, [
    [1, 1],
    [6, 1],
    [3, 4],
    [7, 6],
  ]);
  const a = headsOf(grid).heads;
  const b = headsOf(grid).heads;
  expect(a).toEqual(b);
});

it("reports stats", () => {
  const grid = withFoods(6, 6, [
    [2, 2],
    [4, 4],
  ]);
  const { stats } = getForagingRoute(grid, snake4);
  expect(stats).toContain("2 foods");
});
it("hunts strays first, then sweeps dense runs top-down", () => {
  const grid = withFoods(12, 7, [
    [2, 2],
    [5, 5],
    ...[7, 8, 9, 10].flatMap((x) =>
      [0, 1, 2, 3, 4, 5, 6].map((y) => [x, y] as [number, number]),
    ),
  ]);
  const { chain, stallsAt } = getForagingRoute(grid, snake4);
  const heads = chain.map((s) => snakeToCells(s)[0]);
  const firstVisit = (x: number, y: number) =>
    heads.findIndex((h) => h.x === x && h.y === y);

  // the stray is eaten before the dive starts, from the top going down.
  expect(firstVisit(2, 2)).toBeGreaterThan(-1);
  expect(firstVisit(7, 0)).toBeGreaterThan(-1);
  expect(firstVisit(2, 2)).toBeLessThan(firstVisit(7, 0));
  expect(heads[firstVisit(7, 0) + 1]).toEqual({ x: 7, y: 1 });

  // decisive sweep, no dither.
  expect(stallsAt.length).toBeLessThanOrEqual(3);

  let greens = 0;
  for (let x = 0; x < 12; x++)
    for (let y = 0; y < 7; y++) if (!isEmpty(getColor(grid, x, y))) greens++;
  const seen = new Set<string>();
  let eats = 0;
  for (const h of heads) {
    const k = `${h.x},${h.y}`;
    if (!isEmpty(getColor(grid, h.x, h.y)) && !seen.has(k)) eats++;
    seen.add(k);
  }
  expect(eats).toBe(greens);
});

it("reaches sparse food beyond a dense band without stranding", () => {
  // full-height dense band with food on both sides: penalized crossing,
  // never a sealing ban. tainted runs degrade to leftovers, never deadlock.
  const grid = withFoods(10, 7, [
    [1, 6],
    [8, 3],
    ...[4, 5].flatMap((x) =>
      [0, 1, 2, 3, 4, 5, 6].map((y) => [x, y] as [number, number]),
    ),
  ]);
  const { chain, stallsAt } = getForagingRoute(grid, snake4);
  const heads = chain.map((s) => snakeToCells(s)[0]);

  let greens = 0;
  for (let x = 0; x < 10; x++)
    for (let y = 0; y < 7; y++) if (!isEmpty(getColor(grid, x, y))) greens++;
  const seen = new Set<string>();
  let eats = 0;
  for (const h of heads) {
    const k = `${h.x},${h.y}`;
    if (!isEmpty(getColor(grid, h.x, h.y)) && !seen.has(k)) eats++;
    seen.add(k);
  }
  expect(eats).toBe(greens);

  let prev = snakeToCells(snake4)[0];
  for (const h of heads) {
    expect(Math.abs(h.x - prev.x) + Math.abs(h.y - prev.y)).toBe(1);
    prev = h;
  }
  let body = snakeToCells(snake4);
  for (const snake of chain) {
    const cells = snakeToCells(snake);
    const head = cells[0];
    expect(
      body.slice(0, -1).some((c) => c.x === head.x && c.y === head.y),
    ).toBe(false);
    body = cells;
  }
  expect(stallsAt.length).toBeLessThan(70);
});

it("sweeps multiple dense runs left to right", () => {
  // stray stays clear of the runs, so both dives stay pristine.
  const grid = withFoods(16, 7, [
    [1, 6],
    ...[5, 6].flatMap((x) =>
      [0, 1, 2, 3, 4, 5, 6].map((y) => [x, y] as [number, number]),
    ),
    ...[11, 12, 13].flatMap((x) =>
      [0, 1, 2, 3, 4, 5, 6].map((y) => [x, y] as [number, number]),
    ),
  ]);
  const { chain } = getForagingRoute(grid, snake4);
  const heads = chain.map((s) => snakeToCells(s)[0]);
  const firstX = (bx: number) => heads.findIndex((h) => h.x === bx);
  // dense runs are dove into at their top-left corners, in order.
  expect(heads[firstX(5)]).toEqual({ x: 5, y: 0 });
  expect(heads[firstX(5) + 1]).toEqual({ x: 5, y: 1 });
  expect(heads[firstX(11)]).toEqual({ x: 11, y: 0 });
  expect(firstX(5)).toBeLessThan(firstX(11));
  let body = snakeToCells(snake4);
  for (const snake of chain) {
    const cells = snakeToCells(snake);
    const head = cells[0];
    expect(
      body.slice(0, -1).some((c) => c.x === head.x && c.y === head.y),
    ).toBe(false);
    body = cells;
  }
});

it("needs no stalls in the open with a short body", () => {
  const grid = withFoods(8, 8, [
    [1, 1],
    [6, 1],
    [3, 4],
  ]);
  const { stallsAt, chain } = getForagingRoute(grid, snake4);
  expect(stallsAt).toEqual([]);
  expect(chain.length).toBeLessThan(8 * 8);
});
