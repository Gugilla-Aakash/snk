import { it, expect } from "bun:test";
import { Color, createEmptyGrid, setColor, type Grid } from "@snk/types/grid";
import { snakeToCells } from "@snk/types/snake";
import { snake4 } from "@snk/types/__fixtures__/snake";
import {
  getAdaptiveRoute,
  planRegions,
  serpentineRect,
  type EntryCorner,
} from "../hamiltonianRoute";

const withGreens = (w: number, h: number, greenCols: number[]): Grid => {
  const grid = createEmptyGrid(w, h);
  for (const x of greenCols)
    for (let y = 0; y < h; y++) setColor(grid, x, y, 1 as Color);
  return grid;
};

/** full route contract: contiguous, covers every cell once, never touches. */
const checkRoute = (grid: Grid, label: string) => {
  const { chain, plan } = getAdaptiveRoute(grid, snake4);

  expect(chain.length).toBe(grid.width * grid.height);

  let prev = snakeToCells(snake4)[0];
  const visits = new Map<string, number>();
  for (const snake of chain) {
    const head = snakeToCells(snake)[0];
    expect(Math.abs(head.x - prev.x) + Math.abs(head.y - prev.y)).toBe(1);
    if (head.x >= 0 && head.y >= 0)
      visits.set(
        `${head.x},${head.y}`,
        (visits.get(`${head.x},${head.y}`) ?? 0) + 1,
      );
    prev = head;
  }

  expect(visits.size).toBe(grid.width * grid.height);
  for (const count of visits.values()) expect(count).toBe(1);

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

  return plan;
};

it("sweeps an all-empty grid row-wise", () => {
  const plan = checkRoute(withGreens(10, 7, []), "all-empty");
  expect(plan).toBe("empty 0-9 row-wise");
});

it("sweeps an all-green grid column-wise", () => {
  const plan = checkRoute(withGreens(6, 7, [0, 1, 2, 3, 4, 5]), "all-green");
  expect(plan).toBe("green 0-5 column-wise");
});

it("goes horizontal over empty weeks, vertical over green weeks", () => {
  const grid = withGreens(10, 7, [7, 8]);
  expect(planRegions(grid)).toEqual([
    { kind: "empty", from: 0, to: 6 },
    { kind: "green", from: 7, to: 8 },
    { kind: "empty", from: 9, to: 9 },
  ]);

  const plan = checkRoute(grid, "mixed");
  expect(plan).toBe(
    "empty 0-6 row-wise | green 7-8 column-wise | empty 9-9 row-wise",
  );

  // pins the behavior: horizontal run, then a vertical dive into the greens.
  const { chain } = getAdaptiveRoute(grid, snake4);
  const head = (i: number) => snakeToCells(chain[i])[0];
  expect(head(0)).toEqual({ x: 0, y: 0 });
  expect(head(1)).toEqual({ x: 1, y: 0 });
  expect(head(48)).toEqual({ x: 6, y: 6 });
  expect(head(49)).toEqual({ x: 7, y: 6 });
  expect(head(50)).toEqual({ x: 7, y: 5 });
});

it("handles stray single green columns and odd heights", () => {
  checkRoute(withGreens(9, 3, [1, 5]), "strays 9x3");
  checkRoute(withGreens(9, 5, [0, 8]), "edges 9x5");
  checkRoute(
    withGreens(53, 7, [20, 45, 46, 47, 48, 49, 50, 51, 52]),
    "real-shape",
  );
});

it("covers single strips of even height", () => {
  checkRoute(withGreens(4, 4, [0, 1, 2, 3]), "all-green 4x4");
  checkRoute(withGreens(4, 4, []), "all-empty 4x4");
  checkRoute(withGreens(2, 2, [1]), "tiny mixed");
  checkRoute(withGreens(1, 1, [0]), "single cell");
});

it("serpentineRect starts at the entry corner and covers the rect", () => {
  const corners: Record<EntryCorner, { x: number; y: number }> = {
    "top-left": { x: 2, y: 0 },
    "bottom-left": { x: 2, y: 4 },
  };
  for (const [entry, first] of Object.entries(corners) as [
    EntryCorner,
    { x: number; y: number },
  ][]) {
    for (const axis of ["row", "column"] as const) {
      const cells = serpentineRect(2, 5, 5, entry, axis);
      expect(cells[0]).toEqual(first);
      expect(cells.length).toBe(4 * 5);
      expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(4 * 5);
      for (let i = 1; i < cells.length; i++)
        expect(
          Math.abs(cells[i].x - cells[i - 1].x) +
            Math.abs(cells[i].y - cells[i - 1].y),
        ).toBe(1);
    }
  }
});
