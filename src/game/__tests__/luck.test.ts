import { describe, expect, it } from "vitest";
import { ACTIONS, LUCK, TIME } from "../balance";
import { closeDay } from "../day";
import { applyAction } from "../engine";
import { rollLuck } from "../rules";
import type { Rng } from "../types";
import { MONDAY, NEVER, SATURDAY, act, ctx, fixed, makeState } from "./helpers";

/** 행운 난수를 준 컨텍스트 (일반 판정은 NEVER = 거절·불닭 없음) */
const lucky = (luck: Rng, rng: Rng = NEVER) => ({ ...ctx(rng), luck });
/** 확률표에서 key 구간 한가운데 값 */
const pick = (percents: Record<string, number>, key: string): Rng => {
  let from = 0;
  for (const [k, p] of Object.entries(percents)) {
    if (k === key) return fixed((from + p / 2) / 100);
    from += p;
  }
  throw new Error(key);
};
const NORMAL = fixed(0.99);

describe("행운 판정", () => {
  it("확률표 순서대로 구간을 나누고, 행운 난수가 없으면 늘 평소", () => {
    expect(rollLuck(fixed(0.1), { a: 15, b: 10 })).toBe("a");
    expect(rollLuck(fixed(0.2), { a: 15, b: 10 })).toBe("b");
    expect(rollLuck(fixed(0.5), { a: 15, b: 10 })).toBeNull();
    expect(rollLuck(undefined, { a: 100 })).toBeNull();
  });
});

describe("같이 놀기 결과", () => {
  const s = () => makeState({ hyejin: { happiness: 50 }, jungwoo: { happiness: 50 } });

  it("투닥거리면 둘 다 오히려 떨어진다", () => {
    const { state, events } = act(s(), { type: "playTogether" }, lucky(pick(LUCK.PLAY_TOGETHER, "fight")));
    expect(state.hyejin.happiness).toBe(50 + LUCK.PLAY_TOGETHER_FIGHT.HYEJIN);
    expect(state.jungwoo.happiness).toBe(50 + LUCK.PLAY_TOGETHER_FIGHT.JUNGWOO);
    expect(events).toContainEqual({ type: "playedTogether", luck: "fight" });
  });

  it("인생샷 건지면 크게 오른다", () => {
    const { state } = act(s(), { type: "playTogether" }, lucky(pick(LUCK.PLAY_TOGETHER, "great")));
    expect(state.hyejin.happiness).toBe(50 + LUCK.PLAY_TOGETHER_GREAT.HYEJIN);
  });

  it("맑은 날은 조금 더, 투닥거리면 소용없음", () => {
    const sunny = { ...s(), mood: "sunny" as const };
    expect(act(sunny, { type: "playTogether" }, lucky(NORMAL)).state.hyejin.happiness).toBe(
      50 + ACTIONS.PLAY_TOGETHER.HYEJIN_HAPPINESS + LUCK.SUNNY_TOGETHER_BONUS,
    );
    expect(act(sunny, { type: "playTogether" }, lucky(pick(LUCK.PLAY_TOGETHER, "fight"))).state.hyejin.happiness).toBe(
      50 + LUCK.PLAY_TOGETHER_FIGHT.HYEJIN,
    );
  });
});

describe("일 시키기 운", () => {
  it("보너스면 수입 1.5배, 야근이면 정우가 더 지친다", () => {
    const bonus = act(makeState(), { type: "work" }, lucky(pick(LUCK.WORK, "bonus")));
    expect(bonus.state.jungwoo.money).toBe(45_000);
    expect(bonus.events).toContainEqual({ type: "worked", income: 45_000, luck: "bonus" });
    const overtime = act(makeState(), { type: "work" }, lucky(pick(LUCK.WORK, "overtime")));
    expect(overtime.state.jungwoo.happiness).toBe(100 + ACTIONS.WORK.JUNGWOO_HAPPINESS + LUCK.WORK_OVERTIME_JUNGWOO);
  });
});

describe("웨이팅 운", () => {
  const rich = () => makeState({ jungwoo: { money: 100_000 } });
  const price = ACTIONS.WAITING.PRICE_PER_HANJEONGSEON;

  it("1+1이면 하나 더 공짜", () => {
    const { state, events } = act(rich(), { type: "waiting", quantity: 2 }, lucky(pick(LUCK.WAITING, "extra")));
    expect(state.hyejin.hanjeongseon).toBe(3);
    expect(state.jungwoo.money).toBe(100_000 - 2 * price);
    expect(events).toContainEqual({ type: "waitingDone", quantity: 3, cost: 2 * price, luck: "extra" });
  });

  it("앞에서 품절이면 하나 덜, 그만큼 돈도 덜", () => {
    const { state } = act(rich(), { type: "waiting", quantity: 2 }, lucky(pick(LUCK.WAITING, "short")));
    expect(state.hyejin.hanjeongseon).toBe(1);
    expect(state.jungwoo.money).toBe(100_000 - price);
    const empty = act(rich(), { type: "waiting", quantity: 1 }, lucky(pick(LUCK.WAITING, "short")));
    expect(empty.state.hyejin.hanjeongseon).toBe(0);
    expect(empty.state.jungwoo.money).toBe(100_000);
  });
});

describe("오늘의 기분", () => {
  it("아침마다 정해지고, 꿀잠이면 정우 행동 +1", () => {
    const { state, events } = closeDay(makeState(), NEVER, pick(LUCK.MOOD, "rested"));
    expect(state.mood).toBe("rested");
    expect(state.jungwoo.actionsLeft).toBe(TIME.ACTIONS_PER_DAY + LUCK.RESTED_EXTRA_ACTIONS);
    expect(events).toContainEqual(expect.objectContaining({ type: "dayStarted", mood: "rested" }));
    expect(closeDay(state, NEVER, NORMAL).state.mood).toBeNull();
  });

  it("꿀꿀한 날은 자기 전에 혜진이가 더 떨어진다", () => {
    const gloomy = { ...makeState({}, SATURDAY), mood: "gloomy" as const };
    const { state, events } = closeDay(gloomy, NEVER, NORMAL);
    expect(state.hyejin.happiness).toBe(100 + LUCK.GLOOMY_DAY_END);
    expect(events).toContainEqual(expect.objectContaining({ type: "dayEnded", gloomy: LUCK.GLOOMY_DAY_END }));
  });
});

describe("혜진이 쓰다듬기", () => {
  it("하루 한 번, 가끔 뽀뽀 (정우 +)", () => {
    const s = makeState({ jungwoo: { happiness: 50 } });
    const kissed = act(s, { type: "pet" }, lucky(fixed(0.01)));
    expect(kissed.state.jungwoo.happiness).toBe(50 + LUCK.KISS_JUNGWOO);
    expect(kissed.events).toEqual([{ type: "kissed" }]);
    expect(applyAction(kissed.state, { type: "pet" }, ctx())).toEqual({ ok: false, error: "ALREADY_PETTED" });

    const plain = act(s, { type: "pet" }, lucky(NORMAL));
    expect(plain.events).toEqual([]);
    expect(plain.state.jungwoo.actionsLeft).toBe(s.jungwoo.actionsLeft);
    // 다음 날엔 다시 쓰다듬을 수 있다
    expect(applyAction(closeDay(plain.state, NEVER).state, { type: "pet" }, ctx()).ok).toBe(true);
    expect(plain.state.lastPetDate).toBe(MONDAY);
  });
});
