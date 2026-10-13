import { describe, expect, it } from "vitest";
import { advanceTo as settle } from "../day";
import { applyAction } from "../engine";
import { budgetPercents, maxUsefulOffering } from "../rules";
import type { Action } from "../types";
import {
  TOGETHER_HYEJIN,
  ALWAYS,
  NEVER,
  SATURDAY,
  SUNDAY,
  act,
  ctx,
  expectError,
  fixed,
  makeState,
} from "./helpers";

describe("공통", () => {
  it("입력 상태를 바꾸지 않는다", () => {
    const s = makeState();
    const snapshot = structuredClone(s);
    act(s, { type: "work" });
    expect(s).toEqual(snapshot);
  });

  it("정우 행동이 0회면 정우 행동은 전부 불가", () => {
    const s = makeState({
      jungwoo: { actionsLeft: 0, money: 1_000_000 },
      bulldak: "active",
    });
    const actions: Action[] = [
      { type: "work" },
      { type: "waiting", quantity: 1 },
      { type: "playAlone" },
      { type: "playTogether" },
      { type: "convenienceStore" },
    ];
    for (const a of actions) expectError(s, a, "NO_ACTIONS_LEFT");
    const weekend = makeState({ jungwoo: { actionsLeft: 0, money: 1_000_000 } }, SATURDAY);
    expectError(weekend, { type: "date", placeId: "p1", budget: 50_000, offering: 0 }, "NO_ACTIONS_LEFT");
  });

  it("정우 행동이 0회여도 한정선 먹이기·레벨업은 가능", () => {
    const s = makeState({ jungwoo: { actionsLeft: 0 }, hyejin: { hanjeongseon: 20, happiness: 50 } });
    expect(applyAction(s, { type: "feed", count: 1 }, ctx()).ok).toBe(true);
    expect(applyAction(s, { type: "levelUp" }, ctx()).ok).toBe(true);
  });
});

describe("일", () => {
  it("정우 -10, 직급 수입, 업무능력 +1, 행동 -1", () => {
    const { state, events } = act(makeState(), { type: "work" });
    expect(state.jungwoo).toMatchObject({
      happiness: 90,
      money: 30_000,
      totalWorkCount: 1,
      workCountToday: 1,
      actionsLeft: 4,
    });
    expect(events).toContainEqual({ type: "worked", income: 30_000 });
  });

  it("누적 20회째에 승진하고 다음 일부터 수입이 오른다", () => {
    const s = makeState({ jungwoo: { totalWorkCount: 19 } });
    const r1 = act(s, { type: "work" });
    expect(r1.state.jungwoo.money).toBe(30_000);
    expect(r1.state.jungwoo.rank).toBe(2);
    expect(r1.events).toContainEqual({ type: "promoted", rank: 2 });
    const r2 = act(r1.state, { type: "work" });
    expect(r2.state.jungwoo.money).toBe(30_000 + 45_000);
  });

  it("정우 행복도는 0 아래로 내려가지 않고, 0이어도 일은 가능", () => {
    const { state } = act(makeState({ jungwoo: { happiness: 5 } }), { type: "work" });
    expect(state.jungwoo.happiness).toBe(0);
    expect(applyAction(state, { type: "work" }, ctx()).ok).toBe(true);
  });
});

