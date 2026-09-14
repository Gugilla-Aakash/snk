var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __esm = (fn, res, err) => () => {
  if (fn)
    try {
      res = fn(fn = 0);
    } catch (e) {
      err = [e];
    }
  if (err)
    throw err[0];
  return res;
};

// ../types/grid.ts
var isInside = (grid, x, y) => x >= 0 && y >= 0 && x < grid.width && y < grid.height, isInsideLarge = (grid, m, x, y) => x >= -m && y >= -m && x < grid.width + m && y < grid.height + m, copyGrid = ({ width, height, data }) => ({
  width,
  height,
  data: Uint8Array.from(data)
}), getIndex = (grid, x, y) => x * grid.height + y, getColor = (grid, x, y) => grid.data[getIndex(grid, x, y)], isEmpty = (color) => color === 0, setColor = (grid, x, y, color) => {
  grid.data[getIndex(grid, x, y)] = color || 0;
}, setColorEmpty = (grid, x, y) => {
  setColor(grid, x, y, 0);
}, createEmptyGrid = (width, height) => ({
  width,
  height,
  data: new Uint8Array(width * height)
});

// ../types/snake.ts
var getHeadX = (snake) => snake[0] - 2, getHeadY = (snake) => snake[1] - 2, getSnakeLength = (snake) => snake.length / 2, snakeEquals = (a, b) => {
  for (let i = 0;i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}, nextSnake = (snake, dx, dy) => {
  const copy = new Uint8Array(snake.length);
  for (let i = 2;i < snake.length; i++)
    copy[i] = snake[i - 2];
  copy[0] = snake[0] + dx;
  copy[1] = snake[1] + dy;
  return copy;
}, snakeWillSelfCollide = (snake, dx, dy) => {
  const nx = snake[0] + dx;
  const ny = snake[1] + dy;
  for (let i = 2;i < snake.length - 2; i += 2)
    if (snake[i + 0] === nx && snake[i + 1] === ny)
      return true;
  return false;
}, snakeToCells = (snake) => Array.from({ length: snake.length / 2 }, (_, i) => ({
  x: snake[i * 2 + 0] - 2,
  y: snake[i * 2 + 1] - 2
})), createSnakeFromCells = (points) => {
  const snake = new Uint8Array(points.length * 2);
  for (let i = points.length;i--; ) {
    snake[i * 2 + 0] = points[i].x + 2;
    snake[i * 2 + 1] = points[i].y + 2;
  }
  return snake;
};

// ../svg-creator/xml-utils.ts
var h = (element, attributes) => `<${element} ${toAttribute(attributes)}/>`, toAttribute = (o) => Object.entries(o).filter(([, value]) => value !== null).map(([name, value]) => `${name}="${value}"`).join(" ");

// ../svg-creator/css-utils.ts
var percent = (x) => parseFloat((x * 100).toFixed(2)).toString() + "%", mergeKeyFrames = (keyframes) => {
  const s = new Map;
  for (const { t, style } of keyframes) {
    s.set(style, [...s.get(style) ?? [], t]);
  }
  return Array.from(s.entries()).map(([style, ts]) => ({ style, ts })).sort((a, b) => a.ts[0] - b.ts[0]);
}, createAnimation = (name, keyframes) => `@keyframes ${name}{` + mergeKeyFrames(keyframes).map(({ style, ts }) => ts.map(percent).join(",") + `{${style}}`).join("") + "}", minifyCss = (css) => css.replace(/\s+/g, " ").replace(/.\s+[,;:{}()]/g, (a) => a.replace(/\s+/g, "")).replace(/[,;:{}()]\s+./g, (a) => a.replace(/\s+/g, "")).replace(/.\s+[,;:{}()]/g, (a) => a.replace(/\s+/g, "")).replace(/[,;:{}()]\s+./g, (a) => a.replace(/\s+/g, "")).replace(/\;\s*\}/g, "}").trim();

// ../svg-creator/snake.ts
var DEFAULT_MAX_SNAKE_LENGTH = 48, lerp = (k, a, b) => (1 - k) * a + k * b, createSnake = (chain, { sizeCell, sizeDot }, duration, eatenCountPerStep = [], growth) => {
  const baseLength = chain[0] ? getSnakeLength(chain[0]) : 0;
  const maxLength = growth?.maxSnakeLength ?? DEFAULT_MAX_SNAKE_LENGTH;
  const visibleLengthAt = (step) => Math.min(baseLength + (eatenCountPerStep[step] ?? 0), maxLength);
  const snakeN = chain.length ? visibleLengthAt(chain.length - 1) : 0;
  const frames = chain.map((snake) => snakeToCells(snake));
  const snakeParts = Array.from({ length: snakeN }, () => []);
  for (let step = 0;step < chain.length; step++) {
    const cells = frames[step];
    const tail = cells[cells.length - 1];
    const visible = visibleLengthAt(step);
    const raw = [];
    for (let i = 0;i < visible; i++) {
      if (i < cells.length)
        raw.push(cells[i]);
      else {
        const back = i - cells.length + 1;
        const past = frames[Math.max(0, step - back)];
        raw.push(past[past.length - 1]);
      }
    }
    const used = new Set;
    for (let i = 0;i < snakeN; i++) {
      if (i >= visible) {
        snakeParts[i].push(tail);
        continue;
      }
      const p = raw[i];
      const key = p.x + "," + p.y;
      if (used.has(key))
        snakeParts[i].push(tail);
      else {
        used.add(key);
        snakeParts[i].push(p);
      }
    }
  }
  const svgElements = snakeParts.map((_, i, { length }) => {
    const dMin = sizeDot * 0.8;
    const dMax = sizeCell * 0.9;
    const iMax = Math.min(4, length);
    const u = (1 - Math.min(i, iMax) / iMax) ** 2;
    const s = lerp(u, dMin, dMax);
    const m = (sizeCell - s) / 2;
    const r = Math.min(4.5, 4 * s / sizeDot);
    return h("rect", {
      class: `s s${i}`,
      x: m.toFixed(1),
      y: m.toFixed(1),
      width: s.toFixed(1),
      height: s.toFixed(1),
      rx: r.toFixed(1),
      ry: r.toFixed(1)
    });
  });
  const transform = ({ x, y }) => `transform:translate(${x * sizeCell}px,${y * sizeCell}px)`;
  const styles = [
    `.s{ 
      shape-rendering: geometricPrecision;
      fill: var(--cs);
      animation: none linear ${duration}ms infinite
    }`,
    ...snakeParts.map((positions, i) => {
      const id = `s${i}`;
      const animationName = id;
      const keyframes = removeInterpolatedPositions(positions.map((tr, i, { length }) => ({ ...tr, t: i / length }))).map(({ t, ...p }) => ({ t, style: transform(p) }));
      return [
        createAnimation(animationName, keyframes),
        `.s.${id}{
          ${transform(positions[0])};
          animation-name: ${animationName}
        }`
      ];
    })
  ].flat();
  return { svgElements, styles };
}, removeInterpolatedPositions = (arr) => arr.filter((u, i, arr) => {
  if (i - 1 < 0 || i + 1 >= arr.length)
    return true;
  const a = arr[i - 1];
  const b = arr[i + 1];
  const ex = (a.x + b.x) / 2;
  const ey = (a.y + b.y) / 2;
  return !(Math.abs(ex - u.x) < 0.01 && Math.abs(ey - u.y) < 0.01);
});
var init_snake = () => {};

// ../svg-creator/grid.ts
var createGrid = (cells, { sizeDotBorderRadius, sizeDot, sizeCell }, duration) => {
  const svgElements = [];
  const styles = [
    `.c{
      shape-rendering: geometricPrecision;
      fill: var(--ce);
      stroke-width: 1px;
      stroke: var(--cb);
      animation: none ${duration}ms linear infinite;
      width: ${sizeDot}px;
      height: ${sizeDot}px;
    }`
  ];
  let i = 0;
  for (const { x, y, color, t } of cells) {
    const id = t && "c" + (i++).toString(36);
    const m = (sizeCell - sizeDot) / 2;
    if (t !== null && id) {
      const animationName = id;
      styles.push(createAnimation(animationName, [
        { t: t - 0.0001, style: `fill:var(--c${color})` },
        { t: t + 0.0001, style: `fill:var(--ce)` },
        { t: 1, style: `fill:var(--ce)` }
      ]), `.c.${id}{
          fill: var(--c${color});
          animation-name: ${animationName}
        }`);
    }
    svgElements.push(h("rect", {
      class: ["c", id].filter(Boolean).join(" "),
      x: x * sizeCell + m,
      y: y * sizeCell + m,
      rx: sizeDotBorderRadius,
      ry: sizeDotBorderRadius
    }));
  }
  return { svgElements, styles };
};
var init_grid = () => {};

// ../svg-creator/stack.ts
var createStack = (cells, { sizeDot }, width, y, duration) => {
  const svgElements = [];
  const styles = [
    `.u{ 
      transform-origin: 0 0;
      transform: scale(0,1);
      animation: none linear ${duration}ms infinite;
    }`
  ];
  const stack = cells.slice().filter((a) => a.t !== null).sort((a, b) => a.t - b.t);
  const blocks = [];
  stack.forEach(({ color, t }) => {
    const latest = blocks[blocks.length - 1];
    if (latest?.color === color)
      latest.ts.push(t);
    else
      blocks.push({ color, ts: [t] });
  });
  const m = width / stack.length;
  let i = 0;
  let nx = 0;
  for (const { color, ts } of blocks) {
    const id = "u" + (i++).toString(36);
    const animationName = id;
    const x = (nx * m).toFixed(1);
    nx += ts.length;
    svgElements.push(h("rect", {
      class: `u ${id}`,
      height: sizeDot,
      width: (ts.length * m + 0.6).toFixed(1),
      x,
      y
    }));
    styles.push(createAnimation(animationName, [
      ...ts.map((t, i, { length }) => [
        { scale: i / length, t: t - 0.0001 },
        { scale: (i + 1) / length, t: t + 0.0001 }
      ]).flat(),
      { scale: 1, t: 1 }
    ].map(({ scale, t }) => ({
      t,
      style: `transform:scale(${scale.toFixed(3)},1)`
    }))), `.u.${id} {
        fill: var(--c${color});
        animation-name: ${animationName};
        transform-origin: ${x}px 0
      }
      `);
  }
  return { svgElements, styles };
};
var init_stack = () => {};

