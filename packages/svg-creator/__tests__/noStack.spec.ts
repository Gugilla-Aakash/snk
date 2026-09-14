import { it, expect } from "bun:test";
import { createSnake } from "../snake";
import { createSnakeFromCells } from "@snk/types/snake";

// the solver only avoids its short body, so when the trail loops back a
// grown tail segment can land on the head's cell (nokia death). the renderer
// must never draw that: the segment closest to the head wins the cell.
it("grown tail never shares the head cell in one frame", () => {
  const sizeCell = 16;

  // approach (no 3-in-a-row, so no keyframe is dropped) then a 4-cycle loop.
  const heads = [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
  ];
  const prev = [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
  ];

  const chain = heads.map((_, k) =>
    createSnakeFromCells([
      heads[k],
      ...(k >= 1 ? [heads[k - 1]] : []),
      ...(k >= 2 ? [heads[k - 2]] : []),
      ...(k >= 3 ? [heads[k - 3]] : []),
      ...prev.slice(0, Math.max(0, 3 - k)),
    ]),
  );

  // one eat per step: visible body grows 4 -> 12, forcing grown segments
  // onto trail cells the head later revisits (e.g. step 5).
  const eaten = chain.map((_, i) => i);

  const { styles } = createSnake(
    chain,
    { sizeCell, sizeDot: 12, colorSnake: "purple" },
    1000,
    eaten,
  );
  const css = styles.join("\n");

  const keyframesOf = (seg: number): Map<number, string> => {
    const start = css.indexOf(`@keyframes s${seg}{`);
    expect(start).toBeGreaterThan(-1);
    let depth = 0;
    let end = start;
    for (let i = start; i < css.length; i++) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const body = css.slice(start, end);
    const map = new Map<number, string>();
    for (const m of body.matchAll(/([0-9.,%]+)\{([^}]*)\}/g)) {
      for (const pct of m[1].split(",")) {
        const t = parseFloat(pct.replace("%", "")) / 100;
        map.set(Math.round(t * chain.length), m[2]);
      }
    }
    return map;
  };

  const cellOf = (style: string) => {
    const m = style.match(/translate\(([0-9.\-]+)px,([0-9.\-]+)px\)/);
    return `${Math.round(parseFloat(m![1]) / sizeCell)},${Math.round(parseFloat(m![2]) / sizeCell)}`;
  };

  const visibleAt = (step: number) => 4 + eaten[step];
  let checked = 0;
  for (let seg = 1; seg < visibleAt(chain.length - 1); seg++) {
    for (const [step, style] of keyframesOf(seg)) {
      if (step >= chain.length || seg >= visibleAt(step)) continue;
      const head = heads[step];
      expect(cellOf(style)).not.toBe(`${head.x},${head.y}`);
      checked++;
    }
  }
  // the loop really does revisit cells, so this must cover those frames.
  expect(checked).toBeGreaterThan(20);
});
