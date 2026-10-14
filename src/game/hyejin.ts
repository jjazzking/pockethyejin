import { WARNING } from "./balance";
import { clampHappiness } from "./rules";
import type { GameEvent, GameState } from "./types";

export function isWarning(happiness: number): boolean {
  return happiness <= WARNING.WARNING_HAPPINESS;
}

export function isDanger(happiness: number): boolean {
  return happiness <= WARNING.DANGER_HAPPINESS;
}

/** 감기 걸린 날은 오르는 행복도가 반만 (내림) */
export function addHyejinHappiness(s: GameState, delta: number): void {
  const gain = delta > 0 && s.hyejin.sick ? Math.floor(delta / 2) : delta;
  s.hyejin.happiness = clampHappiness(s.hyejin.happiness + gain);
}

/** 행복도가 경고 구간에 들어가거나 벗어났으면 이벤트를 남긴다. */
export function emitWarningChange(before: number, after: number, events: GameEvent[]): void {
  if (!isWarning(before) && isWarning(after)) events.push({ type: "warningStarted" });
  if (isWarning(before) && !isWarning(after)) events.push({ type: "warningEnded" });
}

/** 카운트다운이 끝났을 때: 정우 막기(1회) 또는 한정선 절반 섭취 */
function resolveCountdown(s: GameState, events: GameEvent[]): void {
  const h = s.hyejin;
  if (!h.jungwooBlockUsed) {
    h.jungwooBlockUsed = true;
    h.countdownTurnsLeft = WARNING.COUNTDOWN_TURNS;
    events.push({ type: "jungwooBlocked" });
    return;
  }
  const eaten = Math.floor(h.hanjeongseon * WARNING.EAT_RATIO);
  const before = h.happiness;
  h.hanjeongseon -= eaten;
  addHyejinHappiness(s, eaten * WARNING.HAPPINESS_PER_EATEN);
  events.push({ type: "halfEaten", eaten, recovered: h.happiness - before });
  if (isDanger(h.happiness)) {
    h.countdownTurnsLeft = WARNING.COUNTDOWN_TURNS;
    events.push({ type: "countdownStarted", turnsLeft: h.countdownTurnsLeft });
  } else {
    h.countdownTurnsLeft = null;
  }
}

/**
 * 혜진 행복도가 바뀐 뒤 카운트다운 상태를 갱신한다.
 * - 20 초과: 카운트다운 해제
 * - 20 이하인데 카운트다운이 없었음: 3턴 카운트다운 시작 (이번 턴은 세지 않음)
 * - 이미 진행 중: 소모한 턴 수만큼 줄이고, 0이 되면 막기/절반 섭취
 *
 * turns는 이번에 소모한 정우 행동 수. 한정선 먹이기·레벨업·하루 마감은 0.
 * 절반 섭취는 turns > 0일 때만 일어나므로 접속 중에만 발동한다.
 */
export function updateCountdown(s: GameState, turns: number, events: GameEvent[]): void {
  const h = s.hyejin;
  if (!isDanger(h.happiness)) {
    if (h.countdownTurnsLeft !== null) events.push({ type: "countdownCancelled" });
    h.countdownTurnsLeft = null;
    return;
  }
  if (h.countdownTurnsLeft === null) {
    h.countdownTurnsLeft = WARNING.COUNTDOWN_TURNS;
    events.push({ type: "countdownStarted", turnsLeft: h.countdownTurnsLeft });
    return;
  }
  for (let i = 0; i < turns && h.countdownTurnsLeft !== null; i++) {
    h.countdownTurnsLeft -= 1;
    if (h.countdownTurnsLeft > 0) {
      events.push({ type: "countdownTicked", turnsLeft: h.countdownTurnsLeft });
    } else {
      resolveCountdown(s, events);
    }
  }
}