// ../svg-creator/index.ts
var getCellsFromGrid = ({ width, height }) => Array.from({ length: width }, (_, x) => Array.from({ length: height }, (_, y) => ({ x, y }))).flat(), createLivingCells = (grid0, chain, cells) => {
  const livingCells = (cells ?? getCellsFromGrid(grid0)).map(({ x, y }) => ({
    x,
    y,
    t: null,
    color: getColor(grid0, x, y)
  }));
  const grid = copyGrid(grid0);
  for (let i = 0;i < chain.length; i++) {
    const snake = chain[i];
    const x = getHeadX(snake);
    const y = getHeadY(snake);
    if (isInside(grid, x, y) && !isEmpty(getColor(grid, x, y))) {
      setColorEmpty(grid, x, y);
      const cell = livingCells.find((c) => c.x === x && c.y === y);
      cell.t = i / chain.length;
    }
  }
  return livingCells;
}, getEatenCountPerStep = (grid0, chain) => {
  const grid = copyGrid(grid0);
  let eaten = 0;
  return chain.map((snake) => {
    const x = getHeadX(snake);
    const y = getHeadY(snake);
    if (isInside(grid, x, y) && !isEmpty(getColor(grid, x, y))) {
      setColorEmpty(grid, x, y);
      eaten++;
    }
    return eaten;
  });
}, createSvg = (grid, cells, chain, drawOptions, animationOptions) => {
  const width = (grid.width + 2) * drawOptions.sizeCell;
  const height = (grid.height + 5) * drawOptions.sizeCell;
  const duration = animationOptions.stepDurationMs * chain.length;
  const livingCells = createLivingCells(grid, chain, cells);
  const elements = [
    createGrid(livingCells, drawOptions, duration),
    createStack(livingCells, drawOptions, grid.width * drawOptions.sizeCell, (grid.height + 2) * drawOptions.sizeCell, duration),
    createSnake(chain, drawOptions, duration, getEatenCountPerStep(grid, chain))
  ];
  const viewBox = [
    -drawOptions.sizeCell,
    -drawOptions.sizeCell * 2,
    width,
    height
  ].join(" ");
  const style = generateColorVar(drawOptions) + elements.map((e) => e.styles).flat().join(`
`);
  const svg = [
    h("svg", {
      viewBox,
      width,
      height,
      xmlns: "http://www.w3.org/2000/svg"
    }).replace("/>", ">"),
    "<desc>",
    "Generated with https://github.com/Platane/snk",
    "</desc>",
    "<style>",
    optimizeCss(style),
    "</style>",
    ...elements.map((e) => e.svgElements).flat(),
    "</svg>"
  ].join("");
  return optimizeSvg(svg);
}, optimizeCss = (css) => minifyCss(css), optimizeSvg = (svg) => svg, generateColorVar = (drawOptions) => `
    :root {
    --cb: ${drawOptions.colorDotBorder};
    --cs: ${drawOptions.colorSnake};
    --ce: ${drawOptions.colorEmpty};
    ${Object.entries(drawOptions.colorDots).map(([i, color]) => `--c${i}:${color};`).join("")}
    }
    ` + (drawOptions.dark ? `
    @media (prefers-color-scheme: dark) {
      :root {
        --cb: ${drawOptions.dark.colorDotBorder || drawOptions.colorDotBorder};
        --cs: ${drawOptions.dark.colorSnake || drawOptions.colorSnake};
        --ce: ${drawOptions.dark.colorEmpty};
        ${Object.entries(drawOptions.dark.colorDots).map(([i, color]) => `--c${i}:${color};`).join("")}
      }
    }
` : "");
var init_svg_creator = __esm(() => {
  init_snake();
  init_grid();
  init_stack();
});

// ../draw/pathRoundedRect.ts
var pathRoundedRect = (ctx, width, height, borderRadius) => {
  ctx.moveTo(borderRadius, 0);
  ctx.arcTo(width, 0, width, height, borderRadius);
  ctx.arcTo(width, height, 0, height, borderRadius);
  ctx.arcTo(0, height, 0, 0, borderRadius);
  ctx.arcTo(0, 0, width, 0, borderRadius);
};

// ../draw/drawGrid.ts
var drawGrid = (ctx, grid, cells, o) => {
  for (let x = grid.width;x--; )
    for (let y = grid.height;y--; ) {
      if (!cells || cells.some((c) => c.x === x && c.y === y)) {
        const c = getColor(grid, x, y);
        const color = !c ? o.colorEmpty : o.colorDots[c];
        ctx.save();
        ctx.translate(x * o.sizeCell + (o.sizeCell - o.sizeDot) / 2, y * o.sizeCell + (o.sizeCell - o.sizeDot) / 2);
        ctx.fillStyle = color;
        ctx.strokeStyle = o.colorDotBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        pathRoundedRect(ctx, o.sizeDot, o.sizeDot, o.sizeDotBorderRadius);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      }
    }
};
var init_drawGrid = () => {};

// ../draw/drawSnake.ts
var lerp2 = (k, a, b) => (1 - k) * a + k * b, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), drawSnakeLerp = (ctx, snake0, snake1, k, o) => {
  const m = 0.8;
  const n = snake0.length / 2;
  for (let i = 0;i < n; i++) {
    const u = (i + 1) * 0.6 * (o.sizeCell / 16);
    const a = (1 - m) * (i / Math.max(n - 1, 1));
    const ki = clamp((k - a) / m, 0, 1);
    const x = lerp2(ki, snake0[i * 2 + 0], snake1[i * 2 + 0]) - 2;
    const y = lerp2(ki, snake0[i * 2 + 1], snake1[i * 2 + 1]) - 2;
    ctx.save();
    ctx.fillStyle = o.colorSnake;
    ctx.translate(x * o.sizeCell + u, y * o.sizeCell + u);
    ctx.beginPath();
    pathRoundedRect(ctx, o.sizeCell - u * 2, o.sizeCell - u * 2, (o.sizeCell - u * 2) * 0.25);
    ctx.fill();
    ctx.restore();
  }
};
var init_drawSnake = () => {};

// ../draw/drawWorld.ts
var drawStack = (ctx, stack, max, width, o) => {
  ctx.save();
  const m = width / max;
  for (let i = 0;i < stack.length; i++) {
    ctx.fillStyle = o.colorDots[stack[i]];
    ctx.fillRect(i * m, 0, m + width * 0.005, 10);
  }
  ctx.restore();
}, drawLerpWorld = (ctx, grid, cells, snake0, snake1, stack, k, o) => {
  ctx.save();
  if (o.colorBackground) {
    ctx.fillStyle = o.colorBackground;
    ctx.fillRect(0, 0, 99999, 99999);
  }
  ctx.translate(1 * o.sizeCell, 2 * o.sizeCell);
  drawGrid(ctx, grid, cells, o);
  drawSnakeLerp(ctx, snake0, snake1, k, o);
  ctx.translate(0, (grid.height + 2) * o.sizeCell);
  const max = grid.data.reduce((sum, x) => sum + +!!x, stack.length);
  drawStack(ctx, stack, max, grid.width * o.sizeCell, o);
  ctx.restore();
}, getCanvasWorldSize = (grid, o) => {
  const width = o.sizeCell * (grid.width + 2);
  const height = o.sizeCell * (grid.height + 4) + 30;
  return { width, height };
};
var init_drawWorld = __esm(() => {
  init_drawGrid();
  init_drawSnake();
});

// ../solver/step.ts
var step = (grid, stack, snake) => {
  const x = getHeadX(snake);
  const y = getHeadY(snake);
  const color = getColor(grid, x, y);
  if (isInside(grid, x, y) && !isEmpty(color)) {
    stack.push(color);
    setColorEmpty(grid, x, y);
  }
};
var init_step = () => {};