describe("웨이팅", () => {
  it("성공: 돈 → 한정선 (1개 1만 원), 정우 -20", () => {
    const s = makeState({ jungwoo: { money: 35_000 } });
    const { state, events } = act(s, { type: "waiting", quantity: 3 });
    expect(state.jungwoo.money).toBe(5_000);
    expect(state.hyejin.hanjeongseon).toBe(3);
    expect(state.jungwoo.happiness).toBe(80);
    expect(state.jungwoo.actionsLeft).toBe(4);
    expect(events).toContainEqual({ type: "waitingDone", quantity: 3, cost: 30_000 });
  });

  it("돈이 부족하면 불가", () => {
    expectError(makeState({ jungwoo: { money: 29_999 } }), { type: "waiting", quantity: 3 }, "NOT_ENOUGH_MONEY");
    expectError(makeState({ jungwoo: { money: 0 } }), { type: "waiting", quantity: 1 }, "NOT_ENOUGH_MONEY");
  });

  it("수량은 1 이상의 정수", () => {
    const s = makeState({ jungwoo: { money: 100_000 } });
    expectError(s, { type: "waiting", quantity: 0 }, "INVALID_QUANTITY");
    expectError(s, { type: "waiting", quantity: 1.5 }, "INVALID_QUANTITY");
  });

  it("정우 행복도 50 이상이면 절대 거절하지 않는다", () => {
    const s = makeState({ jungwoo: { money: 10_000, happiness: 50 } });
    const { events } = act(s, { type: "waiting", quantity: 1 }, ctx(ALWAYS));
    expect(events).toContainEqual(expect.objectContaining({ type: "waitingDone" }));
  });

  it("거절 확률 경계: 행복도 30이면 40%", () => {
    const s = makeState({ jungwoo: { money: 10_000, happiness: 30 } });
    expect(act(s, { type: "waiting", quantity: 1 }, ctx(fixed(0.399))).events).toContainEqual({
      type: "waitingRejected",
    });
    expect(act(s, { type: "waiting", quantity: 1 }, ctx(fixed(0.4))).events).toContainEqual(
      expect.objectContaining({ type: "waitingDone" }),
    );
  });

  it("거절되면 남은 행동이 전부 사라지고, 돈·한정선·행복도는 그대로", () => {
    const s = makeState({ jungwoo: { money: 50_000, happiness: 0, actionsLeft: 4 } });
    const { state, events } = act(s, { type: "waiting", quantity: 2 }, ctx(NEVER));
    expect(events).toContainEqual({ type: "waitingRejected" });
    expect(state.jungwoo.actionsLeft).toBe(0);
    expect(state.jungwoo.sulking).toBe(true);
    expect(state.jungwoo.money).toBe(50_000);
    expect(state.jungwoo.happiness).toBe(0);
    expect(state.hyejin.hanjeongseon).toBe(0);
    expectError(state, { type: "playAlone" }, "NO_ACTIONS_LEFT");
  });

  it("거절된 다음 날 아침 정우 행복도는 100, 삐짐 해제, 행동 5회", () => {
    const s = makeState({ jungwoo: { money: 50_000, happiness: 10 } });
    const rejected = act(s, { type: "waiting", quantity: 1 }, ctx(fixed(0))).state;
    const { state, events } = settle(rejected, "2026-10-13", NEVER);
    expect(state.jungwoo).toMatchObject({ happiness: 100, sulking: false, actionsLeft: 5 });
    expect(events).toContainEqual({ type: "dayStarted", date: "2026-10-13", sulkHealed: true });
  });

  it("삐지지 않은 날은 다음 날에도 정우 행복도가 그대로", () => {
    const s = makeState({ jungwoo: { happiness: 40 } });
    expect(settle(s, "2026-10-13", NEVER).state.jungwoo.happiness).toBe(40);
  });
});

describe("놀기", () => {
  it("혼자 놀기: 정우 +25 (최대 100)", () => {
    expect(act(makeState({ jungwoo: { happiness: 50 } }), { type: "playAlone" }).state.jungwoo.happiness).toBe(75);
    expect(act(makeState({ jungwoo: { happiness: 90 } }), { type: "playAlone" }).state.jungwoo.happiness).toBe(100);
  });

  it("같이 놀기: 정우 +10, 혜진 +같이 놀기 수치", () => {
    const s = makeState({ jungwoo: { happiness: 50 }, hyejin: { happiness: 50 } });
    const { state, events } = act(s, { type: "playTogether" });
    expect(state.jungwoo.happiness).toBe(60);
    expect(state.hyejin.happiness).toBe(50 + TOGETHER_HYEJIN);
    expect(state.jungwoo.actionsLeft).toBe(4);
    expect(events).toContainEqual({ type: "playedTogether" });
  });
});

describe("편의점", () => {
  it("불닭 이벤트 중에만 가능", () => {
    expectError(makeState({ jungwoo: { money: 10_000 } }), { type: "convenienceStore" }, "NO_BULLDAK_EVENT");
    expectError(
      makeState({ jungwoo: { money: 10_000 }, bulldak: "resolved" }),
      { type: "convenienceStore" },
      "NO_BULLDAK_EVENT",
    );
  });

  it("돈이 부족하면 불가", () => {
    expectError(makeState({ jungwoo: { money: 4_999 }, bulldak: "active" }), { type: "convenienceStore" }, "NOT_ENOUGH_MONEY");
  });

  it("돈 -5천, 혜진 +25, 정우 변화 없음, 대응 완료", () => {
    const s = makeState({ jungwoo: { money: 5_000, happiness: 60 }, hyejin: { happiness: 40 }, bulldak: "active" });
    const { state } = act(s, { type: "convenienceStore" });
    expect(state.jungwoo.money).toBe(0);
    expect(state.jungwoo.happiness).toBe(60);
    expect(state.hyejin.happiness).toBe(65);
    expect(state.bulldak).toBe("resolved");
    expect(state.jungwoo.actionsLeft).toBe(4);
  });
});

