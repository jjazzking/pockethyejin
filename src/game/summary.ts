import type { GameDate, GameEvent, GameState } from "./types";

/** "자리를 비운 동안" 요약 */
export interface AwaySummary {
  /** 마지막으로 정산했던 날 */
  fromDate: GameDate;
  /** 오늘 */
  toDate: GameDate;
  /** 지난 날 수 */
  daysPassed: number;
  /** 그중 접속하지 않은 날 수 */
  absentDays: number;
  hyejinHappiness: { before: number; after: number; change: number };
  /** 원인별 감소 합계 (음수). 0~100 제한 때문에 합이 실제 변화량과 다를 수 있다. */
  breakdown: { commute: number; overwork: number; bulldakIgnored: number };
  /** 대응하지 못하고 지나간 불닭 이벤트 날짜 */
  missedBulldakDates: GameDate[];
  /** 오늘 아침 새로 생긴 불닭 이벤트 */
  bulldakToday: boolean;
  /** 정산 중 경고 구간(30 이하)에 들어갔는지 */
  warningStarted: boolean;
  /** 정산 결과 카운트다운이 진행 중인지 (남은 턴) */
  countdownTurnsLeft: number | null;
  /** 삐졌던 정우가 풀렸는지 */
  jungwooSulkHealed: boolean;
}

/** settle 전후 상태와 이벤트로 요약을 만든다. 날짜가 지나지 않았으면 null. */
export function summarizeAway(before: GameState, after: GameState, events: GameEvent[]): AwaySummary | null {
  const ends = events.filter((e) => e.type === "dayEnded");
  if (ends.length === 0) return null;

  const sum = (key: "commute" | "overwork" | "bulldakIgnored") => ends.reduce((acc, e) => acc + e[key], 0);
  return {
    fromDate: before.lastSettledDate,
    toDate: after.lastSettledDate,
    daysPassed: ends.length,
    absentDays: ends.filter((e) => e.absent).length,
    hyejinHappiness: {
      before: before.hyejin.happiness,
      after: after.hyejin.happiness,
      change: after.hyejin.happiness - before.hyejin.happiness,
    },
    breakdown: { commute: sum("commute"), overwork: sum("overwork"), bulldakIgnored: sum("bulldakIgnored") },
    missedBulldakDates: ends.filter((e) => e.bulldakIgnored < 0).map((e) => e.date),
    bulldakToday: after.bulldak === "active",
    warningStarted: events.some((e) => e.type === "warningStarted"),
    countdownTurnsLeft: after.hyejin.countdownTurnsLeft,
    jungwooSulkHealed: events.some((e) => e.type === "dayStarted" && e.sulkHealed),
  };
}
