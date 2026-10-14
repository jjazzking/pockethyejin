import type { GameDate, GameEvent, GameState } from "./types";

/** 자고 일어났을 때 보여주는 "밤사이 있었던 일" 요약 */
export interface NightSummary {
  /** 마감한 날 */
  fromDate: GameDate;
  /** 새로 시작한 날 */
  toDate: GameDate;
  hyejinHappiness: { before: number; after: number; change: number };
  /** 원인별 감소 (음수). 0~100 제한 때문에 합이 실제 변화량과 다를 수 있다. */
  breakdown: { commute: number; overwork: number; bulldakIgnored: number };
  /** 오늘 아침 새로 생긴 불닭 이벤트 */
  bulldakToday: boolean;
  /** 마감하면서 경고 구간(30 이하)에 들어갔는지 */
  warningStarted: boolean;
  /** 카운트다운이 진행 중인지 (남은 턴) */
  countdownTurnsLeft: number | null;
  /** 삐졌던 정우가 풀렸는지 */
  jungwooSulkHealed: boolean;
  /** 밤샘 포커 피로로 오늘 줄어든 정우 행동 수 */
  jungwooTired: number;
}

/** 잠자기 전후 상태와 이벤트로 요약을 만든다. 날짜가 넘어가지 않았으면 null. */
export function summarizeNight(before: GameState, after: GameState, events: GameEvent[]): NightSummary | null {
  const ends = events.filter((e) => e.type === "dayEnded");
  if (ends.length === 0) return null;

  const sum = (key: "commute" | "overwork" | "bulldakIgnored") => ends.reduce((acc, e) => acc + e[key], 0);
  return {
    fromDate: before.lastSettledDate,
    toDate: after.lastSettledDate,
    hyejinHappiness: {
      before: before.hyejin.happiness,
      after: after.hyejin.happiness,
      change: after.hyejin.happiness - before.hyejin.happiness,
    },
    breakdown: { commute: sum("commute"), overwork: sum("overwork"), bulldakIgnored: sum("bulldakIgnored") },
    bulldakToday: after.bulldak === "active",
    warningStarted: events.some((e) => e.type === "warningStarted"),
    countdownTurnsLeft: after.hyejin.countdownTurnsLeft,
    jungwooSulkHealed: events.some((e) => e.type === "dayStarted" && e.sulkHealed),
    jungwooTired: events.reduce((n, e) => (e.type === "dayStarted" ? n + e.tired : n), 0),
  };
}
