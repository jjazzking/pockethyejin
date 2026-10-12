import {
  DATE_BUDGETS,
  DATE_OFFERING,
  HAPPINESS_MAX,
  HAPPINESS_MIN,
  LEVEL_UP,
  RANKS,
  SULK,
} from "./balance";
import type { Rng, Stars } from "./types";

export function clampHappiness(value: number): number {
  return Math.min(HAPPINESS_MAX, Math.max(HAPPINESS_MIN, value));
}

/** 누적 일 횟수 → 직급 단계 (1부터) */
export function rankForWorkCount(totalWorkCount: number): number {
  let rank = 1;
  RANKS.forEach((r, i) => {
    if (totalWorkCount >= r.minWorkCount) rank = i + 1;
  });
  return rank;
}

export function incomeForRank(rank: number): number {
  return RANKS[rank - 1].incomePerWork;
}

/** 현재 레벨에서 다음 레벨로 가는 데 드는 한정선 */
export function levelUpCost(level: number): number {
  let cost: number = LEVEL_UP.BASE_COST;
  for (let l = 1; l < level; l++) cost = Math.round(cost * LEVEL_UP.COST_MULTIPLIER);
  return cost;
}

/** 웨이팅 거절 확률 (%) */
export function rejectPercent(jungwooHappiness: number): number {
  if (jungwooHappiness >= SULK.SAFE_HAPPINESS) return 0;
  return Math.min(100, (SULK.SAFE_HAPPINESS - jungwooHappiness) * SULK.PERCENT_PER_HAPPINESS_BELOW);
}

/** percent% 확률로 true */
export function rollPercent(rng: Rng, percent: number): boolean {
  return rng() * 100 < percent;
}

export type StarPercents = { 1: number; 2: number; 3: number };

export function budgetPercents(budget: number): StarPercents | null {
  return DATE_BUDGETS.find((b) => b.amount === budget)?.starPercents ?? null;
}

/** 3성 확률을 상한까지 올리는 데 필요한 최대 한정선 개수 */
export function maxUsefulOffering(percents: StarPercents): number {
  const gap = DATE_OFFERING.MAX_THREE_STAR_PERCENT - percents[3];
  if (gap <= 0) return 0;
  return Math.ceil(gap / DATE_OFFERING.PERCENT_PER_BUNDLE) * DATE_OFFERING.BUNDLE_SIZE;
}

/** 한정선을 바쳤을 때의 별 확률. 3성 증가분은 1성에서 먼저, 그다음 2성에서 뺀다. */
export function applyOffering(percents: StarPercents, offering: number): StarPercents {
  const bundles = Math.floor(offering / DATE_OFFERING.BUNDLE_SIZE);
  const three = Math.min(
    DATE_OFFERING.MAX_THREE_STAR_PERCENT,
    percents[3] + bundles * DATE_OFFERING.PERCENT_PER_BUNDLE,
  );
  let boost = Math.max(0, three - percents[3]);
  const fromOne = Math.min(percents[1], boost);
  boost -= fromOne;
  const fromTwo = Math.min(percents[2], boost);
  return { 1: percents[1] - fromOne, 2: percents[2] - fromTwo, 3: percents[3] + fromOne + fromTwo };
}

export function rollStars(rng: Rng, percents: StarPercents): Stars {
  const r = rng() * 100;
  if (r < percents[1]) return 1;
  if (r < percents[1] + percents[2]) return 2;
  return 3;
}
