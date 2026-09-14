import { it, expect } from "bun:test";
import { createEmptyGrid } from "@snk/types/grid";
import { snakeToCells } from "@snk/types/snake";
import { snake4 } from "@snk/types/__fixtures__/snake";
import {
  getHamiltonianRoute,
  pickOrientation,
  type SweepOrientation,
} from "../hamiltonianRoute";

const sizes: [number, number][] = [
  [53, 7],
  [5, 3],
  [4, 4],
  [2, 2],
  [1, 1],
];

for (const orientation of ["row-wise", "column-wise"] as SweepOrientation[]) {
  for (const [w, h] of sizes) {
    it(`sweeps every cell exactly once, never touching itself (${orientation} ${w}x${h})`, () => {
      const grid = createEmptyGrid(w, h);
      const chain = getHamiltonianRoute(grid, snake4, orientation);

      expect(chain.length).toBe(w * h);

      // contiguous single-cell moves, starting from the initial head.
      let prev = snakeToCells(snake4)[0];
      const visits = new Map<string, number>();
      for (const snake of chain) {
        const head = snakeToCells(snake)[0];
        expect(Math.abs(head.x - prev.x) + Math.abs(head.y - prev.y)).toBe(1);
        visits.set(
          `${head.x},${head.y}`,
          (visits.get(`${head.x},${head.y}`) ?? 0) + 1,
        );
        prev = head;
      }

      // every grid cell visited exactly once.
      expect(visits.size).toBe(w * h);
      for (const count of visits.values()) expect(count).toBe(1);

      // nokia rule: head never steps onto its own body (tail tip excluded).
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
  }
}

it("picks a valid orientation", () => {
  for (let i = 0; i < 20; i++)
    expect(["row-wise", "column-wise"]).toContain(pickOrientation());
});
