import { BULLDAK, DAY_END, HYEJIN, JUNGWOO, SICK, SOCIAL, TIME } from "./balance";
import { addDays, daysBetween, isAnniversary, isSunday, isWeekend } from "./date";
import { addHyejinHappiness, emitWarningChange, updateCountdown } from "./hyejin";
import { rollPercent } from "./rules";
import { markSeen } from "./seen";
import type { ActionContext, ActionError, ActionResult, GameDate, GameEvent, GameState, Rng, SocialEventId } from "./types";

const SCHEDULED: readonly SocialEventId[] = ["anniversary", "payday"];
const RANDOM_EVENTS = (Object.keys(SOCIAL.EVENTS) as SocialEventId[]).filter((e) => !SCHEDULED.includes(e));

/** 그날 날짜로 정해진 이벤트 (기념일 > 월급날) */
function scheduledSocial(date: GameDate): SocialEventId | null {
  if (isAnniversary(date)) return "anniversary";
  if (Number(date.slice(8)) === SOCIAL.PAYDAY_DAY_OF_MONTH) return "payday";
  return null;
}

/** 그날 랜덤으로 생길 수 있는 이벤트 */
function randomPool(date: GameDate): SocialEventId[] {
  const excluded: readonly string[] = isWeekend(date) ? SOCIAL.WEEKDAY_ONLY : SOCIAL.WEEKEND_ONLY;
  return RANDOM_EVENTS.filter((e) => !excluded.includes(e));
}

export function createInitialJungwoo(): GameState["jungwoo"] {
  return {
    happiness: JUNGWOO.START_HAPPINESS,
    money: JUNGWOO.START_MONEY,
    totalWorkCount: 0,
    rank: 1,
    actionsLeft: 0,
    workCountToday: 0,
    sulking: false,
  };
}

/** 하루 마감: 혜진 행복도 감소, 주말이 끝났으면 데이트 사용 여부 초기화 */
function endDay(s: GameState, events: GameEvent[]): void {
  const date = s.lastSettledDate;
  const commute = isWeekend(date) ? 0 : DAY_END.WEEKDAY_COMMUTE;
  const overwork = s.jungwoo.workCountToday >= DAY_END.OVERWORK_THRESHOLD ? DAY_END.OVERWORK_PENALTY : 0;
  const bulldakIgnored = s.bulldak === "active" ? DAY_END.BULLDAK_IGNORED_PENALTY : 0;

  const before = s.hyejin.happiness;
  addHyejinHappiness(s, commute);
  addHyejinHappiness(s, overwork);
  addHyejinHappiness(s, bulldakIgnored);
  events.push({ type: "dayEnded", date, commute, overwork, bulldakIgnored });
  // 하루 마감은 턴이 아니므로 카운트다운 시작·해제만 하고 절반 섭취는 일어나지 않는다.
  updateCountdown(s, 0, events);
  emitWarningChange(before, s.hyejin.happiness, events);

  if (isSunday(date)) s.weekendDateUsed = false;
}

/** 새 날 아침: 행동 충전(전날 밤샘 피로만큼 덜), 삐짐·감기 해제, 불닭 판정(평일만), 이벤트 판정, 감기 판정 */
function startDay(s: GameState, date: GameDate, rng: Rng, events: GameEvent[]): void {
  const j = s.jungwoo;
  const sulkHealed = j.sulking;
  if (j.sulking) {
    j.happiness = JUNGWOO.HAPPINESS_AFTER_SULK;
    j.sulking = false;
  }
  const tired = s.jungwooTiredActions;
  j.actionsLeft = Math.max(0, TIME.ACTIONS_PER_DAY - tired);
  s.jungwooTiredActions = 0;
  j.workCountToday = 0;
  s.lastSettledDate = date;
  events.push({ type: "dayStarted", date, sulkHealed, tired });

  s.bulldak = "none";
  if (!isWeekend(date) && rollPercent(rng, BULLDAK.WEEKDAY_CHANCE_PERCENT)) {
    s.bulldak = "active";
    events.push({ type: "bulldakCraving", date });
  }

  s.social = scheduledSocial(date);
  if (!s.social && rollPercent(rng, SOCIAL.CHANCE_PERCENT)) {
    const pool = randomPool(date);
    s.social = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  }
  if (s.social) events.push({ type: "socialEvent", event: s.social });

  s.hyejin.sick = rollPercent(rng, SICK.CHANCE_PERCENT);
  if (s.hyejin.sick) events.push({ type: "hyejinSick" });
}

/** 새 게임. 게임 속 첫날(기본: 사귀기 시작한 날) 아침이 막 시작된 상태. */
export function createInitialState(
  firstDay: GameDate = TIME.START_DATE,
  rng: Rng,
): { state: GameState; events: GameEvent[] } {
  const state: GameState = {
    jungwoo: createInitialJungwoo(),
    hyejin: {
      happiness: HYEJIN.START_HAPPINESS,
      level: HYEJIN.START_LEVEL,
      hanjeongseon: HYEJIN.START_HANJEONGSEON,
      countdownTurnsLeft: null,
      jungwooBlockUsed: false,
      sick: false,
    },
    bulldak: "none",
    bestStars: {},
    weekendDateUsed: false,
    lastSettledDate: firstDay,
    nights: { realDay: null, used: 0 },
    social: null,
    seenEvents: [],
    jungwooTiredActions: 0,
    knownPlaceCount: null,
  };
  const events: GameEvent[] = [];
  startDay(state, firstDay, rng, events);
  markSeen(state, events);
  return { state, events };
}

/** 하루 마감 + 다음 날 아침을 한 번 진행한다 (밤 횟수는 세지 않는다). 입력 상태는 바꾸지 않는다. */
export function closeDay(state: GameState, rng: Rng): { state: GameState; events: GameEvent[] } {
  const s = structuredClone(state);
  const events: GameEvent[] = [];
  endDay(s, events);
  startDay(s, addDays(s.lastSettledDate, 1), rng, events);
  markSeen(s, events);
  return { state: s, events };
}

/** 게임 날짜가 target이 될 때까지 하루씩 넘긴다. 이미 그날이거나 지났으면 그대로. */
export function advanceTo(state: GameState, target: GameDate, rng: Rng): { state: GameState; events: GameEvent[] } {
  let s = state;
  const events: GameEvent[] = [];
  for (let i = daysBetween(state.lastSettledDate, target); i > 0; i--) {
    const next = closeDay(s, rng);
    s = next.state;
    events.push(...next.events);
  }
  return { state: s, events };
}

/** 이번 현실 하루에 이미 잔 밤 횟수 */
export function nightsUsed(state: GameState, realDay: GameDate): number {
  return state.nights.realDay === realDay ? state.nights.used : 0;
}

/** 잠잘 수 있는지. 성공 시 null. */
export function validateSleep(state: GameState, ctx: ActionContext): ActionError | null {
  if (ctx.realDay !== undefined && nightsUsed(state, ctx.realDay) >= TIME.NIGHTS_PER_REAL_DAY) return "NO_NIGHTS_LEFT";
  return null;
}

/** 잠자기: 하루 마감 + 다음 날 아침. 현실 하루의 밤 횟수를 하나 쓴다. */
export function sleep(state: GameState, ctx: ActionContext): ActionResult {
  const error = validateSleep(state, ctx);
  if (error) return { ok: false, error };
  const { state: next, events } = closeDay(state, ctx.rng);
  if (ctx.realDay !== undefined) {
    next.nights = { realDay: ctx.realDay, used: nightsUsed(state, ctx.realDay) + 1 };
  }
  return { ok: true, state: next, events };
}
