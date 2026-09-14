import {
  getHeadX,
  getHeadY,
  nextSnake,
  snakeWillSelfCollide,
} from "@snk/types/snake";
import type { Snake } from "@snk/types/snake";
import type { Grid } from "@snk/types/grid";

export type SweepOrientation = "row-wise" | "column-wise";

export const ORIENTATIONS: SweepOrientation[] = ["row-wise", "column-wise"];

export const pickOrientation = (): SweepOrientation =>
  ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)];

/**
 * serpentine (boustrophedon) order visiting every grid cell exactly once,
 * starting at the top-left corner.
 */
export const sweepCells = (
  grid: Grid,
  orientation: SweepOrientation,
): { x: number; y: number }[] => {
  const cells: { x: number; y: number }[] = [];

  if (orientation === "row-wise") {
    for (let y = 0; y < grid.height; y++) {
      if (y % 2 === 0)
        for (let x = 0; x < grid.width; x++) cells.push({ x, y });
      else for (let x = grid.width - 1; x >= 0; x--) cells.push({ x, y });
    }
  } else {
    for (let x = 0; x < grid.width; x++) {
      if (x % 2 === 0)
        for (let y = 0; y < grid.height; y++) cells.push({ x, y });
      else for (let y = grid.height - 1; y >= 0; y--) cells.push({ x, y });
    }
  }

  return cells;
};

/**
 * hamiltonian sweep route: walk every grid cell exactly once, so the grown
 * body trailing behind the head can never touch itself, at any length.
 * no search involved: runs in linear time on any grid size.
 *
 * the loop restarts by snapping back to the start (no return crawl).
 */
export const getHamiltonianRoute = (
  grid: Grid,
  snake0: Snake,
  orientation: SweepOrientation,
): Snake[] => {
  const chain: Snake[] = [];
  let snake = snake0;

  const stepTo = (x: number, y: number) => {
    const dx = x - getHeadX(snake);
    const dy = y - getHeadY(snake);
    if (Math.abs(dx) + Math.abs(dy) !== 1)
      throw new Error(`hamiltonian route is not contiguous at (${x},${y})`);
    if (snakeWillSelfCollide(snake, dx, dy))
      throw new Error(`hamiltonian route collides with itself at (${x},${y})`);
    snake = nextSnake(snake, dx, dy);
    chain.push(snake);
  };

  // entry: walk the off-grid head to the top-left corner.
  while (getHeadX(snake) !== 0 || getHeadY(snake) !== 0) {
    if (getHeadX(snake) !== 0)
      stepTo(getHeadX(snake) + Math.sign(0 - getHeadX(snake)), getHeadY(snake));
    else stepTo(0, getHeadY(snake) + Math.sign(0 - getHeadY(snake)));
  }

  for (const { x, y } of sweepCells(grid, orientation).slice(1)) stepTo(x, y);

  return chain;
};
