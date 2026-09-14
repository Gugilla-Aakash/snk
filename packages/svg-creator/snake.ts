import { getSnakeLength, snakeToCells } from "@snk/types/snake";
import type { Snake } from "@snk/types/snake";
import type { Point } from "@snk/types/point";
import { h } from "./xml-utils";
import { createAnimation } from "./css-utils";

export type Options = {
  colorSnake: string;
  sizeCell: number;
  sizeDot: number;
};

export type GrowthOptions = {
  /**
   * maximum number of snake segments (head included).
   * the snake grows by one segment per eaten cell, up to this limit,
   * so the generated svg stays reasonably sized.
   */
  maxSnakeLength?: number;
};

const DEFAULT_MAX_SNAKE_LENGTH = 48;

const lerp = (k: number, a: number, b: number) => (1 - k) * a + k * b;

export const createSnake = (
  chain: Snake[],
  { sizeCell, sizeDot }: Options,
  duration: number,
  eatenCountPerStep: number[] = [],
  growth?: GrowthOptions,
) => {
  const baseLength = chain[0] ? getSnakeLength(chain[0]) : 0;
  const maxLength = growth?.maxSnakeLength ?? DEFAULT_MAX_SNAKE_LENGTH;

  // visible body length at each step: grows by one segment per eaten cell.
  const visibleLengthAt = (step: number) =>
    Math.min(baseLength + (eatenCountPerStep[step] ?? 0), maxLength);

  const snakeN = chain.length ? visibleLengthAt(chain.length - 1) : 0;

  const frames = chain.map((snake) => snakeToCells(snake));

  // positions of every segment, for every step.
  // segments that don't exist yet are parked on the tail (hidden inside it),
  // grown segments trail the recent positions of the tail.
  const snakeParts: Point[][] = Array.from({ length: snakeN }, () => []);

  for (let step = 0; step < chain.length; step++) {
    const cells = frames[step];
    const tail = cells[cells.length - 1];
    const visible = visibleLengthAt(step);

    for (let i = 0; i < snakeN; i++) {
      if (i < cells.length) snakeParts[i].push(cells[i]);
      else if (i < visible) {
        // grown segment: follow where the tail was a few steps ago.
        // segments can't outgrow elapsed steps (max one eat per step),
        // so step - back is always >= 0 in practice (clamped for safety).
        const back = i - cells.length + 1;
        const past = frames[Math.max(0, step - back)];
        snakeParts[i].push(past[past.length - 1]);
      } else snakeParts[i].push(tail);
    }
  }

  const svgElements = snakeParts.map((_, i, { length }) => {
    // compute snake part size
    const dMin = sizeDot * 0.8;
    const dMax = sizeCell * 0.9;
    const iMax = Math.min(4, length);
    const u = (1 - Math.min(i, iMax) / iMax) ** 2;
    const s = lerp(u, dMin, dMax);

    const m = (sizeCell - s) / 2;

    const r = Math.min(4.5, (4 * s) / sizeDot);

    return h("rect", {
      class: `s s${i}`,
      x: m.toFixed(1),
      y: m.toFixed(1),
      width: s.toFixed(1),
      height: s.toFixed(1),
      rx: r.toFixed(1),
      ry: r.toFixed(1),
    });
  });

  const transform = ({ x, y }: Point) =>
    `transform:translate(${x * sizeCell}px,${y * sizeCell}px)`;

  const styles = [
    `.s{ 
      shape-rendering: geometricPrecision;
      fill: var(--cs);
      animation: none linear ${duration}ms infinite
    }`,

    ...snakeParts.map((positions, i) => {
      const id = `s${i}`;
      const animationName = id;

      const keyframes = removeInterpolatedPositions(
        positions.map((tr, i, { length }) => ({ ...tr, t: i / length })),
      ).map(({ t, ...p }) => ({ t, style: transform(p) }));

      return [
        createAnimation(animationName, keyframes),

        `.s.${id}{
          ${transform(positions[0])};
          animation-name: ${animationName}
        }`,
      ];
    }),
  ].flat();

  return { svgElements, styles };
};

const removeInterpolatedPositions = <T extends Point>(arr: T[]) =>
  arr.filter((u, i, arr) => {
    if (i - 1 < 0 || i + 1 >= arr.length) return true;

    const a = arr[i - 1];
    const b = arr[i + 1];

    const ex = (a.x + b.x) / 2;
    const ey = (a.y + b.y) / 2;

    // return true;
    return !(Math.abs(ex - u.x) < 0.01 && Math.abs(ey - u.y) < 0.01);
  });
