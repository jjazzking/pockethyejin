import { describe, expect, it } from "vitest";
import { TIME } from "../balance";
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
    const { state, events } = closeDay(s, sequence(0));
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
    const rng = sequence(0); // 월요일 아침 불닭 판정에 딱 한 번만 쓰여야 한다
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
    const { state, events } = act(before, { type: "sleep" }, sleepCtx(TODAY, sequence(0)));
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
    });
  });

  it("날짜가 넘어가지 않았으면 null", () => {
    const s = makeState();
    const { state, events } = act(s, { type: "work" });
    expect(summarizeNight(s, state, events)).toBeNull();
  });
});