// ../../node_modules/gif-encoder-2/src/LZWEncoder.js
var require_LZWEncoder = __commonJS(function(exports2, module2) {
  var EOF = -1;
  var BITS = 12;
  var HSIZE = 5003;
  var masks = [
    0,
    1,
    3,
    7,
    15,
    31,
    63,
    127,
    255,
    511,
    1023,
    2047,
    4095,
    8191,
    16383,
    32767,
    65535
  ];
  function LZWEncoder(width, height, pixels, colorDepth) {
    var initCodeSize = Math.max(2, colorDepth);
    var accum = new Uint8Array(256);
    var htab = new Int32Array(HSIZE);
    var codetab = new Int32Array(HSIZE);
    var cur_accum, cur_bits = 0;
    var a_count;
    var free_ent = 0;
    var maxcode;
    var clear_flg = false;
    var g_init_bits, ClearCode, EOFCode;
    function char_out(c, outs) {
      accum[a_count++] = c;
      if (a_count >= 254)
        flush_char(outs);
    }
    function cl_block(outs) {
      cl_hash(HSIZE);
      free_ent = ClearCode + 2;
      clear_flg = true;
      output(ClearCode, outs);
    }
    function cl_hash(hsize) {
      for (var i = 0;i < hsize; ++i)
        htab[i] = -1;
    }
    function compress(init_bits, outs) {
      var fcode, c, i, ent, disp, hsize_reg, hshift;
      g_init_bits = init_bits;
      clear_flg = false;
      n_bits = g_init_bits;
      maxcode = MAXCODE(n_bits);
      ClearCode = 1 << init_bits - 1;
      EOFCode = ClearCode + 1;
      free_ent = ClearCode + 2;
      a_count = 0;
      ent = nextPixel();
      hshift = 0;
      for (fcode = HSIZE;fcode < 65536; fcode *= 2)
        ++hshift;
      hshift = 8 - hshift;
      hsize_reg = HSIZE;
      cl_hash(hsize_reg);
      output(ClearCode, outs);
      outer_loop:
        while ((c = nextPixel()) != EOF) {
          fcode = (c << BITS) + ent;
          i = c << hshift ^ ent;
          if (htab[i] === fcode) {
            ent = codetab[i];
            continue;
          } else if (htab[i] >= 0) {
            disp = hsize_reg - i;
            if (i === 0)
              disp = 1;
            do {
              if ((i -= disp) < 0)
                i += hsize_reg;
              if (htab[i] === fcode) {
                ent = codetab[i];
                continue outer_loop;
              }
            } while (htab[i] >= 0);
          }
          output(ent, outs);
          ent = c;
          if (free_ent < 1 << BITS) {
            codetab[i] = free_ent++;
            htab[i] = fcode;
          } else {
            cl_block(outs);
          }
        }
      output(ent, outs);
      output(EOFCode, outs);
    }
    function encode(outs) {
      outs.writeByte(initCodeSize);
      remaining = width * height;
      curPixel = 0;
      compress(initCodeSize + 1, outs);
      outs.writeByte(0);
    }
    function flush_char(outs) {
      if (a_count > 0) {
        outs.writeByte(a_count);
        outs.writeBytes(accum, 0, a_count);
        a_count = 0;
      }
    }
    function MAXCODE(n_bits2) {
      return (1 << n_bits2) - 1;
    }
    function nextPixel() {
      if (remaining === 0)
        return EOF;
      --remaining;
      var pix = pixels[curPixel++];
      return pix & 255;
    }
    function output(code, outs) {
      cur_accum &= masks[cur_bits];
      if (cur_bits > 0)
        cur_accum |= code << cur_bits;
      else
        cur_accum = code;
      cur_bits += n_bits;
      while (cur_bits >= 8) {
        char_out(cur_accum & 255, outs);
        cur_accum >>= 8;
        cur_bits -= 8;
      }
      if (free_ent > maxcode || clear_flg) {
        if (clear_flg) {
          maxcode = MAXCODE(n_bits = g_init_bits);
          clear_flg = false;
        } else {
          ++n_bits;
          if (n_bits == BITS)
            maxcode = 1 << BITS;
          else
            maxcode = MAXCODE(n_bits);
        }
      }
      if (code == EOFCode) {
        while (cur_bits > 0) {
          char_out(cur_accum & 255, outs);
          cur_accum >>= 8;
          cur_bits -= 8;
        }
        flush_char(outs);
      }
    }
    this.encode = encode;
  }
  module2.exports = LZWEncoder;
});

// ../../node_modules/gif-encoder-2/src/TypedNeuQuant.js
var require_TypedNeuQuant = __commonJS(function(exports2, module2) {
  var ncycles = 100;
  var netsize = 256;
  var maxnetpos = netsize - 1;
  var netbiasshift = 4;
  var intbiasshift = 16;
  var intbias = 1 << intbiasshift;
  var gammashift = 10;
  var gamma = 1 << gammashift;
  var betashift = 10;
  var beta = intbias >> betashift;
  var betagamma = intbias << gammashift - betashift;
  var initrad = netsize >> 3;
  var radiusbiasshift = 6;
  var radiusbias = 1 << radiusbiasshift;
  var initradius = initrad * radiusbias;
  var radiusdec = 30;
  var alphabiasshift = 10;
  var initalpha = 1 << alphabiasshift;
  var radbiasshift = 8;
  var radbias = 1 << radbiasshift;
  var alpharadbshift = alphabiasshift + radbiasshift;
  var alpharadbias = 1 << alpharadbshift;
  var prime1 = 499;
  var prime2 = 491;
  var prime3 = 487;
  var prime4 = 503;
  var minpicturebytes = 3 * prime4;
  function NeuQuant(pixels, samplefac) {
    var network;
    var netindex;
    var bias;
    var freq;
    var radpower;
    function init() {
      network = [];
      netindex = new Int32Array(256);
      bias = new Int32Array(netsize);
      freq = new Int32Array(netsize);
      radpower = new Int32Array(netsize >> 3);
      var i, v;
      for (i = 0;i < netsize; i++) {
        v = (i << netbiasshift + 8) / netsize;
        network[i] = new Float64Array([v, v, v, 0]);
        freq[i] = intbias / netsize;
        bias[i] = 0;
      }
    }
    function unbiasnet() {
      for (var i = 0;i < netsize; i++) {
        network[i][0] >>= netbiasshift;
        network[i][1] >>= netbiasshift;
        network[i][2] >>= netbiasshift;
        network[i][3] = i;
      }
    }
    function altersingle(alpha, i, b, g, r) {
      network[i][0] -= alpha * (network[i][0] - b) / initalpha;
      network[i][1] -= alpha * (network[i][1] - g) / initalpha;
      network[i][2] -= alpha * (network[i][2] - r) / initalpha;
    }
    function alterneigh(radius, i, b, g, r) {
      var lo = Math.abs(i - radius);
      var hi = Math.min(i + radius, netsize);
      var j = i + 1;
      var k = i - 1;
      var m = 1;
      var p, a;
      while (j < hi || k > lo) {
        a = radpower[m++];
        if (j < hi) {
          p = network[j++];
          p[0] -= a * (p[0] - b) / alpharadbias;
          p[1] -= a * (p[1] - g) / alpharadbias;
          p[2] -= a * (p[2] - r) / alpharadbias;
        }
        if (k > lo) {
          p = network[k--];
          p[0] -= a * (p[0] - b) / alpharadbias;
          p[1] -= a * (p[1] - g) / alpharadbias;
          p[2] -= a * (p[2] - r) / alpharadbias;
        }
      }
    }
    function contest(b, g, r) {
      var bestd = ~(1 << 31);
      var bestbiasd = bestd;
      var bestpos = -1;
      var bestbiaspos = bestpos;
      var i, n, dist, biasdist, betafreq;
      for (i = 0;i < netsize; i++) {
        n = network[i];
        dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
        if (dist < bestd) {
          bestd = dist;
          bestpos = i;
        }
        biasdist = dist - (bias[i] >> intbiasshift - netbiasshift);
        if (biasdist < bestbiasd) {
          bestbiasd = biasdist;
          bestbiaspos = i;
        }
        betafreq = freq[i] >> betashift;
        freq[i] -= betafreq;
        bias[i] += betafreq << gammashift;
      }
      freq[bestpos] += beta;
      bias[bestpos] -= betagamma;
      return bestbiaspos;
    }
    function inxbuild() {
      var i, j, p, q, smallpos, smallval, previouscol = 0, startpos = 0;
      for (i = 0;i < netsize; i++) {
        p = network[i];
        smallpos = i;
        smallval = p[1];
        for (j = i + 1;j < netsize; j++) {
          q = network[j];
          if (q[1] < smallval) {
            smallpos = j;
            smallval = q[1];
          }
        }
        q = network[smallpos];
        if (i != smallpos) {
          j = q[0];
          q[0] = p[0];
          p[0] = j;
          j = q[1];
          q[1] = p[1];
          p[1] = j;
          j = q[2];
          q[2] = p[2];
          p[2] = j;
          j = q[3];
          q[3] = p[3];
          p[3] = j;
        }
        if (smallval != previouscol) {
          netindex[previouscol] = startpos + i >> 1;
          for (j = previouscol + 1;j < smallval; j++)
            netindex[j] = i;
          previouscol = smallval;
          startpos = i;
        }
      }
      netindex[previouscol] = startpos + maxnetpos >> 1;
      for (j = previouscol + 1;j < 256; j++)
        netindex[j] = maxnetpos;
    }
    function inxsearch(b, g, r) {
      var a, p, dist;
      var bestd = 1000;
      var best = -1;
      var i = netindex[g];
      var j = i - 1;
      while (i < netsize || j >= 0) {
        if (i < netsize) {
          p = network[i];
          dist = p[1] - g;
          if (dist >= bestd)
            i = netsize;
          else {
            i++;
            if (dist < 0)
              dist = -dist;
            a = p[0] - b;
            if (a < 0)
              a = -a;
            dist += a;
            if (dist < bestd) {
              a = p[2] - r;
              if (a < 0)
                a = -a;
              dist += a;
              if (dist < bestd) {
                bestd = dist;
                best = p[3];
              }
            }
          }
        }
        if (j >= 0) {
          p = network[j];
          dist = g - p[1];
          if (dist >= bestd)
            j = -1;
          else {
            j--;
            if (dist < 0)
              dist = -dist;
            a = p[0] - b;
            if (a < 0)
              a = -a;
            dist += a;
            if (dist < bestd) {
              a = p[2] - r;
              if (a < 0)
                a = -a;
              dist += a;
              if (dist < bestd) {
                bestd = dist;
                best = p[3];
              }
            }
          }
        }
      }
      return best;
    }
    function learn() {
      var i;
      var lengthcount = pixels.length;
      var alphadec = 30 + (samplefac - 1) / 3;
      var samplepixels = lengthcount / (3 * samplefac);
      var delta = ~~(samplepixels / ncycles);
      var alpha = initalpha;
      var radius = initradius;
      var rad = radius >> radiusbiasshift;
      if (rad <= 1)
        rad = 0;
      for (i = 0;i < rad; i++)
        radpower[i] = alpha * ((rad * rad - i * i) * radbias / (rad * rad));
      var step;
      if (lengthcount < minpicturebytes) {
        samplefac = 1;
        step = 3;
      } else if (lengthcount % prime1 !== 0) {
        step = 3 * prime1;
      } else if (lengthcount % prime2 !== 0) {
        step = 3 * prime2;
      } else if (lengthcount % prime3 !== 0) {
        step = 3 * prime3;
      } else {
        step = 3 * prime4;
      }
      var b, g, r, j;
      var pix = 0;
      i = 0;
      while (i < samplepixels) {
        b = (pixels[pix] & 255) << netbiasshift;
        g = (pixels[pix + 1] & 255) << netbiasshift;
        r = (pixels[pix + 2] & 255) << netbiasshift;
        j = contest(b, g, r);
        altersingle(alpha, j, b, g, r);
        if (rad !== 0)
          alterneigh(rad, j, b, g, r);
        pix += step;
        if (pix >= lengthcount)
          pix -= lengthcount;
        i++;
        if (delta === 0)
          delta = 1;
        if (i % delta === 0) {
          alpha -= alpha / alphadec;
          radius -= radius / radiusdec;
          rad = radius >> radiusbiasshift;
          if (rad <= 1)
            rad = 0;
          for (j = 0;j < rad; j++)
            radpower[j] = alpha * ((rad * rad - j * j) * radbias / (rad * rad));
        }
      }
    }
    function buildColormap() {
      init();
      learn();
      unbiasnet();
      inxbuild();
    }
    this.buildColormap = buildColormap;
    function getColormap() {
      var map = [];
      var index = [];
      for (var i = 0;i < netsize; i++)
        index[network[i][3]] = i;
      var k = 0;
      for (var l = 0;l < netsize; l++) {
        var j = index[l];
        map[k++] = network[j][0];
        map[k++] = network[j][1];
        map[k++] = network[j][2];
      }
      return map;
    }
    this.getColormap = getColormap;
    this.lookupRGB = inxsearch;
  }
  module2.exports = NeuQuant;
});