describe("한정선 먹이기", () => {
  it("개수 × 10 회복, 최대 100, 행동 소모 없음", () => {
    const s = makeState({ hyejin: { hanjeongseon: 5, happiness: 70 } });
    const { state } = act(s, { type: "feed", count: 5 });
    expect(state.hyejin.happiness).toBe(100);
    expect(state.hyejin.hanjeongseon).toBe(0);
    expect(state.jungwoo.actionsLeft).toBe(5);
  });

  it("보유량보다 많이 먹일 수 없다", () => {
    expectError(makeState({ hyejin: { hanjeongseon: 2 } }), { type: "feed", count: 3 }, "NOT_ENOUGH_HANJEONGSEON");
    expectError(makeState({ hyejin: { hanjeongseon: 2 } }), { type: "feed", count: 0 }, "INVALID_QUANTITY");
  });
});

describe("레벨업", () => {
  it("한정선을 소비해 레벨 +1, 행동 소모 없음", () => {
    const { state, events } = act(makeState({ hyejin: { hanjeongseon: 25 } }), { type: "levelUp" });
    expect(state.hyejin.level).toBe(2);
    expect(state.hyejin.hanjeongseon).toBe(15);
    expect(state.jungwoo.actionsLeft).toBe(5);
    expect(events).toContainEqual({ type: "leveledUp", level: 2, cost: 10 });
  });

  it("한정선이 부족하면 불가", () => {
    expectError(makeState({ hyejin: { level: 2, hanjeongseon: 13 } }), { type: "levelUp" }, "NOT_ENOUGH_HANJEONGSEON");
  });

  it("만렙(= 등록된 장소 수)이면 불가", () => {
    const s = makeState({ hyejin: { level: 3, hanjeongseon: 1000 } });
    expectError(s, { type: "levelUp" }, "MAX_LEVEL");
    expectError(makeState({ hyejin: { hanjeongseon: 1000 } }), { type: "levelUp" }, "MAX_LEVEL", ctx(NEVER, [{ id: "p1" }]));
  });

  it("장소가 추가되면 다시 레벨업할 수 있다", () => {
    const s = makeState({ hyejin: { level: 3, hanjeongseon: 1000 } });
    const more = ctx(NEVER, [{ id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" }]);
    expect(act(s, { type: "levelUp" }, more).state.hyejin.level).toBe(4);
  });
});

describe("데이트", () => {
  const date = (placeId = "p1", budget = 50_000, offering = 0): Action => ({ type: "date", placeId, budget, offering });
  const weekend = (overrides: Parameters<typeof makeState>[0] = {}, day = SATURDAY) =>
    makeState({ ...overrides, jungwoo: { money: 1_000_000, ...overrides.jungwoo } }, day);

  it("주말에만 가능", () => {
    expectError(makeState({ jungwoo: { money: 1_000_000 } }), date(), "NOT_WEEKEND");
    expect(applyAction(weekend({}, SUNDAY), date(), ctx()).ok).toBe(true);
  });

  it("행동 3회 소모, 3회 미만이면 불가", () => {
    expect(act(weekend(), date()).state.jungwoo.actionsLeft).toBe(2);
    expectError(weekend({ jungwoo: { actionsLeft: 2 } }), date(), "NOT_ENOUGH_ACTIONS");
  });

  it("돈이 예산보다 적으면 불가", () => {
    expectError(weekend({ jungwoo: { money: 49_999 } }), date(), "NOT_ENOUGH_MONEY");
    expectError(weekend({ jungwoo: { money: 299_999 } }), date("p1", 300_000), "NOT_ENOUGH_MONEY");
  });

  it("정해진 예산만 고를 수 있다", () => {
    expectError(weekend(), date("p1", 100_000), "INVALID_BUDGET");
  });

  it("해금된 장소만 갈 수 있다", () => {
    expectError(weekend(), date("p2"), "PLACE_LOCKED");
    expectError(weekend(), date("nope"), "PLACE_LOCKED");
    expect(applyAction(weekend({ hyejin: { level: 2 } }), date("p2"), ctx()).ok).toBe(true);
  });

  it("주말에 한 번만: 토요일에 했으면 일요일에도 불가, 월요일에 초기화", () => {
    const sat = act(weekend(), date()).state;
    expectError({ ...sat, jungwoo: { ...sat.jungwoo, actionsLeft: 5 } }, date(), "DATE_ALREADY_USED");
    const sun = settle(sat, SUNDAY, NEVER).state;
    expectError(sun, date(), "DATE_ALREADY_USED");
    expect(settle(sun, "2026-10-19", NEVER).state.weekendDateUsed).toBe(false);
  });

  it("효과: 돈 -예산, 정우 +30, 혜진 +30, 별 기록", () => {
    const s = weekend({ jungwoo: { happiness: 50 }, hyejin: { happiness: 40 } });
    const { state, events } = act(s, date("p1", 50_000), ctx(fixed(0.7)));
    expect(state.jungwoo.money).toBe(950_000);
    expect(state.jungwoo.happiness).toBe(80);
    expect(state.hyejin.happiness).toBe(70);
    expect(state.bestStars).toEqual({ p1: 2 });
    expect(state.weekendDateUsed).toBe(true);
    expect(events).toContainEqual({ type: "dated", placeId: "p1", stars: 2, newBest: true, firstVisit: true });
  });

  it("3성이면 혜진 +50", () => {
    const s = weekend({ hyejin: { happiness: 40 } });
    const { state } = act(s, date("p1", 300_000), ctx(fixed(0.5)));
    expect(state.bestStars.p1).toBe(3);
    expect(state.hyejin.happiness).toBe(90);
  });

  it("최고 별 개수만 기록한다", () => {
    const s = weekend({ bestStars: { p1: 2 } });
    const { state, events } = act(s, date("p1", 50_000), ctx(fixed(0)));
    expect(state.bestStars.p1).toBe(2);
    expect(events).toContainEqual({ type: "dated", placeId: "p1", stars: 1, newBest: false, firstVisit: false });
  });

  it("한정선을 바치면 3성 확률이 오르고 한정선이 소비된다", () => {
    // 5만 원 + 45개: 1성 0, 2성 5, 3성 95 → 난수 0.05면 3성
    const s = weekend({ hyejin: { hanjeongseon: 50 } });
    const { state } = act(s, date("p1", 50_000, 45), ctx(fixed(0.05)));
    expect(state.bestStars.p1).toBe(3);
    expect(state.hyejin.hanjeongseon).toBe(5);
    // 바치지 않았으면 같은 난수에서 1성
    expect(act(s, date("p1", 50_000, 0), ctx(fixed(0.05))).state.bestStars.p1).toBe(1);
  });

  it("한정선은 5개 단위, 95%를 넘기는 만큼은 받지 않는다", () => {
    const s = weekend({ hyejin: { hanjeongseon: 100 } });
    const max = maxUsefulOffering(budgetPercents(300_000)!);
    expectError(s, date("p1", 300_000, 3), "INVALID_OFFERING");
    expectError(s, date("p1", 300_000, max + 5), "INVALID_OFFERING");
    expect(applyAction(s, date("p1", 300_000, max), ctx()).ok).toBe(true);
  });

  it("보유량보다 많이 바칠 수 없다", () => {
    expectError(weekend({ hyejin: { hanjeongseon: 4 } }), date("p1", 50_000, 5), "NOT_ENOUGH_HANJEONGSEON");
  });

  it("이미 3성인 장소에는 한정선을 바칠 수 없지만 데이트는 가능", () => {
    const s = weekend({ hyejin: { hanjeongseon: 10 }, bestStars: { p1: 3 } });
    expectError(s, date("p1", 50_000, 5), "OFFERING_NOT_ALLOWED");
    expect(applyAction(s, date("p1", 50_000, 0), ctx()).ok).toBe(true);
  });

  it("처음 가는 장소에도 한정선을 바칠 수 있다", () => {
    expect(applyAction(weekend({ hyejin: { hanjeongseon: 5 } }), date("p1", 50_000, 5), ctx()).ok).toBe(true);
  });
});
