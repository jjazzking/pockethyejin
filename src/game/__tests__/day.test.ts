import { describe, expect, it } from "vitest";
import { addDays, isWeekend, toGameDate } from "../date";
import { createInitialState, settle } from "../day";
import { ALWAYS, FRIDAY, MONDAY, NEVER, SATURDAY, SUNDAY, act, fixed, makeState, sequence } from "./helpers";

describe("게임 날짜", () => {
  it("KST 06:00에 날짜가 바뀐다", () => {
    // 2026-10-13 05:59 KST = 2026-10-12 20:59 UTC
    expect(toGameDate(new Date("2026-10-12T20:59:00Z"))).toBe("2026-10-12");
    // 2026-10-13 06:00 KST = 2026-10-12 21:00 UTC
    expect(toGameDate(new Date("2026-10-12T21:00:00Z"))).toBe("2026-10-13");
  });

  it("주말 판정과 날짜 계산", () => {
    expect(isWeekend(FRIDAY)).toBe(false);
    expect(isWeekend(SATURDAY)).toBe(true);
    expect(isWeekend(SUNDAY)).toBe(true);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("새 게임", () => {
  it("시작 수치", () => {
    const { state } = createInitialState(MONDAY, NEVER);
    expect(state.jungwoo).toEqual({
      happiness: 100,
      money: 0,
      totalWorkCount: 0,
      rank: 1,
      actionsLeft: 5,
      workCountToday: 0,
      sulking: false,
    });
    expect(state.hyejin).toEqual({
      happiness: 100,
      level: 1,
      hanjeongseon: 0,
      countdownTurnsLeft: null,
      jungwooBlockUsed: false,
    });
    expect(state.lastSettledDate).toBe(MONDAY);
  });
});

describe("하루 마감 (접속한 날)", () => {
  it("평일 출근 -20", () => {
    const { state, events } = settle(makeState(), "2026-10-13", NEVER);
    expect(state.hyejin.happiness).toBe(80);
    expect(events).toContainEqual({
      type: "dayEnded",
      date: MONDAY,
      absent: false,
      commute: -20,
      overwork: 0,
      bulldakIgnored: 0,
    });
  });

  it("주말에는 출근 감소 없음", () => {
    expect(settle(makeState({}, SATURDAY), SUNDAY, NEVER).state.hyejin.happiness).toBe(100);
  });

  it("정우가 일을 3회 이상 하면 -10 (주말에도)", () => {
    let s = makeState();
    s = act(s, { type: "work" }).state;
    s = act(s, { type: "work" }).state;
    expect(settle(s, "2026-10-13", NEVER).state.hyejin.happiness).toBe(80);
    s = act(s, { type: "work" }).state;
    expect(settle(s, "2026-10-13", NEVER).state.hyejin.happiness).toBe(70);

    const weekend = makeState({ jungwoo: { workCountToday: 3 } }, SATURDAY);
    expect(settle(weekend, SUNDAY, NEVER).state.hyejin.happiness).toBe(90);
  });

  it("불닭을 무시하면 -15, 대응했으면 감소 없음", () => {
    expect(settle(makeState({ bulldak: "active" }), "2026-10-13", NEVER).state.hyejin.happiness).toBe(65);
    expect(settle(makeState({ bulldak: "resolved" }), "2026-10-13", NEVER).state.hyejin.happiness).toBe(80);
  });

  it("행복도는 0 아래로 내려가지 않는다", () => {
    const s = makeState({ hyejin: { happiness: 10 }, bulldak: "active" });
    expect(settle(s, "2026-10-13", NEVER).state.hyejin.happiness).toBe(0);
  });
});

describe("새 날 아침", () => {
  it("행동 5회 충전 (이월 없음), 오늘 일 횟수 초기화", () => {
    const s = makeState({ jungwoo: { actionsLeft: 2, workCountToday: 3 } });
    expect(settle(s, "2026-10-13", NEVER).state.jungwoo).toMatchObject({ actionsLeft: 5, workCountToday: 0 });
  });

  it("평일 아침 15% 확률로 불닭", () => {
    expect(settle(makeState(), "2026-10-13", fixed(0.149)).state.bulldak).toBe("active");
    expect(settle(makeState(), "2026-10-13", fixed(0.15)).state.bulldak).toBe("none");
  });

  it("주말에는 불닭이 없다", () => {
    expect(settle(makeState({}, FRIDAY), SATURDAY, ALWAYS).state.bulldak).toBe("none");
  });

  it("같은 날이거나 과거 날짜로는 정산하지 않는다", () => {
    const s = makeState();
    expect(settle(s, MONDAY, ALWAYS)).toEqual({ state: s, events: [] });
    expect(settle(s, "2026-10-11", ALWAYS)).toEqual({ state: s, events: [] });
  });
});

describe("부재 처리", () => {
  it("접속하지 않은 날은 감소가 절반(버림)", () => {
    // 월(접속) → 화·수(부재) → 목 접속. 화요일에만 불닭.
    const rng = sequence(0, 0.999, 0.999);
    const { state, events } = settle(makeState(), "2026-10-15", rng);
    const ends = events.filter((e) => e.type === "dayEnded");
    expect(ends).toEqual([
      { type: "dayEnded", date: "2026-10-12", absent: false, commute: -20, overwork: 0, bulldakIgnored: 0 },
      { type: "dayEnded", date: "2026-10-13", absent: true, commute: -10, overwork: 0, bulldakIgnored: -7 },
      { type: "dayEnded", date: "2026-10-14", absent: true, commute: -10, overwork: 0, bulldakIgnored: 0 },
    ]);
    expect(state.hyejin.happiness).toBe(100 - 20 - 17 - 10);
    expect(events).toContainEqual({ type: "bulldakCraving", date: "2026-10-13" });
    expect(state.lastSettledDate).toBe("2026-10-15");
  });

  it("마지막 접속일에 남긴 불닭·과로는 그대로 적용된다", () => {
    const s = makeState({ bulldak: "active", jungwoo: { workCountToday: 3 } });
    const { state } = settle(s, "2026-10-14", NEVER);
    expect(state.hyejin.happiness).toBe(100 - 20 - 10 - 15 - 10);
  });

  it("주말을 건너뛰어도 월요일에 데이트 사용 여부가 초기화된다", () => {
    const s = makeState({ weekendDateUsed: true }, SATURDAY);
    expect(settle(s, "2026-10-21", NEVER).state.weekendDateUsed).toBe(false);
    expect(settle(s, SUNDAY, NEVER).state.weekendDateUsed).toBe(true);
  });

  it("삐진 채로 여러 날이 지나도 다음 날 풀린다", () => {
    const s = makeState({ jungwoo: { sulking: true, happiness: 0, actionsLeft: 0 } });
    expect(settle(s, "2026-10-16", NEVER).state.jungwoo).toMatchObject({
      happiness: 100,
      sulking: false,
      actionsLeft: 5,
    });
  });
});