// ../../node_modules/gif-encoder-2/src/OctreeQuant.js
var require_OctreeQuant = __commonJS(function(exports2, module2) {
  var MAX_DEPTH = 8;

  class OctreeQuant {
    constructor() {
      this.levels = Array.from({ length: MAX_DEPTH }, () => []);
      this.root = new Node(0, this);
    }
    addColor(color) {
      this.root.addColor(color, 0, this);
    }
    makePalette(colorCount) {
      let palette = [];
      let paletteIndex = 0;
      let leafCount = this.leafNodes.length;
      for (let level = MAX_DEPTH - 1;level > -1; level -= 1) {
        if (this.levels[level]) {
          for (let node of this.levels[level]) {
            leafCount -= node.removeLeaves();
            if (leafCount <= colorCount)
              break;
          }
          if (leafCount <= colorCount)
            break;
          this.levels[level] = [];
        }
      }
      for (let node of this.leafNodes) {
        if (paletteIndex >= colorCount)
          break;
        if (node.isLeaf)
          palette.push(node.color);
        node.paletteIndex = paletteIndex;
        paletteIndex++;
      }
      return palette;
    }
    *makePaletteIncremental(colorCount) {
      let palette = [];
      let paletteIndex = 0;
      let leafCount = this.leafNodes.length;
      for (let level = MAX_DEPTH - 1;level > -1; level -= 1) {
        if (this.levels[level]) {
          for (let node of this.levels[level]) {
            leafCount -= node.removeLeaves();
            if (leafCount <= colorCount)
              break;
          }
          if (leafCount <= colorCount)
            break;
          this.levels[level] = [];
        }
        yield;
      }
      for (let node of this.leafNodes) {
        if (paletteIndex >= colorCount)
          break;
        if (node.isLeaf)
          palette.push(node.color);
        node.paletteIndex = paletteIndex;
        paletteIndex++;
      }
      yield;
      return palette;
    }
    get leafNodes() {
      return this.root.leafNodes;
    }
    addLevelNode(level, node) {
      this.levels[level].push(node);
    }
    getPaletteIndex(color) {
      return this.root.getPaletteIndex(color, 0);
    }
  }

  class Node {
    constructor(level, parent) {
      this._color = new Color(0, 0, 0);
      this.pixelCount = 0;
      this.paletteIndex = 0;
      this.children = [];
      this._debugColor;
      if (level < MAX_DEPTH - 1)
        parent.addLevelNode(level, this);
    }
    get isLeaf() {
      return this.pixelCount > 0;
    }
    get leafNodes() {
      let leafNodes = [];
      for (let node of this.children) {
        if (!node)
          continue;
        if (node.isLeaf) {
          leafNodes.push(node);
        } else {
          leafNodes.push(...node.leafNodes);
        }
      }
      return leafNodes;
    }
    addColor(color, level, parent) {
      if (level >= MAX_DEPTH) {
        this._color.add(color);
        this.pixelCount++;
        return;
      }
      let index = getColorIndex(color, level);
      if (!this.children[index]) {
        this.children[index] = new Node(level, parent);
      }
      this.children[index].addColor(color, level + 1, parent);
    }
    getPaletteIndex(color, level) {
      if (this.isLeaf) {
        return this.paletteIndex;
      }
      let index = getColorIndex(color, level);
      if (this.children[index]) {
        return this.children[index].getPaletteIndex(color, level + 1);
      } else {
        for (let node of this.children) {
          if (node) {
            return node.getPaletteIndex(color, level + 1);
          }
        }
      }
    }
    removeLeaves() {
      let result = 0;
      for (let node of this.children) {
        if (!node)
          continue;
        this._color.add(node._color);
        this.pixelCount += node.pixelCount;
        result++;
      }
      this.children = [];
      return result - 1;
    }
    get debugColor() {
      if (this._debugColor)
        return this._debugColor;
      if (this.isLeaf)
        return this.color;
      let c = new Color;
      let count = 0;
      function traverse(node) {
        for (let child of node.children) {
          if (child.isLeaf) {
            c.add(child._color);
            count++;
          } else {
            traverse(child);
          }
        }
      }
      traverse(this);
      return c.normalized(count);
    }
    get color() {
      return this._color.normalized(this.pixelCount);
    }
  }

  class Color {
    constructor(red = 0, green = 0, blue = 0) {
      this.red = red;
      this.green = green;
      this.blue = blue;
    }
    clone() {
      return new Color(this.red, this.green, this.blue);
    }
    get array() {
      return [this.red, this.green, this.blue, this.red + this.green + this.blue];
    }
    toString() {
      return [this.red, this.green, this.blue].join(",");
    }
    toCSS() {
      return `rgb(${[this.red, this.green, this.blue].map((n) => Math.floor(n)).join(",")})`;
    }
    normalized(pixelCount) {
      return new Color(this.red / pixelCount, this.green / pixelCount, this.blue / pixelCount);
    }
    add(color) {
      this.red += color.red;
      this.green += color.green;
      this.blue += color.blue;
    }
  }
  function getColorIndex(color, level) {
    let index = 0;
    let mask = 128 >> level;
    if (color.red & mask)
      index |= 4;
    if (color.green & mask)
      index |= 2;
    if (color.blue & mask)
      index |= 1;
    return index;
  }
  module2.exports = { OctreeQuant, Node, Color };
});

