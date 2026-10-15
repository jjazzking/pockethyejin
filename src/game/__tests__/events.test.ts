import { describe, expect, it } from "vitest";
import { ACTIONS, SOCIAL, TIME } from "../balance";
import { addDays, isWeekend } from "../date";
import { closeDay } from "../day";
import { applyAction } from "../engine";
import { ALWAYS, FRIDAY, MONDAY, NEVER, SATURDAY, act, ctx, makeState, sequence } from "./helpers";

/** 사귄 지 n일째 날짜 */
const dayN = (n: number) => addDays(TIME.START_DATE, n - 1);

describe("날짜로 정해지는 이벤트", () => {
  it("매달 월급날 아침엔 확률과 상관없이 월급날 이벤트, 월급이 들어온다", () => {
    const { state, events } = closeDay(makeState({}, "2026-10-24"), NEVER);
    expect(state.lastSettledDate).toBe(`2026-10-${SOCIAL.PAYDAY_DAY_OF_MONTH}`);
    expect(state.social).toBe("payday");
    expect(state.jungwoo.money).toBe(SOCIAL.PAYDAY_SALARY);
    expect(events).toContainEqual({ type: "socialEvent", event: "payday" });
  });

  it("사귄 지 100일 단위 날엔 기념일 이벤트", () => {
    expect(closeDay(makeState({}, dayN(99)), NEVER).state.social).toBe("anniversary");
    expect(closeDay(makeState({}, dayN(100)), NEVER).state.social).toBeNull();
  });

  it("기념일 데이트는 별이 하나 더 붙는다 (최대 3개)", () => {
    const anniversary = dayN(300);
    expect(isWeekend(anniversary)).toBe(true);
    const date = { type: "date", placeId: "p1", budget: 50_000, offering: 0 } as const;
    const money = { jungwoo: { money: 100_000 } };
    const normal = act(makeState(money, SATURDAY), date, ctx(ALWAYS)).events.find((e) => e.type === "dated");
    const special = act(makeState(money, anniversary), date, ctx(ALWAYS)).events.find((e) => e.type === "dated");
    expect(normal).toMatchObject({ stars: 1 });
    expect(special).toMatchObject({ stars: 2 });
    const best = act(makeState(money, anniversary), date, ctx(NEVER)).events.find((e) => e.type === "dated");
    expect(best).toMatchObject({ stars: 3 });
  });

  it("월급날 선택지는 쓰는 돈만 든다 (저축은 그대로)", () => {
    const paid = makeState({ social: "payday", jungwoo: { money: SOCIAL.PAYDAY_SALARY } });
    expect(act(paid, { type: "social", choice: "save" }).state.jungwoo.money).toBe(SOCIAL.PAYDAY_SALARY);
    const treat = act(paid, { type: "social", choice: "treat" }).state;
    expect(treat.jungwoo.money).toBeLessThan(SOCIAL.PAYDAY_SALARY);
    const bought = act(paid, { type: "social", choice: "hanjeongseon" }).state;
    expect(bought.jungwoo.money).toBe(SOCIAL.PAYDAY_SALARY - 50_000);
    expect(bought.hyejin.hanjeongseon).toBe(3);
  });
});

describe("랜덤 이벤트 풀", () => {
  /** pick 값을 0~1로 훑어서 그날 나올 수 있는 이벤트 전부 */
  const reachable = (from: string, weekendMorning: boolean) => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const rolls = weekendMorning ? [0, i / 40, 0.999] : [0.999, 0, i / 40, 0.999];
      seen.add(closeDay(makeState({}, from), sequence(...rolls)).state.social!);
    }
    return seen;
  };

  it("소나기는 평일에만, 집콕은 주말에만. 날짜 이벤트는 랜덤으로 안 나온다", () => {
    const weekday = reachable(MONDAY, false);
    const weekend = reachable(FRIDAY, true);
    expect(weekday.has("rain")).toBe(true);
    expect(weekday.has("homebody")).toBe(false);
    expect(weekend.has("homebody")).toBe(true);
    expect(weekend.has("rain")).toBe(false);
    for (const pool of [weekday, weekend]) {
      expect(pool.has("payday")).toBe(false);
      expect(pool.has("anniversary")).toBe(false);
    }
  });

  it("한정선이 드는 선택지는 한정선이 있어야 고를 수 있다", () => {
    const choice = { type: "social", choice: "hanjeongseon" } as const;
    expect(applyAction(makeState({ social: "dessert" }), choice, ctx())).toEqual({ ok: false, error: "NOT_ENOUGH_HANJEONGSEON" });
    const { state } = act(makeState({ social: "dessert", hyejin: { hanjeongseon: 1, happiness: 50 } }), choice);
    expect(state.hyejin.hanjeongseon).toBe(0);
    expect(state.hyejin.happiness).toBe(65);
  });
});

describe("혜진이 감기", () => {
  const sick = (overrides = {}) => makeState({ hyejin: { sick: true, happiness: 50, hanjeongseon: 1 }, jungwoo: { money: 50_000 }, ...overrides });

  it("아침에 확률로 걸리고 도감에 남는다. 다음 날 아침엔 낫는다", () => {
    const { state, events } = closeDay(makeState(), sequence(0.999, 0.999, 0));
    expect(state.hyejin.sick).toBe(true);
    expect(events).toContainEqual({ type: "hyejinSick" });
    expect(state.seenEvents).toContain("cold");
    expect(closeDay(state, NEVER).state.hyejin.sick).toBe(false);
  });

  it("같이 놀기는 안 되고, 오르는 행복도는 반만", () => {
    expect(applyAction(sick(), { type: "playTogether" }, ctx())).toEqual({ ok: false, error: "HYEJIN_SICK" });
    expect(act(sick(), { type: "feed", count: 1 }).state.hyejin.happiness).toBe(55);
  });

  it("죽을 사다 주면 낫고 행복도가 다 오른다", () => {
    const { state, events } = act(sick(), { type: "porridge" });
    expect(state.hyejin.sick).toBe(false);
    expect(state.hyejin.happiness).toBe(50 + ACTIONS.PORRIDGE.HYEJIN_HAPPINESS);
    expect(state.jungwoo.money).toBe(50_000 - ACTIONS.PORRIDGE.COST_MONEY);
    expect(state.jungwoo.actionsLeft).toBe(TIME.ACTIONS_PER_DAY - ACTIONS.PORRIDGE.ACTION_COST);
    expect(events).toContainEqual({ type: "porridgeDelivered" });
    expect(applyAction(makeState(), { type: "porridge" }, ctx())).toEqual({ ok: false, error: "NOT_SICK" });
  });
});
