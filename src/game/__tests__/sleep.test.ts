import { describe, expect, it } from "vitest";
import { SOCIAL, TIME } from "../balance";
import { daysTogether, toRealDay } from "../date";
import { advanceTo, closeDay, createInitialState, nightsUsed } from "../day";
import { applyAction } from "../engine";
import { summarizeNight } from "../summary";
import {
  BULLDAK_MISS,
  COMMUTE,
  FRIDAY,
  NEVER,
  NEXT_MONDAY,
  OVERWORK,
  PLACES,
  SATURDAY,
  SUNDAY,
  act,
  makeState,
  sequence,
} from "./helpers";

const TODAY = "2026-10-13";
const sleepCtx = (realDay: string | undefined = TODAY, rng = NEVER) => ({ rng, places: PLACES, realDay });

describe("현실 하루 경계 (Asia/Seoul 06:00, 밤 횟수 단위)", () => {
  it("서울 시간 05:59까지는 전날, 06:00부터 새 날", () => {
    expect(toRealDay(new Date("2026-10-17T05:59:59+09:00"))).toBe("2026-10-16");
    expect(toRealDay(new Date("2026-10-17T06:00:00+09:00"))).toBe("2026-10-17");
  });

  it("UTC가 아니라 서울 날짜로 센다", () => {
    // 2026-10-16 22:00 UTC = 2026-10-17 07:00 KST
    expect(toRealDay(new Date("2026-10-16T22:00:00Z"))).toBe("2026-10-17");
  });
});

describe("새 게임은 사귄 첫날부터", () => {
  it("2026-03-30(월)이 1일째", () => {
    const { state } = createInitialState(undefined, NEVER);
    expect(state.lastSettledDate).toBe(TIME.START_DATE);
    expect(TIME.START_DATE).toBe("2026-03-30");
    expect(daysTogether(TIME.START_DATE)).toBe(1);
    expect(daysTogether("2026-04-05")).toBe(7);
    expect(state.nights).toEqual({ realDay: null, used: 0 });
  });
});

describe("closeDay: 하루 마감 + 다음 날 아침", () => {
  it("마감 감소를 적용하고 행동 충전·삐짐 해제·불닭 판정", () => {
    const s = makeState({
      jungwoo: { actionsLeft: 0, workCountToday: 3, sulking: true, happiness: 10 },
      bulldak: "active",
    });
    const { state, events } = closeDay(s, sequence(0, 0.999, 0.999));
    expect(state.hyejin.happiness).toBe(100 + COMMUTE + OVERWORK + BULLDAK_MISS);
    expect(state.jungwoo).toMatchObject({ actionsLeft: 5, workCountToday: 0, sulking: false, happiness: 100 });
    expect(state.bulldak).toBe("active");
    expect(state.lastSettledDate).toBe("2026-10-13");
    expect(events).toContainEqual({ type: "bulldakCraving", date: "2026-10-13" });
  });

  it("일요일을 마감하면 데이트 사용 여부가 초기화된다", () => {
    const sat = closeDay(makeState({ weekendDateUsed: true }, SATURDAY), NEVER).state;
    expect(sat.weekendDateUsed).toBe(true);
    expect(closeDay(sat, NEVER).state.weekendDateUsed).toBe(false);
  });

  it("금요일 → 월요일: 주말엔 출근 감소가 없고 불닭 판정은 월요일만", () => {
    // 토·일 아침은 이벤트·감기 판정만, 월요일 아침은 불닭 판정 + 이벤트·감기 판정
    const rng = sequence(0.999, 0.999, 0.999, 0.999, 0, 0.999, 0.999);
    const { state, events } = advanceTo(makeState({ weekendDateUsed: true }, FRIDAY), NEXT_MONDAY, rng);
    expect(state.hyejin.happiness).toBe(100 + COMMUTE);
    expect(state.weekendDateUsed).toBe(false);
    expect(state.bulldak).toBe("active");
    expect(events.filter((e) => e.type === "dayEnded")).toEqual([
      { type: "dayEnded", date: FRIDAY, commute: COMMUTE, overwork: 0, bulldakIgnored: 0 },
      { type: "dayEnded", date: SATURDAY, commute: 0, overwork: 0, bulldakIgnored: 0 },
      { type: "dayEnded", date: SUNDAY, commute: 0, overwork: 0, bulldakIgnored: 0 },
    ]);
  });
});