// ../../node_modules/gif-encoder-2/src/GIFEncoder.js
var require_GIFEncoder = __commonJS(function(exports2, module2) {
  var stream = require("stream");
  var EventEmitter = require("events");
  var LZWEncoder = require_LZWEncoder();
  var NeuQuant = require_TypedNeuQuant();
  var { OctreeQuant, Color } = require_OctreeQuant();

  class ByteArray {
    constructor() {
      this.data = [];
    }
    getData() {
      return Buffer.from(this.data);
    }
    writeByte(val) {
      this.data.push(val);
    }
    writeUTFBytes(str) {
      for (var len = str.length, i = 0;i < len; i++) {
        this.writeByte(str.charCodeAt(i));
      }
    }
    writeBytes(array, offset, length) {
      for (var len = length || array.length, i = offset || 0;i < len; i++) {
        this.writeByte(array[i]);
      }
    }
  }

  class GIFEncoder extends EventEmitter {
    constructor(width, height, algorithm = "neuquant", useOptimizer = false, totalFrames = 0) {
      super();
      this.width = ~~width;
      this.height = ~~height;
      this.algorithm = algorithm;
      this.useOptimizer = useOptimizer;
      this.totalFrames = totalFrames;
      this.frames = 1;
      this.threshold = 90;
      this.indexedPixels = null;
      this.palSizeNeu = 7;
      this.palSizeOct = 7;
      this.sample = 10;
      this.colorTab = null;
      this.reuseTab = null;
      this.colorDepth = null;
      this.usedEntry = new Array;
      this.firstFrame = true;
      this.started = false;
      this.image = null;
      this.prevImage = null;
      this.dispose = -1;
      this.repeat = 0;
      this.delay = 0;
      this.transparent = null;
      this.transIndex = 0;
      this.readStreams = [];
      this.out = new ByteArray;
    }
    createReadStream(rs) {
      if (!rs) {
        rs = new stream.Readable;
        rs._read = function() {};
      }
      this.readStreams.push(rs);
      return rs;
    }
    emitData() {
      if (this.readStreams.length === 0) {
        return;
      }
      if (this.out.data.length) {
        this.readStreams.forEach((rs) => {
          rs.push(Buffer.from(this.out.data));
        });
        this.out.data = [];
      }
    }
    start() {
      this.out.writeUTFBytes("GIF89a");
      this.started = true;
      this.emitData();
    }
    end() {
      if (this.readStreams.length === null) {
        return;
      }
      this.emitData();
      this.readStreams.forEach((rs) => rs.push(null));
      this.readStreams = [];
    }
    addFrame(input) {
      if (input && input.getImageData) {
        this.image = input.getImageData(0, 0, this.width, this.height).data;
      } else {
        this.image = input;
      }
      this.analyzePixels();
      if (this.firstFrame) {
        this.writeLSD();
        this.writePalette();
        if (this.repeat >= 0) {
          this.writeNetscapeExt();
        }
      }
      this.writeGraphicCtrlExt();
      this.writeImageDesc();
      if (!this.firstFrame) {
        this.writePalette();
      }
      this.writePixels();
      this.firstFrame = false;
      this.emitData();
      if (this.totalFrames) {
        this.emit("progress", Math.floor(this.frames++ / this.totalFrames * 100));
      }
    }
    analyzePixels() {
      const w = this.width;
      const h = this.height;
      var data = this.image;
      if (this.useOptimizer && this.prevImage) {
        var delta = 0;
        for (var len = data.length, i = 0;i < len; i += 4) {
          if (data[i] !== this.prevImage[i] || data[i + 1] !== this.prevImage[i + 1] || data[i + 2] !== this.prevImage[i + 2]) {
            delta++;
          }
        }
        const match = 100 - Math.ceil(delta / (data.length / 4) * 100);
        this.reuseTab = match >= this.threshold;
      }
      this.prevImage = data;
      if (this.algorithm === "neuquant") {
        var count = 0;
        this.pixels = new Uint8Array(w * h * 3);
        for (var i = 0;i < h; i++) {
          for (var j = 0;j < w; j++) {
            var b = i * w * 4 + j * 4;
            this.pixels[count++] = data[b];
            this.pixels[count++] = data[b + 1];
            this.pixels[count++] = data[b + 2];
          }
        }
        var nPix = this.pixels.length / 3;
        this.indexedPixels = new Uint8Array(nPix);
        if (!this.reuseTab) {
          this.quantizer = new NeuQuant(this.pixels, this.sample);
          this.quantizer.buildColormap();
          this.colorTab = this.quantizer.getColormap();
        }
        var k = 0;
        for (var j = 0;j < nPix; j++) {
          var index = this.quantizer.lookupRGB(this.pixels[k++] & 255, this.pixels[k++] & 255, this.pixels[k++] & 255);
          this.usedEntry[index] = true;
          this.indexedPixels[j] = index;
        }
        this.colorDepth = 8;
        this.palSizeNeu = 7;
        this.pixels = null;
      } else if (this.algorithm === "octree") {
        this.colors = [];
        if (!this.reuseTab) {
          this.quantizer = new OctreeQuant;
        }
        for (var i = 0;i < h; i++) {
          for (var j = 0;j < w; j++) {
            var b = i * w * 4 + j * 4;
            const color = new Color(data[b], data[b + 1], data[b + 2]);
            this.colors.push(color);
            if (!this.reuseTab) {
              this.quantizer.addColor(color);
            }
          }
        }
        const nPix = this.colors.length;
        this.indexedPixels = new Uint8Array(nPix);
        if (!this.reuseTab) {
          this.colorTab = [];
          const palette = this.quantizer.makePalette(Math.pow(2, this.palSizeOct + 1));
          for (const p of palette) {
            this.colorTab.push(p.red, p.green, p.blue);
          }
        }
        for (var i = 0;i < nPix; i++) {
          this.indexedPixels[i] = this.quantizer.getPaletteIndex(this.colors[i]);
        }
        this.colorDepth = this.palSizeOct + 1;
      }
      if (this.transparent !== null) {
        this.transIndex = this.findClosest(this.transparent);
        for (var pixelIndex = 0;pixelIndex < nPix; pixelIndex++) {
          if (this.image[pixelIndex * 4 + 3] == 0) {
            this.indexedPixels[pixelIndex] = this.transIndex;
          }
        }
      }
    }
    findClosest(c) {
      if (this.colorTab === null) {
        return -1;
      }
      var r = (c & 16711680) >> 16;
      var g = (c & 65280) >> 8;
      var b = c & 255;
      var minpos = 0;
      var dmin = 256 * 256 * 256;
      var len = this.colorTab.length;
      for (var i = 0;i < len; ) {
        var index = i / 3;
        var dr = r - (this.colorTab[i++] & 255);
        var dg = g - (this.colorTab[i++] & 255);
        var db = b - (this.colorTab[i++] & 255);
        var d = dr * dr + dg * dg + db * db;
        if (this.usedEntry[index] && d < dmin) {
          dmin = d;
          minpos = index;
        }
      }
      return minpos;
    }
    setFrameRate(fps) {
      this.delay = Math.round(100 / fps);
    }
    setDelay(ms) {
      this.delay = Math.round(ms / 10);
    }
    setDispose(code) {
      if (code >= 0) {
        this.dispose = code;
      }
    }
    setRepeat(repeat) {
      this.repeat = repeat;
    }
    setTransparent(color) {
      this.transparent = color;
    }
    setQuality(quality) {
      if (quality < 1) {
        quality = 1;
      }
      this.quality = quality;
    }
    setThreshold(threshold) {
      if (threshold > 100) {
        threshold = 100;
      } else if (threshold < 0) {
        threshold = 0;
      }
      this.threshold = threshold;
    }
    setPaletteSize(size) {
      if (size > 7) {
        size = 7;
      } else if (size < 4) {
        size = 4;
      }
      this.palSizeOct = size;
    }
    writeLSD() {
      this.writeShort(this.width);
      this.writeShort(this.height);
      this.out.writeByte(128 | 112 | 0 | this.palSizeNeu);
      this.out.writeByte(0);
      this.out.writeByte(0);
    }
    writeGraphicCtrlExt() {
      this.out.writeByte(33);
      this.out.writeByte(249);
      this.out.writeByte(4);
      var transp, disp;
      if (this.transparent === null) {
        transp = 0;
        disp = 0;
      } else {
        transp = 1;
        disp = 2;
      }
      if (this.dispose >= 0) {
        disp = this.dispose & 7;
      }
      disp <<= 2;
      this.out.writeByte(0 | disp | 0 | transp);
      this.writeShort(this.delay);
      this.out.writeByte(this.transIndex);
      this.out.writeByte(0);
    }
    writeNetscapeExt() {
      this.out.writeByte(33);
      this.out.writeByte(255);
      this.out.writeByte(11);
      this.out.writeUTFBytes("NETSCAPE2.0");
      this.out.writeByte(3);
      this.out.writeByte(1);
      this.writeShort(this.repeat);
      this.out.writeByte(0);
    }
    writeImageDesc() {
      this.out.writeByte(44);
      this.writeShort(0);
      this.writeShort(0);
      this.writeShort(this.width);
      this.writeShort(this.height);
      if (this.firstFrame) {
        this.out.writeByte(0);
      } else {
        this.out.writeByte(128 | 0 | 0 | 0 | this.palSizeNeu);
      }
    }
    writePalette() {
      this.out.writeBytes(this.colorTab);
      var n = 3 * 256 - this.colorTab.length;
      for (var i = 0;i < n; i++) {
        this.out.writeByte(0);
      }
    }
    writeShort(pValue) {
      this.out.writeByte(pValue & 255);
      this.out.writeByte(pValue >> 8 & 255);
    }
    writePixels() {
      var enc = new LZWEncoder(this.width, this.height, this.indexedPixels, this.colorDepth);
      enc.encode(this.out);
    }
    finish() {
      this.out.writeByte(59);
      this.end();
    }
  }
  module2.exports = GIFEncoder;
});

// ../../node_modules/gif-encoder-2/index.js
var require_gif_encoder_2 = __commonJS(function(exports2, module2) {
  module2.exports = require_GIFEncoder();
});

// ../gif-creator/index.ts
var import_node_child_process, import_node_fs, import_node_os, import_node_path, createGif = async (grid0, cells, chain, drawOptions, animationOptions) => withTmpDir(async (dir) => {
  const { createCanvas } = await import("canvas");
  const { default: gifsicle } = await import("gifsicle");
  const { default: GIFEncoder } = await Promise.resolve().then(() => __toESM(require_gif_encoder_2()));
  const { width, height } = getCanvasWorldSize(grid0, drawOptions);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d", {
    alpha: true
  });
  const grid = copyGrid(grid0);
  const stack = [];
  const encoder = new GIFEncoder(width, height, "neuquant", true, chain.length * animationOptions.frameByStep);
  encoder.setRepeat(0);
  encoder.setDelay(animationOptions.stepDurationMs / animationOptions.frameByStep);
  encoder.start();
  for (let i = 0;i < chain.length; i += 1) {
    const snake0 = chain[i];
    const snake1 = chain[Math.min(chain.length - 1, i + 1)];
    step(grid, stack, snake0);
    for (let k = 0;k < animationOptions.frameByStep; k++) {
      ctx.clearRect(0, 0, width, height);
      drawLerpWorld(ctx, grid, cells, snake0, snake1, stack, k / animationOptions.frameByStep, drawOptions);
      encoder.addFrame(ctx);
    }
  }
  const outFileName = import_node_path.default.join(dir, "out.gif");
  const optimizedFileName = import_node_path.default.join(dir, "out.optimized.gif");
  const paletteFileName = import_node_path.default.join(dir, "palette.txt");
  {
    const colors = [
      drawOptions.colorBackground,
      drawOptions.colorEmpty,
      drawOptions.colorSnake,
      drawOptions.colorDotBorder,
      ...Object.values(drawOptions.colorDots)
    ].filter(Boolean);
    const canvas = createCanvas(colors.length, 1);
    const ctx = canvas.getContext("2d");
    for (let i = colors.length;i--; ) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(i, 0, 1, 1);
    }
    const imgData = ctx.getImageData(0, 0, colors.length, 1);
    import_node_fs.default.writeFileSync(paletteFileName, Array.from({ length: colors.length }, (_, i) => [
      imgData.data[i * 4 + 0],
      imgData.data[i * 4 + 1],
      imgData.data[i * 4 + 2]
    ].join(" ")).join(`
`));
  }
  encoder.finish();
  import_node_fs.default.writeFileSync(outFileName, encoder.out.getData());
  import_node_child_process.execFileSync(gifsicle, [
    "--optimize=3",
    "--color-method=diversity",
    `--use-colormap=${paletteFileName}`,
    outFileName,
    ["--output", optimizedFileName]
  ].flat());
  return new Uint8Array(import_node_fs.default.readFileSync(optimizedFileName));
}), withTmpDir = async (handler) => {
  const dir = import_node_path.default.join(import_node_os.tmpdir(), Math.random().toString(16).slice(2));
  import_node_fs.default.mkdirSync(dir, { recursive: true });
  try {
    return await handler(dir);
  } finally {
    import_node_fs.default.rmdirSync(dir, { recursive: true });
  }
};
var init_gif_creator = __esm(() => {
  init_drawWorld();
  init_step();
  import_node_child_process = require("node:child_process");
  import_node_fs = __toESM(require("node:fs"));
  import_node_os = require("node:os");
  import_node_path = __toESM(require("node:path"));
});

