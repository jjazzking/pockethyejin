import { describe, expect, it } from "vitest";
import { closeDay, settle } from "../day";
import { toGameDate } from "../date";
import { summarizeAway } from "../summary";
import {
  ABSENT_BULLDAK_MISS,
  ABSENT_COMMUTE,
  BULLDAK_MISS,
  COMMUTE,
  FRIDAY,
  MONDAY,
  NEVER,
  NEXT_MONDAY,
  OVERWORK,
  SATURDAY,
  SUNDAY,
  makeState,
  sequence,
} from "./helpers";

describe("하루 경계 (Asia/Seoul 06:00)", () => {
  it("서울 시간 05:59까지는 전날, 06:00부터 새 날", () => {
    expect(toGameDate(new Date("2026-10-17T05:59:59+09:00"))).toBe("2026-10-16");
    expect(toGameDate(new Date("2026-10-17T06:00:00+09:00"))).toBe("2026-10-17");
  });

  it("평일/주말도 서울 기준: 금요일 밤 UTC로는 토요일이 아니어도 서울은 토요일", () => {
    // 2026-10-16 22:00 UTC = 2026-10-17(토) 07:00 KST
    expect(toGameDate(new Date("2026-10-16T22:00:00Z"))).toBe(SATURDAY);
    // 2026-10-18(일) 23:00 KST = 2026-10-18 14:00 UTC → 아직 일요일
    expect(toGameDate(new Date("2026-10-18T14:00:00Z"))).toBe(SUNDAY);
  });
});

describe("closeDay: 하루 마감 + 다음 날 아침", () => {
  it("마감 감소를 적용하고 행동 충전·삐짐 해제·불닭 판정", () => {
    const s = makeState({
      jungwoo: { actionsLeft: 0, workCountToday: 3, sulking: true, happiness: 10 },
      bulldak: "active",
    });
    const { state, events } = closeDay(s, false, sequence(0));
    expect(state.hyejin.happiness).toBe(100 + COMMUTE + OVERWORK + BULLDAK_MISS);
    expect(state.jungwoo).toMatchObject({ actionsLeft: 5, workCountToday: 0, sulking: false, happiness: 100 });
    expect(state.bulldak).toBe("active");
    expect(state.lastSettledDate).toBe("2026-10-13");
    expect(events).toContainEqual({ type: "bulldakCraving", date: "2026-10-13" });
  });

  it("일요일을 마감하면 데이트 사용 여부가 초기화된다", () => {
    const sat = closeDay(makeState({ weekendDateUsed: true }, SATURDAY), false, NEVER).state;
    expect(sat.weekendDateUsed).toBe(true);
    expect(closeDay(sat, false, NEVER).state.weekendDateUsed).toBe(false);
  });
});

describe("금요일 → 월요일 (주말을 건너뛴 정산)", () => {
  it("금요일은 그대로, 토·일은 출근이 없어 감소 없음, 불닭 판정은 월요일만", () => {
    const s = makeState({ weekendDateUsed: true }, FRIDAY);
    // 난수는 월요일 아침 불닭 판정에 딱 한 번만 쓰여야 한다
    const rng = sequence(0);
    const before = s;
    const { state, events } = settle(s, NEXT_MONDAY, rng);

    expect(state.lastSettledDate).toBe(NEXT_MONDAY);
    expect(state.hyejin.happiness).toBe(100 + COMMUTE);
    expect(state.weekendDateUsed).toBe(false);
    expect(state.bulldak).toBe("active");
    expect(events.filter((e) => e.type === "dayEnded")).toEqual([
      { type: "dayEnded", date: FRIDAY, absent: false, commute: COMMUTE, overwork: 0, bulldakIgnored: 0 },
      { type: "dayEnded", date: SATURDAY, absent: true, commute: 0, overwork: 0, bulldakIgnored: 0 },
      { type: "dayEnded", date: SUNDAY, absent: true, commute: 0, overwork: 0, bulldakIgnored: 0 },
    ]);

    const summary = summarizeAway(before, state, events)!;
    expect(summary).toMatchObject({
      fromDate: FRIDAY,
      toDate: NEXT_MONDAY,
      daysPassed: 3,
      absentDays: 2,
      hyejinHappiness: { before: 100, after: 100 + COMMUTE, change: COMMUTE },
      missedBulldakDates: [],
      bulldakToday: true,
    });
  });
});

describe("3일 부재 후 접속", () => {
  it("월(접속) → 화·수·목 부재 → 금 접속: 부재한 날은 절반만", () => {
    // 화: 불닭 (놓침), 수·목: 없음, 금: 없음
    const s = makeState({ hyejin: { happiness: 90 } }, MONDAY);
    const { state, events } = settle(s, FRIDAY, sequence(0, 0.999, 0.999, 0.999));
    // 월: 출근 그대로, 화: 출근·불닭 절반, 수·목: 출근 절반
    const change = COMMUTE + ABSENT_COMMUTE * 3 + ABSENT_BULLDAK_MISS;
    expect(state.hyejin.happiness).toBe(90 + change);
    expect(90 + change).toBeGreaterThan(20); // 경고 구간이지만 카운트다운 전

    const summary = summarizeAway(s, state, events)!;
    expect(summary).toEqual({
      fromDate: MONDAY,
      toDate: FRIDAY,
      daysPassed: 4,
      absentDays: 3,
      hyejinHappiness: { before: 90, after: 90 + change, change },
      breakdown: { commute: COMMUTE + ABSENT_COMMUTE * 3, overwork: 0, bulldakIgnored: ABSENT_BULLDAK_MISS },
      missedBulldakDates: ["2026-10-13"],
      bulldakToday: false,
      warningStarted: true,
      countdownTurnsLeft: null,
      jungwooSulkHealed: false,
    });
  });

  it("부재 중에 20 이하가 되면 카운트다운만 시작되고, 막기·절반 섭취는 일어나지 않는다", () => {
    const s = makeState({ hyejin: { happiness: 30, hanjeongseon: 10 } }, MONDAY);
    const { state, events } = settle(s, FRIDAY, NEVER);
    expect(state.hyejin.happiness).toBe(0);
    expect(state.hyejin.hanjeongseon).toBe(10);
    expect(state.hyejin.jungwooBlockUsed).toBe(false);
    expect(state.hyejin.countdownTurnsLeft).toBe(3);
    expect(events.map((e) => e.type)).not.toContain("jungwooBlocked");
    expect(events.map((e) => e.type)).not.toContain("halfEaten");
    expect(summarizeAway(s, state, events)!.countdownTurnsLeft).toBe(3);
  });

  it("날짜가 지나지 않았으면 요약은 null", () => {
    const s = makeState();
    const { state, events } = settle(s, MONDAY, NEVER);
    expect(summarizeAway(s, state, events)).toBeNull();
  });
});