describe("잠자기", () => {
  it("다음 날 아침으로 넘어가고 현실 하루의 밤을 하나 쓴다", () => {
    const s = makeState({ jungwoo: { actionsLeft: 0 } });
    const { state, events } = act(s, { type: "sleep" }, sleepCtx());
    expect(state.lastSettledDate).toBe("2026-10-13");
    expect(state.jungwoo.actionsLeft).toBe(5);
    expect(state.hyejin.happiness).toBe(100 + COMMUTE);
    expect(state.nights).toEqual({ realDay: TODAY, used: 1 });
    expect(events.map((e) => e.type)).toEqual(["dayEnded", "dayStarted"]);
  });

  it("행동이 남아 있어도 잘 수 있다 (남은 행동은 사라진다)", () => {
    const { state } = act(makeState(), { type: "sleep" }, sleepCtx());
    expect(state.jungwoo.actionsLeft).toBe(TIME.ACTIONS_PER_DAY);
    expect(state.lastSettledDate).toBe("2026-10-13");
  });

  it(`현실 하루에 ${TIME.NIGHTS_PER_REAL_DAY}번까지만 잘 수 있다`, () => {
    let s = makeState();
    for (let i = 0; i < TIME.NIGHTS_PER_REAL_DAY; i++) s = act(s, { type: "sleep" }, sleepCtx()).state;
    expect(nightsUsed(s, TODAY)).toBe(TIME.NIGHTS_PER_REAL_DAY);
    expect(applyAction(s, { type: "sleep" }, sleepCtx())).toEqual({ ok: false, error: "NO_NIGHTS_LEFT" });
    // 잠은 못 자도 남은 행동은 쓸 수 있다
    expect(applyAction(s, { type: "work" }, sleepCtx()).ok).toBe(true);
  });

  it("현실 하루가 바뀌면 밤이 다시 찬다", () => {
    let s = makeState();
    for (let i = 0; i < TIME.NIGHTS_PER_REAL_DAY; i++) s = act(s, { type: "sleep" }, sleepCtx()).state;
    const next = act(s, { type: "sleep" }, sleepCtx("2026-10-14")).state;
    expect(next.nights).toEqual({ realDay: "2026-10-14", used: 1 });
    expect(nightsUsed(next, TODAY)).toBe(0);
  });

  it("현실 하루를 모르면(시뮬레이션) 제한 없이 잔다", () => {
    let s = makeState();
    for (let i = 0; i < 10; i++) s = act(s, { type: "sleep" }, { rng: NEVER, places: PLACES }).state;
    expect(s.lastSettledDate).toBe("2026-10-22");
    expect(s.nights).toEqual({ realDay: null, used: 0 });
  });

  it("마감으로 20 이하가 되면 카운트다운만 시작되고, 막기·절반 섭취는 일어나지 않는다", () => {
    const s = makeState({ hyejin: { happiness: 30, hanjeongseon: 10 } });
    const { state, events } = act(s, { type: "sleep" }, sleepCtx());
    expect(state.hyejin.happiness).toBe(30 + COMMUTE);
    expect(state.hyejin.hanjeongseon).toBe(10);
    expect(state.hyejin.countdownTurnsLeft).toBe(3);
    expect(events.map((e) => e.type)).not.toContain("halfEaten");
    expect(events.map((e) => e.type)).not.toContain("jungwooBlocked");
  });
});

describe("밤사이 요약", () => {
  it("마감 감소와 아침 상황을 담는다", () => {
    const before = makeState({ bulldak: "active", jungwoo: { sulking: true, workCountToday: 3 }, hyejin: { happiness: 80 } });
    const { state, events } = act(before, { type: "sleep" }, sleepCtx(TODAY, sequence(0, 0.999, 0.999)));
    const change = COMMUTE + OVERWORK + BULLDAK_MISS;
    expect(80 + change).toBe(30); // 경고 구간에 막 들어감 (카운트다운 전)
    expect(summarizeNight(before, state, events)).toEqual({
      fromDate: "2026-10-12",
      toDate: "2026-10-13",
      hyejinHappiness: { before: 80, after: 80 + change, change },
      breakdown: { commute: COMMUTE, overwork: OVERWORK, bulldakIgnored: BULLDAK_MISS },
      bulldakToday: true,
      warningStarted: true,
      countdownTurnsLeft: null,
      jungwooSulkHealed: true,
      jungwooTired: 0,
    });
  });

  it("날짜가 넘어가지 않았으면 null", () => {
    const s = makeState();
    const { state, events } = act(s, { type: "work" });
    expect(summarizeNight(s, state, events)).toBeNull();
  });
});

