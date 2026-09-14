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
 * serpentine order covering columns x0..x1 (inclusive), every row exactly
 * once, starting at the given left-edge corner.
 * row-wise ends on the right edge after an even/odd row count, column-wise
 * ends on the right edge top or bottom by width parity: either way the exit
 * is a right-edge corner, so strips chain left to right.
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
 * adaptive sweep: fast horizontal passes over empty week-columns, vertical
 * eating passes where the greens are. visits every cell exactly once, so the
 * grown body trailing behind the head can never touch itself, at any length.
 * no search involved: runs in linear time on any grid size.
 *
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

  const regions = planRegions(grid);
  const desc: string[] = [];
  let entry: EntryCorner = "top-left";
  for (const r of regions) {
    const axis = r.kind === "green" ? "column" : "row";
    walk(serpentineRect(r.from, r.to, grid.height, entry, axis));
    desc.push(`${r.kind} ${r.from}-${r.to} ${axis}-wise`);
    entry = getHeadY(snake) === 0 ? "top-left" : "bottom-left";
  }

  return { chain, plan: desc.join(" | ") };
};
