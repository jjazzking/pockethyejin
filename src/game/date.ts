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

const seoulDate = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME.TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * 실제 시각 → 게임 날짜. 서울 시간으로 아침 리셋 시각(06:00) 이전은 전날로 친다.
 * (리셋 시각만큼 당긴 순간의 서울 달력 날짜. 서울은 서머타임이 없어 항상 정확하다.)
 */
export function toGameDate(now: Date): GameDate {
  const parts = seoulDate.formatToParts(new Date(now.getTime() - TIME.DAY_RESET_HOUR * HOUR_MS));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
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

/** 주말의 마지막 날(일요일)인지 */
export function isSunday(date: GameDate): boolean {
  return dayOfWeek(date) === 0;
}
