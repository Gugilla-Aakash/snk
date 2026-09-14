import { it, expect } from "bun:test";
import { Color, createEmptyGrid, type Grid } from "@snk/types/grid";
import { setColor } from "@snk/types/grid";
import { snakeToCells } from "@snk/types/snake";
import { snake4 } from "@snk/types/__fixtures__/snake";
import {
  fixRegions,
  getAdaptiveRoute,
  planRegions,
  rowClimbRect,
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

it("dives into greens from the top instead of turning away", () => {
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

  // horizontal run, climb, then straight down into the greens.
  const { chain } = getAdaptiveRoute(grid, snake4);
  const head = (i: number) => snakeToCells(chain[i])[0];
  expect(head(0)).toEqual({ x: 0, y: 0 });
  expect(head(1)).toEqual({ x: 1, y: 0 });
  expect(head(48)).toEqual({ x: 6, y: 0 });
  expect(head(49)).toEqual({ x: 7, y: 0 });
  expect(head(50)).toEqual({ x: 7, y: 1 });
});

it("absorbs stray single green columns into horizontal runs", () => {
  const grid = withGreens(9, 7, [4]);
  expect(fixRegions(planRegions(grid))).toEqual([
    { kind: "empty", from: 0, to: 8 },
  ]);
  checkRoute(grid, "stray");
});

it("evens out odd green widths so every dive starts at the top", () => {
  const grid = withGreens(11, 7, [4, 5, 6]);
  expect(fixRegions(planRegions(grid))).toEqual([
    { kind: "empty", from: 0, to: 3 },
    { kind: "green", from: 4, to: 7 },
    { kind: "empty", from: 8, to: 10 },
  ]);
  checkRoute(grid, "odd-green");

  const { chain } = getAdaptiveRoute(grid, snake4);
  const head = (i: number) => snakeToCells(chain[i])[0];
  // empty 0-3 row-wise with climb: 3x7 sub + 7 climb = 28 cells.
  expect(head(27)).toEqual({ x: 3, y: 0 });
  expect(head(28)).toEqual({ x: 4, y: 0 });
  expect(head(29)).toEqual({ x: 4, y: 1 });
});

it("handles the real-world region shape", () => {
  const grid = withGreens(
    53,
    7,
    [2, 3, 8, 9, 22, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
  );
  expect(fixRegions(planRegions(grid))).toEqual([
    { kind: "empty", from: 0, to: 1 },
    { kind: "green", from: 2, to: 3 },
    { kind: "empty", from: 4, to: 7 },
    { kind: "green", from: 8, to: 9 },
    { kind: "empty", from: 10, to: 42 },
    { kind: "green", from: 43, to: 52 },
  ]);
  const plan = checkRoute(grid, "real-shape");
  expect(plan).toBe(
    "empty 0-1 row-wise | green 2-3 column-wise | empty 4-7 row-wise | " +
      "green 8-9 column-wise | empty 10-42 row-wise | green 43-52 column-wise",
  );
});

it("covers single strips of even height", () => {
  checkRoute(withGreens(4, 4, [0, 1, 2, 3]), "all-green 4x4");
  checkRoute(withGreens(4, 4, []), "all-empty 4x4");
  checkRoute(withGreens(2, 2, [1]), "tiny mixed");
  checkRoute(withGreens(1, 1, [0]), "single cell");
});

it("rowClimbRect exits on the height it entered", () => {
  for (const [entry, first, last] of [
    ["top-left", { x: 2, y: 0 }, { x: 5, y: 0 }],
    ["bottom-left", { x: 2, y: 4 }, { x: 5, y: 4 }],
  ] as [EntryCorner, { x: number; y: number }, { x: number; y: number }][]) {
    const cells = rowClimbRect(2, 5, 5, entry);
    expect(cells[0]).toEqual(first);
    expect(cells[cells.length - 1]).toEqual(last);
    expect(cells.length).toBe(4 * 5);
    expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(4 * 5);
    for (let i = 1; i < cells.length; i++)
      expect(
        Math.abs(cells[i].x - cells[i - 1].x) +
          Math.abs(cells[i].y - cells[i - 1].y),
      ).toBe(1);
  }
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
