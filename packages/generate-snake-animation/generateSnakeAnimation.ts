import { getForgejoUserContribution } from "@snk/forgejo-user-contribution";
import type { AnimationOptions } from "@snk/gif-creator";
import { getGithubUserContribution } from "@snk/github-user-contribution";
import { getGitlabUserContribution } from "@snk/gitlab-user-contribution";
import { getBestRoute } from "@snk/solver/getBestRoute";
import { getPathToPose } from "@snk/solver/getPathToPose";
import { getAdaptiveRoute } from "./hamiltonianRoute";
import { getForagingRoute } from "./foragingRoute";
import type { DrawOptions } from "@snk/svg-creator";
import { snake4 } from "@snk/types/__fixtures__/snake";
import { cellsToGrid } from "./cellsToGrid";

export { basePalettes, palettes } from "./palettes";

export type Source =
  | {
      platform: "github";
      username: string;
      githubToken: string;
      baseUrl?: string;
    }
  | { platform: "gitlab"; username: string; baseUrl?: string }
  | { platform: "forgejo"; username: string; baseUrl: string };

export type Output = {
  format: "svg" | "gif";
  drawOptions: DrawOptions;
  animationOptions: AnimationOptions;
};

export const getUserContribution = async (source: Source) => {
  switch (source.platform) {
    case "github":
      return getGithubUserContribution(source.username, {
        githubToken: source.githubToken,
        baseUrl: source.baseUrl,
      });
    case "gitlab":
      return getGitlabUserContribution(source.username, {
        baseUrl: source.baseUrl,
      });
    case "forgejo":
      return getForgejoUserContribution(source.username, {
        baseUrl: source.baseUrl,
      });
  }
};

export const generateSnakeAnimation = async (
  source: Source,
  outputs: (Output | null)[],
) => {
  console.log(`🎣 fetching user contribution from ${source.platform}`);
  const cells = await getUserContribution(source);
  const grid = cellsToGrid(cells);
  // greedy-TSP foraging with A* legs and reach-tail lookahead: hunts the
  // nearest green with shortest paths, committing only provably safe legs.
  // falls back to the adaptive sweep, then the solver route.
  const snake = snake4;

  console.log("📡 computing best route");
  let chain;
  try {
    const route = getForagingRoute(grid, snake);
    console.log(`🎯 forage: ${route.stats}`);
    chain = route.chain;
  } catch (err) {
    console.log(`⚠️ foraging failed (${err}), using adaptive sweep`);
    try {
      const route = getAdaptiveRoute(grid, snake);
      console.log(`🧭 sweep: ${route.plan}`);
      chain = route.chain;
    } catch (err2) {
      console.log(`⚠️ adaptive sweep failed (${err2}), using solver route`);
      chain = getBestRoute(grid, snake)!;
      chain.push(...getPathToPose(chain.slice(-1)[0], snake)!);
    }
  }

  return Promise.all(
    outputs.map(async (out, i) => {
      if (!out) return;
      const { format, drawOptions, animationOptions } = out;
      switch (format) {
        case "svg": {
          console.log(`🖌 creating svg (outputs[${i}])`);
          const { createSvg } = await import("@snk/svg-creator");
          return createSvg(grid, cells, chain, drawOptions, animationOptions);
        }
        case "gif": {
          console.log(`📹 creating gif (outputs[${i}])`);
          const { createGif } = await import("@snk/gif-creator");
          return createGif(grid, cells, chain, drawOptions, animationOptions);
        }
      }
    }),
  );
};