// index.ts
var fs2 = __toESM(require("node:fs"));
var path2 = __toESM(require("node:path"));

// ../forgejo-user-contribution/index.ts
var getForgejoUserContribution = async (userName, o = {}) => {
  const baseUrl = o.baseUrl ?? "https://codeberg.org";
  const res = await fetch(`${baseUrl}/api/v1/users/${userName}/heatmap`, {
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok)
    throw new Error(await res.text().catch(() => res.statusText));
  const heatmapData = await res.json();
  const countsByDate = new Map;
  for (const { timestamp, contributions } of heatmapData) {
    const date = new Date(timestamp * 1000).toLocaleDateString("en-CA");
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + contributions);
  }
  const max = Math.max(0, ...countsByDate.values());
  const levelForCount = (count) => count <= 0 || max === 0 ? 0 : count >= max ? 4 : Math.ceil(count / max * 3);
  const today = new Date;
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 365);
  start.setDate(start.getDate() - start.getDay());
  const cells = [];
  const cursor = new Date(start);
  let x = 0;
  while (cursor <= today) {
    const y = cursor.getDay();
    const date = cursor.toLocaleDateString("en-CA");
    const count = countsByDate.get(date) ?? 0;
    cells.push({ x, y, date, count, level: levelForCount(count) });
    cursor.setDate(cursor.getDate() + 1);
    if (y === 6)
      x++;
  }
  return cells;
};

