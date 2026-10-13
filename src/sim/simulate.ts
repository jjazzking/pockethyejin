import { addDays } from "@/game/date";
import { closeDay, createInitialState } from "@/game/day";
import type { GameDate, GameEvent, GameState, PlaceRef, Rng } from "@/game/types";
import { DayRunner, type Strategy } from "./strategies";

/** 시드 고정 난수 (mulberry32) */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RunResult {
  /** 주차별(1주차부터) 주말 마감 시점 레벨 */
  levelByWeek: number[];
  /** 직급 단계 → 처음 도달한 날 (1일차부터). 도달 못 했으면 없음 */
  promotionDay: Record<number, number>;
  rejections: number;
  warnings: number;
  countdowns: number;
  blocks: number;
  halfEats: number;
  /** 처음 경고가 뜬 날 (없으면 null) */
  firstWarningDay: number | null;
  /** 처음 절반 섭취한 날 (없으면 null) */
  firstHalfEatDay: number | null;
  dates: number;
  threeStarDates: number;
  bulldakMissed: number;
  /** 마지막 날 혜진·정우 행복도 */
  finalHyejin: number;
  finalJungwoo: number;
  /** 주차별 평균 혜진 행복도(그 주 하루 마감 직전 평균) */
  hyejinByWeek: number[];
}

export interface SimOptions {
  weeks: number;
  /** 첫날 (월요일 권장) */
  startDate: GameDate;
  /** 장소 수. 레벨 상한에 걸리지 않게 넉넉히 */
  placeCount: number;
}

export const DEFAULT_SIM: SimOptions = { weeks: 12, startDate: "2026-01-05", placeCount: 60 };

export function simulateRun(makeStrategy: () => Strategy, seed: number, opts: SimOptions = DEFAULT_SIM): RunResult {
  const rng = seededRng(seed);
  const strategy = makeStrategy();
  const places: PlaceRef[] = Array.from({ length: opts.placeCount }, (_, i) => ({ id: `place-${i + 1}` }));
  let state: GameState = { ...createInitialState(opts.startDate, rng).state, knownPlaceCount: places.length };

  const r: RunResult = {
    levelByWeek: [],
    promotionDay: {},
    rejections: 0,
    warnings: 0,
    countdowns: 0,
    blocks: 0,
    halfEats: 0,
    firstWarningDay: null,
    firstHalfEatDay: null,
    dates: 0,
    threeStarDates: 0,
    bulldakMissed: 0,
    finalHyejin: 0,
    finalJungwoo: 0,
    hyejinByWeek: [],
  };
  let weekHappiness = 0;

  const count = (events: GameEvent[], day: number) => {
    for (const e of events) {
      if (e.type === "waitingRejected") r.rejections++;
      if (e.type === "warningStarted") {
        r.warnings++;
        r.firstWarningDay ??= day;
      }
      if (e.type === "countdownStarted") r.countdowns++;
      if (e.type === "jungwooBlocked") r.blocks++;
      if (e.type === "halfEaten") {
        r.halfEats++;
        r.firstHalfEatDay ??= day;
      }
      if (e.type === "promoted") r.promotionDay[e.rank] ??= day;
      if (e.type === "dated") {
        r.dates++;
        if (e.stars === 3) r.threeStarDates++;
      }
      if (e.type === "dayEnded" && e.bulldakIgnored < 0) r.bulldakMissed++;
    }
  };

  const totalDays = opts.weeks * 7;
  for (let i = 0; i < totalDays; i++) {
    const day = i + 1;
    const date = addDays(opts.startDate, i);
    const present = strategy.present(date);
    if (present) {
      const runner = new DayRunner(state, { rng, places });
      strategy.playDay(runner, date);
      state = runner.state;
      count(runner.events, day);
    }
    weekHappiness += state.hyejin.happiness;
    const closed = closeDay(state, rng);
    state = closed.state;
    count(closed.events, day);

    if (day % 7 === 0) {
      r.levelByWeek.push(state.hyejin.level);
      r.hyejinByWeek.push(weekHappiness / 7);
      weekHappiness = 0;
    }
  }
  r.finalHyejin = state.hyejin.happiness;
  r.finalJungwoo = state.jungwoo.happiness;
  return r;
}

export function simulateMany(makeStrategy: () => Strategy, runs: number, baseSeed = 1, opts: SimOptions = DEFAULT_SIM): RunResult[] {
  return Array.from({ length: runs }, (_, i) => simulateRun(makeStrategy, baseSeed + i, opts));
}
