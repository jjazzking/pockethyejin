import { BULLDAK, DAY_END, HYEJIN, JUNGWOO, TIME } from "./balance";
import { addDays, daysBetween, isSunday, isWeekend } from "./date";
import { createInitialJungwoo } from "./engine";
import { addHyejinHappiness, emitWarningChange, updateCountdown } from "./hyejin";
import { rollPercent } from "./rules";
import type { GameDate, GameEvent, GameState, Rng } from "./types";

/** 부재한 날 감소량: 비율을 곱하고 소수점 버림 (-15 → -7) */
function absentPenalty(amount: number): number {
  return Math.sign(amount) * Math.floor(Math.abs(amount) * TIME.ABSENT_DAY_PENALTY_RATIO);
}

/** 하루 마감: 혜진 행복도 감소, 주말이 끝났으면 데이트 사용 여부 초기화 */
function endDay(s: GameState, absent: boolean, events: GameEvent[]): void {
  const date = s.lastSettledDate;
  const scale = (n: number) => (absent ? absentPenalty(n) : n);
  const commute = isWeekend(date) ? 0 : scale(DAY_END.WEEKDAY_COMMUTE);
  const overwork =
    s.jungwoo.workCountToday >= DAY_END.OVERWORK_THRESHOLD ? scale(DAY_END.OVERWORK_PENALTY) : 0;
  const bulldakIgnored = s.bulldak === "active" ? scale(DAY_END.BULLDAK_IGNORED_PENALTY) : 0;

  const before = s.hyejin.happiness;
  addHyejinHappiness(s, commute);
  addHyejinHappiness(s, overwork);
  addHyejinHappiness(s, bulldakIgnored);
  events.push({ type: "dayEnded", date, absent, commute, overwork, bulldakIgnored });
  // 하루 마감은 턴이 아니므로 카운트다운 시작·해제만 하고 절반 섭취는 일어나지 않는다.
  updateCountdown(s, 0, events);
  emitWarningChange(before, s.hyejin.happiness, events);

  if (isSunday(date)) s.weekendDateUsed = false;
}

/** 새 날 아침: 행동 충전, 삐짐 해제, 불닭 판정(평일만) */
function startDay(s: GameState, date: GameDate, rng: Rng, events: GameEvent[]): void {
  const j = s.jungwoo;
  const sulkHealed = j.sulking;
  if (j.sulking) {
    j.happiness = JUNGWOO.HAPPINESS_AFTER_SULK;
    j.sulking = false;
  }
  j.actionsLeft = TIME.ACTIONS_PER_DAY;
  j.workCountToday = 0;
  s.lastSettledDate = date;
  events.push({ type: "dayStarted", date, sulkHealed });

  s.bulldak = "none";
  if (!isWeekend(date) && rollPercent(rng, BULLDAK.WEEKDAY_CHANCE_PERCENT)) {
    s.bulldak = "active";
    events.push({ type: "bulldakCraving", date });
  }
}

/** 새 게임. today 아침이 막 시작된 상태. */
export function createInitialState(today: GameDate, rng: Rng): { state: GameState; events: GameEvent[] } {
  const state: GameState = {
    jungwoo: createInitialJungwoo(),
    hyejin: {
      happiness: HYEJIN.START_HAPPINESS,
      level: HYEJIN.START_LEVEL,
      hanjeongseon: HYEJIN.START_HANJEONGSEON,
      countdownTurnsLeft: null,
      jungwooBlockUsed: false,
    },
    bulldak: "none",
    bestStars: {},
    weekendDateUsed: false,
    lastSettledDate: today,
  };
  const events: GameEvent[] = [];
  startDay(state, today, rng, events);
  return { state, events };
}

/**
 * 하루 마감 + 다음 날 아침을 한 번 진행한다. 입력 상태는 바꾸지 않는다.
 * absent: 마감하는 날(state.lastSettledDate)에 혜진이 접속하지 않았는지. 감소가 절반만 적용된다.
 */
export function closeDay(state: GameState, absent: boolean, rng: Rng): { state: GameState; events: GameEvent[] } {
  const s = structuredClone(state);
  const events: GameEvent[] = [];
  endDay(s, absent, events);
  startDay(s, addDays(s.lastSettledDate, 1), rng, events);
  return { state: s, events };
}

/**
 * 접속 시 밀린 날짜를 일괄 정산한다. 입력 상태는 바꾸지 않는다.
 * - 마지막 정산일은 혜진이 접속했던 날이므로 감소를 그대로 적용한다.
 * - 그 사이에 접속하지 않은 날은 감소를 절반(버림)만 적용한다.
 * - 정산 중에는 턴이 흐르지 않으므로 한정선 절반 섭취는 절대 일어나지 않는다.
 * - 오늘이 마지막 정산일과 같거나 이전이면 아무 일도 없다.
 */
export function settle(state: GameState, today: GameDate, rng: Rng): { state: GameState; events: GameEvent[] } {
  const days = daysBetween(state.lastSettledDate, today);
  if (days <= 0) return { state, events: [] };

  let s = state;
  const events: GameEvent[] = [];
  for (let i = 0; i < days; i++) {
    const next = closeDay(s, i > 0, rng);
    s = next.state;
    events.push(...next.events);
  }
  return { state: s, events };
}
