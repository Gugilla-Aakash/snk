import { getColor, isEmpty } from "@snk/types/grid";
import {
  getHeadX,
  getHeadY,
  nextSnake,
  snakeWillSelfCollide,
} from "@snk/types/snake";
import type { Snake } from "@snk/types/snake";
import type { Grid } from "@snk/types/grid";

export type RegionKind = "empty" | "green";
export type Region = { kind: RegionKind; from: number; to: number };
export type EntryCorner = "top-left" | "bottom-left";

/** week-columns containing at least one contribution. */
export const columnHasGreen = (grid: Grid, x: number): boolean => {
  for (let y = 0; y < grid.height; y++)
    if (!isEmpty(getColor(grid, x, y))) return true;
  return false;
};

/** split the columns into maximal runs of empty / green weeks. */
export const planRegions = (grid: Grid): Region[] => {
  const regions: Region[] = [];
  for (let x = 0; x < grid.width; x++) {
    const kind: RegionKind = columnHasGreen(grid, x) ? "green" : "empty";
    const last = regions[regions.length - 1];
    if (last && last.kind === kind) last.to = x;
    else regions.push({ kind, from: x, to: x });
  }
  return regions;
};

/**
 * tidy runs so every green dive starts at the top: drop non-last
 * single-column runs (they flip the chain height for no benefit) and steal
 * one column from the next empty run to even out non-last green widths.
 * coverage is always the full grid, so this only changes traversal order.
 */
export const fixRegions = (regions: Region[]): Region[] => {
  const list = regions.map((r) => ({ ...r }));
  const normalize = () => {
    for (let i = 0; i + 1 < list.length; ) {
      if (list[i].kind === list[i + 1].kind) {
        list[i].to = list[i + 1].to;
        list.splice(i + 1, 1);
      } else i++;
    }
  };

  for (let pass = 0; pass < 10; pass++) {
    normalize();
    const single = list.findIndex(
      (r, i) => i < list.length - 1 && r.to === r.from,
    );
    if (single < 0) break;
    list[single + 1].from = list[single].from;
    list.splice(single, 1);
  }
  normalize();

  for (let pass = 0; pass < 10; pass++) {
    normalize();
    const odd = list.findIndex(
      (r, i) =>
        i < list.length - 1 &&
        r.kind === "green" &&
        (r.to - r.from + 1) % 2 === 1,
    );
    if (odd < 0) break;
    list[odd].to += 1;
    list[odd + 1].from += 1;
    if (list[odd + 1].from > list[odd + 1].to) list.splice(odd + 1, 1);
  }
  normalize();

  return list;
};

/**
 * serpentine order covering columns x0..x1 (inclusive), every row exactly
 * once, starting at the given left-edge corner.
 * column-wise always exits on the right edge (top or bottom by width
 * parity). row-wise is kept for single strips only: with odd height it
 * exits on the right edge, otherwise chaining falls back to the solver.
 */
export const serpentineRect = (
  x0: number,
  x1: number,
  height: number,
  entry: EntryCorner,
  axis: "row" | "column",
): { x: number; y: number }[] => {
  const cells: { x: number; y: number }[] = [];

  if (axis === "row") {
    const rows: number[] = [];
    for (let y = 0; y < height; y++) rows.push(y);
    if (entry === "bottom-left") rows.reverse();
    rows.forEach((y, i) => {
      if (i % 2 === 0) for (let x = x0; x <= x1; x++) cells.push({ x, y });
      else for (let x = x1; x >= x0; x--) cells.push({ x, y });
    });
  } else {
    for (let x = x0; x <= x1; x++) {
      const firstDown = entry === "top-left";
      const down = (x - x0) % 2 === 0 ? firstDown : !firstDown;
      if (down) for (let y = 0; y < height; y++) cells.push({ x, y });
      else for (let y = height - 1; y >= 0; y--) cells.push({ x, y });
    }
  }

  return cells;
};

