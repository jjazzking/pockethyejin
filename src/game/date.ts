import { TIME } from "./balance";
import type { GameDate } from "./types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function parse(date: GameDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function format(utcMs: number): GameDate {
  return new Date(utcMs).toISOString().slice(0, 10);
}

/** 실제 시각 → 게임 날짜. KST 아침 리셋 시각 이전은 전날로 친다. */
export function toGameDate(now: Date): GameDate {
  const shifted = now.getTime() + (TIME.KST_UTC_OFFSET_HOURS - TIME.DAY_RESET_HOUR_KST) * HOUR_MS;
  return format(shifted);
}

export function addDays(date: GameDate, days: number): GameDate {
  return format(parse(date) + days * DAY_MS);
}

/** a → b 까지의 일수 (b가 이후면 양수) */
export function daysBetween(a: GameDate, b: GameDate): number {
  return Math.round((parse(b) - parse(a)) / DAY_MS);
}

/** 0 = 일요일 … 6 = 토요일 */
export function dayOfWeek(date: GameDate): number {
  return new Date(parse(date)).getUTCDay();
}

export function isWeekend(date: GameDate): boolean {
  const dow = dayOfWeek(date);
  return dow === 0 || dow === 6;
}

export function isMonday(date: GameDate): boolean {
  return dayOfWeek(date) === 1;
}