describe("랜덤 이벤트 (번개 약속)", () => {
  const withEvent = (social: "poker" | "friends" | "snack", money = 100_000) => makeState({ social, jungwoo: { money } });

  it(`아침마다 ${SOCIAL.CHANCE_PERCENT}% 확률로 이벤트 하나가 생긴다`, () => {
    // 월→화: 불닭 판정(실패), 이벤트 판정(성공), 종류 고르기(평일 9종 중 세 번째 = 야식), 감기 판정(실패)
    const { state, events } = closeDay(makeState(), sequence(0.999, 0.29, 0.25, 0.999));
    expect(state.social).toBe("snack");
    expect(events).toContainEqual({ type: "socialEvent", event: "snack" });
    expect(closeDay(makeState(), sequence(0.999, 0.3, 0.999)).state.social).toBeNull();
  });

  it("만난 이벤트는 이벤트 도감에 한 번만 남는다", () => {
    const { state } = closeDay(makeState(), sequence(0.999, 0.29, 0.25, 0.999));
    expect(state.seenEvents).toEqual(["snack"]);
    const again = closeDay({ ...state, social: null }, sequence(0.999, 0.29, 0.25, 0.999)).state;
    expect(again.seenEvents).toEqual(["snack"]);
  });

  it("고르지 않은 이벤트는 하루가 끝나면 사라진다 (벌점 없음)", () => {
    const { state } = closeDay(withEvent("friends"), NEVER);
    expect(state.social).toBeNull();
    expect(state.hyejin.happiness).toBe(100 + COMMUTE);
  });

  it("행동을 쓰지 않는다", () => {
    const { state } = act(withEvent("friends"), { type: "social", choice: "solo" });
    expect(state.jungwoo.actionsLeft).toBe(TIME.ACTIONS_PER_DAY);
    expect(state.social).toBeNull();
  });

  it("정우도 합류하면 돈이 들고, 돈이 모자라면 못 고른다", () => {
    const s = makeState({ social: "friends", jungwoo: { money: 100_000, happiness: 50 }, hyejin: { happiness: 50 } });
    const { state, events } = act(s, { type: "social", choice: "join" });
    const join = SOCIAL.EVENTS.friends.join;
    expect(state.jungwoo.money).toBe(100_000 - join.money);
    expect(state.hyejin.happiness).toBe(50 + join.hyejin);
    expect(state.jungwoo.happiness).toBe(50 + join.jungwoo);
    expect(events).toContainEqual({ type: "socialDone", event: "friends", choice: "join" });
    expect(applyAction(withEvent("friends", 0), { type: "social", choice: "join" }, sleepCtx())).toEqual({ ok: false, error: "NOT_ENOUGH_MONEY" });
  });

  it("밤샘 포커는 다음 날 정우 행동을 줄인다", () => {
    const played = act(withEvent("poker"), { type: "social", choice: "go" }).state;
    const next = closeDay(played, NEVER);
    expect(next.state.jungwoo.actionsLeft).toBe(TIME.ACTIONS_PER_DAY - SOCIAL.EVENTS.poker.go.tired);
    expect(next.state.jungwooTiredActions).toBe(0);
    expect(summarizeNight(played, next.state, next.events)!.jungwooTired).toBe(SOCIAL.EVENTS.poker.go.tired);
    // 그다음 날은 다시 5번
    expect(closeDay(next.state, NEVER).state.jungwoo.actionsLeft).toBe(TIME.ACTIONS_PER_DAY);
  });

  it("패스하면 아무 일 없이 사라지고, 없는 선택지나 이벤트 없는 날은 거절", () => {
    const { state, events } = act(withEvent("snack"), { type: "social", choice: "skip" });
    expect(state.social).toBeNull();
    expect(state.jungwoo.money).toBe(100_000);
    expect(events).toEqual([{ type: "socialSkipped", event: "snack" }]);
    expect(applyAction(withEvent("snack"), { type: "social", choice: "go" }, sleepCtx())).toEqual({ ok: false, error: "INVALID_CHOICE" });
    expect(applyAction(makeState(), { type: "social", choice: "skip" }, sleepCtx())).toEqual({ ok: false, error: "NO_SOCIAL_EVENT" });
  });
});