/**
 * horizontal sweep that exits on the same height it entered (top-right from
 * top-left, bottom-right from bottom-left): serpentine all but the last
 * column, then climb it toward the entry edge. needs odd height (true for
 * contribution grids); single columns fall back to a plain vertical pass.
 * ending every empty run at the top keeps each green dive top-down, so the
 * snake never turns its back on food it just faced.
 */
export const rowClimbRect = (
  x0: number,
  x1: number,
  height: number,
  entry: EntryCorner,
): { x: number; y: number }[] => {
  if (x1 <= x0) return serpentineRect(x0, x1, height, entry, "column");

  const cells = serpentineRect(x0, x1 - 1, height, entry, "row");
  const up = entry === "top-left";
  cells.push({ x: x1, y: up ? height - 1 : 0 });
  for (
    let y = (up ? height - 1 : 0) + (up ? -1 : 1);
    up ? y >= 0 : y < height;
    y += up ? -1 : 1
  )
    cells.push({ x: x1, y });
  return cells;
};

/**
 * adaptive sweep: fast horizontal passes over empty week-columns, vertical
 * eating passes where the greens are, every dive starting at the top.
 * visits every cell exactly once, so the grown body trailing behind the
 * head can never touch itself, at any length. linear time, no search.
 *
 * multi-region chaining assumes odd grid height (contribution grids are
 * always 7 tall); anything unexpected falls back to the solver route.
 * the loop restarts by snapping back to the start (no return crawl).
 */
export const getAdaptiveRoute = (
  grid: Grid,
  snake0: Snake,
): { chain: Snake[]; plan: string } => {
  const chain: Snake[] = [];
  let snake = snake0;

  const stepTo = (x: number, y: number) => {
    const dx = x - getHeadX(snake);
    const dy = y - getHeadY(snake);
    if (Math.abs(dx) + Math.abs(dy) !== 1)
      throw new Error(`adaptive route is not contiguous at (${x},${y})`);
    if (snakeWillSelfCollide(snake, dx, dy))
      throw new Error(`adaptive route collides with itself at (${x},${y})`);
    snake = nextSnake(snake, dx, dy);
    chain.push(snake);
  };

  const walk = (cells: { x: number; y: number }[]) => {
    const list = cells.slice();
    if (
      list.length &&
      list[0].x === getHeadX(snake) &&
      list[0].y === getHeadY(snake)
    )
      list.shift();
    for (const { x, y } of list) stepTo(x, y);
  };

  // entry: walk the off-grid head to the top-left corner.
  while (getHeadX(snake) !== 0 || getHeadY(snake) !== 0) {
    if (getHeadX(snake) !== 0)
      stepTo(getHeadX(snake) + Math.sign(0 - getHeadX(snake)), getHeadY(snake));
    else stepTo(0, getHeadY(snake) + Math.sign(0 - getHeadY(snake)));
  }

  const regions = fixRegions(planRegions(grid));
  const desc: string[] = [];
  let entry: EntryCorner = "top-left";
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    const last = i === regions.length - 1;
    if (r.kind === "green") {
      walk(serpentineRect(r.from, r.to, grid.height, entry, "column"));
      desc.push(`green ${r.from}-${r.to} column-wise`);
    } else if (last) {
      // nothing chains after this: exit corner is irrelevant.
      walk(serpentineRect(r.from, r.to, grid.height, entry, "row"));
      desc.push(`empty ${r.from}-${r.to} row-wise`);
    } else {
      // height-preserving climb so the next dive starts at the top.
      // needs odd height; otherwise stepTo throws and the caller falls back.
      walk(rowClimbRect(r.from, r.to, grid.height, entry));
      desc.push(`empty ${r.from}-${r.to} row-wise`);
    }
    entry = getHeadY(snake) === 0 ? "top-left" : "bottom-left";
  }

  return { chain, plan: desc.join(" | ") };
};