// ../github-user-contribution/index.ts
var getGithubUserContribution = async (userName, o) => {
  const query = `
    query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                contributionLevel
                weekday
                date
              }
            }
          }
        }
      }
    }
  `;
  const variables = { login: userName };
  const apiUrl = o.baseUrl ? `${o.baseUrl}/api/graphql` : "https://api.github.com/graphql";
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `bearer ${o.githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "me@platane.me"
    },
    method: "POST",
    body: JSON.stringify({ variables, query })
  });
  if (!res.ok)
    throw new Error(await res.text().catch(() => res.statusText));
  const { data, errors } = await res.json();
  if (errors?.[0])
    throw errors[0];
  return data.user.contributionsCollection.contributionCalendar.weeks.flatMap(({ contributionDays }, x) => contributionDays.map((d) => ({
    x,
    y: d.weekday,
    date: d.date,
    count: d.contributionCount,
    level: d.contributionLevel === "FOURTH_QUARTILE" && 4 || d.contributionLevel === "THIRD_QUARTILE" && 3 || d.contributionLevel === "SECOND_QUARTILE" && 2 || d.contributionLevel === "FIRST_QUARTILE" && 1 || 0
  })));
};

// ../gitlab-user-contribution/index.ts
var getGitlabUserContribution = async (userName, o = {}) => {
  const baseUrl = o.baseUrl ?? "https://gitlab.com";
  const res = await fetch(`${baseUrl}/users/${userName}/calendar.json`, {
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok)
    throw new Error(await res.text().catch(() => res.statusText));
  const countsByDate = await res.json();
  const max = Math.max(0, ...Object.values(countsByDate));
  const levelForCount = (count) => count <= 0 || max === 0 ? 0 : count >= max ? 4 : Math.ceil(count / max * 3);
  const today = new Date;
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 365);
  start.setDate(start.getDate() - start.getDay());
  const cells = [];
  const cursor = new Date(start);
  let x = 0;
  while (cursor <= today) {
    const y = cursor.getDay();
    const date = cursor.toLocaleDateString("en-CA");
    const count = countsByDate[date] ?? 0;
    cells.push({ x, y, date, count, level: levelForCount(count) });
    cursor.setDate(cursor.getDate() + 1);
    if (y === 6)
      x++;
  }
  return cells;
};
// ../types/point.ts
var around4 = [
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 0, y: 1 }
];

// ../solver/outside.ts
var createOutside = (grid, color = 0) => {
  const outside = createEmptyGrid(grid.width, grid.height);
  for (let x = outside.width;x--; )
    for (let y = outside.height;y--; )
      setColor(outside, x, y, 1);
  fillOutside(outside, grid, color);
  return outside;
};
var fillOutside = (outside, grid, color = 0) => {
  let changed = true;
  while (changed) {
    changed = false;
    for (let x = outside.width;x--; )
      for (let y = outside.height;y--; )
        if (getColor(grid, x, y) <= color && !isOutside(outside, x, y) && around4.some((a) => isOutside(outside, x + a.x, y + a.y))) {
          changed = true;
          setColorEmpty(outside, x, y);
        }
  }
  return outside;
};
var isOutside = (outside, x, y) => !isInside(outside, x, y) || isEmpty(getColor(outside, x, y));
// ../solver/utils/sortPush.ts
var sortPush = (arr, x, sortFn) => {
  let a = 0;
  let b = arr.length;
  if (arr.length === 0 || sortFn(x, arr[a]) <= 0) {
    arr.unshift(x);
    return;
  }
  while (b - a > 1) {
    const e = Math.ceil((a + b) / 2);
    const s = sortFn(x, arr[e]);
    if (s === 0)
      a = b = e;
    else if (s > 0)
      a = e;
    else
      b = e;
  }
  const e = Math.ceil((a + b) / 2);
  arr.splice(e, 0, x);
};
// ../solver/tunnel.ts
var getTunnelPath = (snake0, tunnel) => {
  const chain = [];
  let snake = snake0;
  for (let i = 1;i < tunnel.length; i++) {
    const dx = tunnel[i].x - getHeadX(snake);
    const dy = tunnel[i].y - getHeadY(snake);
    snake = nextSnake(snake, dx, dy);
    chain.unshift(snake);
  }
  return chain;
};
var isEmptySafe = (grid, x, y) => !isInside(grid, x, y) || isEmpty(getColor(grid, x, y));
var trimTunnelStart = (grid, tunnel) => {
  while (tunnel.length) {
    const { x, y } = tunnel[0];
    if (isEmptySafe(grid, x, y))
      tunnel.shift();
    else
      break;
  }
};
var trimTunnelEnd = (grid, tunnel) => {
  while (tunnel.length) {
    const i = tunnel.length - 1;
    const { x, y } = tunnel[i];
    if (isEmptySafe(grid, x, y) || tunnel.findIndex((p) => p.x === x && p.y === y) < i)
      tunnel.pop();
    else
      break;
  }
};

// ../solver/getBestTunnel.ts
var getColorSafe = (grid, x, y) => isInside(grid, x, y) ? getColor(grid, x, y) : 0;
var setEmptySafe = (grid, x, y) => {
  if (isInside(grid, x, y))
    setColorEmpty(grid, x, y);
};
var unwrap = (m) => !m ? [] : [...unwrap(m.parent), { x: getHeadX(m.snake), y: getHeadY(m.snake) }];
var getSnakeEscapePath = (grid, outside, snake0, color) => {
  const openList = [{ snake: snake0, w: 0 }];
  const closeList = [];
  while (openList[0]) {
    const o = openList.shift();
    const x = getHeadX(o.snake);
    const y = getHeadY(o.snake);
    if (isOutside(outside, x, y))
      return unwrap(o);
    for (const a of around4) {
      const c = getColorSafe(grid, x + a.x, y + a.y);
      if (c <= color && !snakeWillSelfCollide(o.snake, a.x, a.y)) {
        const snake = nextSnake(o.snake, a.x, a.y);
        if (!closeList.some((s0) => snakeEquals(s0, snake))) {
          const w = o.w + 1 + +(c === color) * 1000;
          sortPush(openList, { snake, w, parent: o }, (a, b) => a.w - b.w);
          closeList.push(snake);
        }
      }
    }
  }
  return null;
};
var getBestTunnel = (grid, outside, x, y, color, snakeN) => {
  const c = { x, y };
  const snake0 = createSnakeFromCells(Array.from({ length: snakeN }, () => c));
  const one = getSnakeEscapePath(grid, outside, snake0, color);
  if (!one)
    return null;
  const snakeICells = one.slice(0, snakeN);
  while (snakeICells.length < snakeN)
    snakeICells.push(snakeICells[snakeICells.length - 1]);
  const snakeI = createSnakeFromCells(snakeICells);
  const gridI = copyGrid(grid);
  for (const { x, y } of one)
    setEmptySafe(gridI, x, y);
  const two = getSnakeEscapePath(gridI, outside, snakeI, color);
  if (!two)
    return null;
  one.shift();
  one.reverse();
  one.push(...two);
  trimTunnelStart(grid, one);
  trimTunnelEnd(grid, one);
  return one;
};
// ../solver/getPathTo.ts
var getPathTo = (grid, snake0, x, y) => {
  const openList = [{ snake: snake0, w: 0 }];
  const closeList = [];
  while (openList.length) {
    const c = openList.shift();
    const cx = getHeadX(c.snake);
    const cy = getHeadY(c.snake);
    for (let i = 0;i < around4.length; i++) {
      const { x: dx, y: dy } = around4[i];
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx === x && ny === y) {
        const path = [nextSnake(c.snake, dx, dy)];
        let e = c;
        while (e.parent) {
          path.push(e.snake);
          e = e.parent;
        }
        return path;
      }
      if (isInsideLarge(grid, 2, nx, ny) && !snakeWillSelfCollide(c.snake, dx, dy) && (!isInside(grid, nx, ny) || isEmpty(getColor(grid, nx, ny)))) {
        const nsnake = nextSnake(c.snake, dx, dy);
        if (!closeList.some((s) => snakeEquals(nsnake, s))) {
          const w = c.w + 1;
          const h = Math.abs(nx - x) + Math.abs(ny - y);
          const f = w + h;
          const o = { snake: nsnake, parent: c, w, h, f };
          sortPush(openList, o, (a, b) => a.f - b.f);
          closeList.push(nsnake);
        }
      }
    }
  }
};

// ../solver/clearResidualColoredLayer.ts
var clearResidualColoredLayer = (grid, outside, snake0, color) => {
  const snakeN = getSnakeLength(snake0);
  const tunnels = getTunnellablePoints(grid, outside, snakeN, color);
  tunnels.sort((a, b) => b.priority - a.priority);
  const chain = [snake0];
  while (tunnels.length) {
    let t = getNextTunnel(tunnels, chain[0]);
    chain.unshift(...getPathTo(grid, chain[0], t[0].x, t[0].y));
    chain.unshift(...getTunnelPath(chain[0], t));
    for (const { x, y } of t)
      setEmptySafe2(grid, x, y);
    fillOutside(outside, grid);
    for (let i = tunnels.length;i--; )
      if (isEmpty(getColor(grid, tunnels[i].x, tunnels[i].y)))
        tunnels.splice(i, 1);
      else {
        const t = tunnels[i];
        const tunnel = getBestTunnel(grid, outside, t.x, t.y, color, snakeN);
        if (!tunnel)
          tunnels.splice(i, 1);
        else {
          t.tunnel = tunnel;
          t.priority = getPriority(grid, color, tunnel);
        }
      }
    tunnels.sort((a, b) => b.priority - a.priority);
  }
  chain.pop();
  return chain;
};
var getNextTunnel = (ts, snake) => {
  let minDistance = Infinity;
  let closestTunnel = null;
  const x = getHeadX(snake);
  const y = getHeadY(snake);
  const priority = ts[0].priority;
  for (let i = 0;ts[i] && ts[i].priority === priority; i++) {
    const t = ts[i].tunnel;
    const d = distanceSq(t[0].x, t[0].y, x, y);
    if (d < minDistance) {
      minDistance = d;
      closestTunnel = t;
    }
  }
  return closestTunnel;
};
var getTunnellablePoints = (grid, outside, snakeN, color) => {
  const points = [];
  for (let x = grid.width;x--; )
    for (let y = grid.height;y--; ) {
      const c = getColor(grid, x, y);
      if (!isEmpty(c) && c < color) {
        const tunnel = getBestTunnel(grid, outside, x, y, color, snakeN);
        if (tunnel) {
          const priority = getPriority(grid, color, tunnel);
          points.push({ x, y, priority, tunnel });
        }
      }
    }
  return points;
};
var getPriority = (grid, color, tunnel) => {
  let nColor = 0;
  let nLess = 0;
  for (let i = 0;i < tunnel.length; i++) {
    const { x, y } = tunnel[i];
    const c = getColorSafe2(grid, x, y);
    if (!isEmpty(c) && i === tunnel.findIndex((p) => p.x === x && p.y === y)) {
      if (c === color)
        nColor += 1;
      else
        nLess += color - c;
    }
  }
  if (nColor === 0)
    return 99999;
  return nLess / nColor;
};
var distanceSq = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;
var getColorSafe2 = (grid, x, y) => isInside(grid, x, y) ? getColor(grid, x, y) : 0;
var setEmptySafe2 = (grid, x, y) => {
  if (isInside(grid, x, y))
    setColorEmpty(grid, x, y);
};
// ../solver/clearCleanColoredLayer.ts
var clearCleanColoredLayer = (grid, outside, snake0, color) => {
  const snakeN = getSnakeLength(snake0);
  const points = getTunnellablePoints2(grid, outside, snakeN, color);
  const chain = [snake0];
  while (points.length) {
    const path = getPathToNextPoint(grid, chain[0], color, points);
    path.pop();
    for (const snake of path)
      setEmptySafe3(grid, getHeadX(snake), getHeadY(snake));
    chain.unshift(...path);
  }
  fillOutside(outside, grid);
  chain.pop();
  return chain;
};
var unwrap2 = (m) => !m ? [] : [m.snake, ...unwrap2(m.parent)];
var getPathToNextPoint = (grid, snake0, color, points) => {
  const closeList = [];
  const openList = [{ snake: snake0 }];
  while (openList.length) {
    const o = openList.shift();
    const x = getHeadX(o.snake);
    const y = getHeadY(o.snake);
    const i = points.findIndex((p) => p.x === x && p.y === y);
    if (i >= 0) {
      points.splice(i, 1);
      return unwrap2(o);
    }
    for (const { x: dx, y: dy } of around4) {
      if (isInsideLarge(grid, 2, x + dx, y + dy) && !snakeWillSelfCollide(o.snake, dx, dy) && getColorSafe3(grid, x + dx, y + dy) <= color) {
        const snake = nextSnake(o.snake, dx, dy);
        if (!closeList.some((s0) => snakeEquals(s0, snake))) {
          closeList.push(snake);
          openList.push({ snake, parent: o });
        }
      }
    }
  }
};
var getTunnellablePoints2 = (grid, outside, snakeN, color) => {
  const points = [];
  for (let x = grid.width;x--; )
    for (let y = grid.height;y--; ) {
      const c = getColor(grid, x, y);
      if (!isEmpty(c) && c <= color && !points.some((p) => p.x === x && p.y === y)) {
        const tunnel = getBestTunnel(grid, outside, x, y, color, snakeN);
        if (tunnel) {
          for (const p of tunnel)
            if (!isEmptySafe2(grid, p.x, p.y))
              points.push(p);
        }
      }
    }
  return points;
};
var getColorSafe3 = (grid, x, y) => isInside(grid, x, y) ? getColor(grid, x, y) : 0;
var setEmptySafe3 = (grid, x, y) => {
  if (isInside(grid, x, y))
    setColorEmpty(grid, x, y);
};
var isEmptySafe2 = (grid, x, y) => !isInside(grid, x, y) && isEmpty(getColor(grid, x, y));

// ../solver/getBestRoute.ts
var getBestRoute = (grid0, snake0) => {
  const grid = copyGrid(grid0);
  const outside = createOutside(grid);
  const chain = [snake0];
  for (const color of extractColors(grid)) {
    if (color > 1)
      chain.unshift(...clearResidualColoredLayer(grid, outside, chain[0], color));
    chain.unshift(...clearCleanColoredLayer(grid, outside, chain[0], color));
  }
  return chain.reverse();
};
var extractColors = (grid) => {
  let maxColor = Math.max(...grid.data);
  return Array.from({ length: maxColor }, (_, i) => i + 1);
};
// ../solver/getPathToPose.ts
var isEmptySafe3 = (grid, x, y) => !isInside(grid, x, y) || isEmpty(getColor(grid, x, y));
var getPathToPose = (snake0, target, grid) => {
  if (snakeEquals(snake0, target))
    return [];
  const targetCells = snakeToCells(target).reverse();
  const snakeN = getSnakeLength(snake0);
  const box = {
    min: {
      x: Math.min(getHeadX(snake0), getHeadX(target)) - snakeN - 1,
      y: Math.min(getHeadY(snake0), getHeadY(target)) - snakeN - 1
    },
    max: {
      x: Math.max(getHeadX(snake0), getHeadX(target)) + snakeN + 1,
      y: Math.max(getHeadY(snake0), getHeadY(target)) + snakeN + 1
    }
  };
  const [t0, ...forbidden] = targetCells;
  forbidden.slice(0, 3);
  const openList = [{ snake: snake0, w: 0 }];
  const closeList = [];
  while (openList.length) {
    const o = openList.shift();
    const x = getHeadX(o.snake);
    const y = getHeadY(o.snake);
    if (x === t0.x && y === t0.y) {
      const path = [];
      let e = o;
      while (e) {
        path.push(e.snake);
        e = e.parent;
      }
      path.unshift(...getTunnelPath(path[0], targetCells));
      path.pop();
      path.reverse();
      return path;
    }
    for (let i = 0;i < around4.length; i++) {
      const { x: dx, y: dy } = around4[i];
      const nx = x + dx;
      const ny = y + dy;
      if (!snakeWillSelfCollide(o.snake, dx, dy) && (!grid || isEmptySafe3(grid, nx, ny)) && (grid ? isInsideLarge(grid, 2, nx, ny) : box.min.x <= nx && nx <= box.max.x && box.min.y <= ny && ny <= box.max.y) && !forbidden.some((p) => p.x === nx && p.y === ny)) {
        const snake = nextSnake(o.snake, dx, dy);
        if (!closeList.some((s) => snakeEquals(snake, s))) {
          const w = o.w + 1;
          const h = Math.abs(nx - x) + Math.abs(ny - y);
          const f = w + h;
          sortPush(openList, { f, w, snake, parent: o }, (a, b) => a.f - b.f);
          closeList.push(snake);
        }
      }
    }
  }
};

// ../generate-snake-animation/hamiltonianRoute.ts
var ORIENTATIONS = ["row-wise", "column-wise"];
var pickOrientation = () => ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)];
var sweepCells = (grid, orientation) => {
  const cells = [];
  if (orientation === "row-wise") {
    for (let y = 0;y < grid.height; y++) {
      if (y % 2 === 0)
        for (let x = 0;x < grid.width; x++)
          cells.push({ x, y });
      else
        for (let x = grid.width - 1;x >= 0; x--)
          cells.push({ x, y });
    }
  } else {
    for (let x = 0;x < grid.width; x++) {
      if (x % 2 === 0)
        for (let y = 0;y < grid.height; y++)
          cells.push({ x, y });
      else
        for (let y = grid.height - 1;y >= 0; y--)
          cells.push({ x, y });
    }
  }
  return cells;
};
var getHamiltonianRoute = (grid, snake0, orientation) => {
  const chain = [];
  let snake = snake0;
  const stepTo = (x, y) => {
    const dx = x - getHeadX(snake);
    const dy = y - getHeadY(snake);
    if (Math.abs(dx) + Math.abs(dy) !== 1)
      throw new Error(`hamiltonian route is not contiguous at (${x},${y})`);
    if (snakeWillSelfCollide(snake, dx, dy))
      throw new Error(`hamiltonian route collides with itself at (${x},${y})`);
    snake = nextSnake(snake, dx, dy);
    chain.push(snake);
  };
  while (getHeadX(snake) !== 0 || getHeadY(snake) !== 0) {
    if (getHeadX(snake) !== 0)
      stepTo(getHeadX(snake) + Math.sign(0 - getHeadX(snake)), getHeadY(snake));
    else
      stepTo(0, getHeadY(snake) + Math.sign(0 - getHeadY(snake)));
  }
  for (const { x, y } of sweepCells(grid, orientation).slice(1))
    stepTo(x, y);
  return chain;
};

// ../types/__fixtures__/snake.ts
var create = (length) => createSnakeFromCells(Array.from({ length }, (_, i) => ({ x: i, y: -1 })));
var snake1 = create(1);
var snake3 = create(3);
var snake4 = create(4);
var snake5 = create(5);
var snake9 = create(9);

// ../generate-snake-animation/cellsToGrid.ts
var cellsToGrid = (cells) => {
  const width = Math.max(0, ...cells.map((c) => c.x)) + 1;
  const height = Math.max(0, ...cells.map((c) => c.y)) + 1;
  const grid = createEmptyGrid(width, height);
  for (const c of cells) {
    if (c.level > 0)
      setColor(grid, c.x, c.y, c.level);
    else
      setColorEmpty(grid, c.x, c.y);
  }
  return grid;
};

// ../generate-snake-animation/palettes.ts
var basePalettes = {
  "github-light": {
    colorBackground: "#ffffff",
    colorDotBorder: "#1b1f230a",
    colorDots: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    colorEmpty: "#ebedf0",
    colorSnake: "purple"
  },
  "github-dark": {
    colorBackground: "#0c1116",
    colorDotBorder: "#1b1f230a",
    colorEmpty: "#161b22",
    colorDots: ["#161b22", "#01311f", "#034525", "#0f6d31", "#00c647"],
    colorSnake: "purple"
  },
  "forgejo-light": {
    colorBackground: "#ffffff",
    colorDotBorder: "#00000010",
    colorEmpty: "#d4d4d8",
    colorDots: ["#d4d4d8", "#fdba74", "#f97316", "#c2410c", "#7c2d12"],
    colorSnake: "#7c2d12"
  },
  "forgejo-dark": {
    colorBackground: "#1f2937",
    colorDotBorder: "#ffffff10",
    colorEmpty: "#2b3642",
    colorDots: ["#2b3642", "#9a3412", "#ea580c", "#fb923c", "#fed7aa"],
    colorSnake: "#fed7aa"
  },
  "codeberg-light": {
    colorBackground: "#ffffff",
    colorDotBorder: "#00000010",
    colorEmpty: "#d0d7de",
    colorDots: ["#d0d7de", "#8db5dc", "#679cd0", "#4183c4", "#254f77"],
    colorSnake: "#254f77"
  },
  "codeberg-dark": {
    colorBackground: "#161b22",
    colorDotBorder: "#ffffff10",
    colorEmpty: "#3b444a",
    colorDots: ["#3b444a", "#254f77", "#31699f", "#4183c4", "#8db5dc"],
    colorSnake: "#8db5dc"
  },
  "gitlab-light": {
    colorBackground: "#ffffff",
    colorDotBorder: "#00000010",
    colorEmpty: "#edebe6",
    colorDots: ["#edebe6", "#9dc7f1", "#428fdc", "#2f68b4", "#284779"],
    colorSnake: "#284779"
  },
  "gitlab-dark": {
    colorBackground: "#1f1e24",
    colorDotBorder: "#ffffff10",
    colorEmpty: "#2a2a36",
    colorDots: ["#2a2a36", "#284779", "#2f68b4", "#428fdc", "#9dc7f1"],
    colorSnake: "#9dc7f1"
  }
};
var palettes = {
  ...basePalettes,
  github: basePalettes["github-light"],
  forgejo: basePalettes["forgejo-light"],
  codeberg: basePalettes["codeberg-light"],
  gitlab: basePalettes["gitlab-light"],
  default: basePalettes["github-light"]
};

// ../generate-snake-animation/generateSnakeAnimation.ts
var getUserContribution = async (source) => {
  switch (source.platform) {
    case "github":
      return getGithubUserContribution(source.username, {
        githubToken: source.githubToken,
        baseUrl: source.baseUrl
      });
    case "gitlab":
      return getGitlabUserContribution(source.username, {
        baseUrl: source.baseUrl
      });
    case "forgejo":
      return getForgejoUserContribution(source.username, {
        baseUrl: source.baseUrl
      });
  }
};
var generateSnakeAnimation = async (source, outputs) => {
  console.log(`\uD83C\uDFA3 fetching user contribution from ${source.platform}`);
  const cells = await getUserContribution(source);
  const grid = cellsToGrid(cells);
  const snake = snake4;
  console.log("\uD83D\uDCE1 computing best route");
  const orientation = pickOrientation();
  console.log(`\uD83E\uDDED sweep: ${orientation}`);
  let chain;
  try {
    chain = getHamiltonianRoute(grid, snake, orientation);
  } catch (err) {
    console.log(`⚠️ hamiltonian sweep failed (${err}), using solver route`);
    chain = getBestRoute(grid, snake);
    chain.push(...getPathToPose(chain.slice(-1)[0], snake));
  }
  return Promise.all(outputs.map(async (out, i) => {
    if (!out)
      return;
    const { format, drawOptions, animationOptions } = out;
    switch (format) {
      case "svg": {
        console.log(`\uD83D\uDD8C creating svg (outputs[${i}])`);
        await Promise.resolve().then(() => init_svg_creator());
        return createSvg(grid, cells, chain, drawOptions, animationOptions);
      }
      case "gif": {
        console.log(`\uD83D\uDCF9 creating gif (outputs[${i}])`);
        await Promise.resolve().then(() => init_gif_creator());
        return createGif(grid, cells, chain, drawOptions, animationOptions);
      }
    }
  }));
};

// ../generate-snake-animation/outputsOptions.ts
var parseOutputsOption = (lines) => lines.map(parseEntry);
var parseEntry = (entry) => {
  const m = entry.trim().match(/^(.+\.(svg|gif))(\?(.*)|\s*({.*}))?$/);
  if (!m)
    return null;
  const [, filename, format, _, q1, q2] = m;
  const query = q1 ?? q2;
  let sp = new URLSearchParams(query || "");
  try {
    const o = JSON.parse(query);
    if (Array.isArray(o.color_dots))
      o.color_dots = o.color_dots.join(",");
    sp = new URLSearchParams(o);
  } catch (err) {
    if (!(err instanceof SyntaxError))
      throw err;
  }
  const drawOptions = {
    sizeDotBorderRadius: 2,
    sizeCell: 16,
    sizeDot: 12,
    ...palettes["default"]
  };
  const animationOptions = {
    frameByStep: 1,
    stepDurationMs: 100
  };
  {
    const palette = palettes[sp.get("palette")];
    if (palette) {
      Object.assign(drawOptions, palette);
    }
  }
  if (sp.has("color_dots")) {
    const colors = sp.get("color_dots").split(/[,;]/);
    drawOptions.colorDots = colors;
    drawOptions.colorEmpty = colors[0];
  }
  if (sp.has("color_snake"))
    drawOptions.colorSnake = sp.get("color_snake");
  if (sp.has("color_background"))
    drawOptions.colorBackground = sp.get("color_background");
  if (sp.has("color_dot_border"))
    drawOptions.colorDotBorder = sp.get("color_dot_border");
  if (sp.has("step_duration_ms")) {
    const v = parseInt(sp.get("step_duration_ms"), 10);
    if (Number.isFinite(v) && v > 0)
      animationOptions.stepDurationMs = v;
  }
  return {
    filename,
    format,
    drawOptions,
    animationOptions
  };
};

// github-action.ts
var os = __toESM(require("node:os"));
var getInput = (name) => process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
var setFailed = (message) => {
  process.exitCode = 1;
  process.stdout.write(`::error::${escapeData(message)}::${os.EOL}`);
};
function escapeData(s) {
  return s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

// index.ts
(async () => {
  try {
    const userName = getInput("github_user_name");
    const githubToken = process.env.GITHUB_TOKEN ?? getInput("github_token");
    const outputsRaw = [
      ...getInput("outputs").split(`
`),
      getInput("gif_out_path"),
      getInput("svg_out_path")
    ].map((x) => x.trim()).filter(Boolean);
    const outputs = parseOutputsOption(outputsRaw);
    const results = await generateSnakeAnimation({ platform: "github", username: userName, githubToken }, outputs);
    outputs.forEach((out, i) => {
      const result = results[i];
      if (out?.filename && result) {
        console.log(`\uD83D\uDCBE writing to ${out?.filename}`);
        fs2.mkdirSync(path2.dirname(out?.filename), { recursive: true });
        fs2.writeFileSync(out?.filename, result);
      }
    });
  } catch (e) {
    setFailed(`Action failed with "${e.message}"`);
  }
})();
