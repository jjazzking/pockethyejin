import { describe, expect, it } from "vitest";
import { settle } from "../day";
import type { GameState } from "../types";
import { COMMUTE, act, expectError, makeState, NEVER } from "./helpers";

/** 혜진 행복도에 영향 없는 행동 1턴 */
const turn = (s: GameState) => act(s, { type: "playAlone" });

/** 행동이 바닥나지 않게 충전해 둔 상태 */
function danger(overrides: Partial<GameState["hyejin"]> = {}): GameState {
  return makeState({ jungwoo: { actionsLeft: 99 }, hyejin: { happiness: 20, countdownTurnsLeft: 3, ...overrides } });
}

describe("경고", () => {
  it("행복도가 30 이하로 내려가면 경고 시작, 30을 넘으면 해제", () => {
    const s = makeState({ hyejin: { happiness: 31, hanjeongseon: 1 } });
    const down = settle(s, "2026-10-13", NEVER); // 월요일 출근 -20 → 11
    expect(down.events).toContainEqual({ type: "warningStarted" });
    const up = act(down.state, { type: "feed", count: 1 }); // 21
    expect(up.events).not.toContainEqual({ type: "warningEnded" });
    const s2 = makeState({ hyejin: { happiness: 30, hanjeongseon: 1 } });
    expect(act(s2, { type: "feed", count: 1 }).events).toContainEqual({ type: "warningEnded" });
  });
});

describe("카운트다운", () => {
  it("행복도가 20 이하가 되면 3턴 카운트다운 시작 (그 턴은 세지 않음)", () => {
    const s = makeState({ hyejin: { happiness: 20 - COMMUTE } });
    const { state, events } = settle(s, "2026-10-13", NEVER); // 월요일 마감 출근 감소 → 20
    expect(state.hyejin.happiness).toBe(20);
    expect(state.hyejin.countdownTurnsLeft).toBe(3);
    expect(events).toContainEqual({ type: "countdownStarted", turnsLeft: 3 });
  });

  it("턴마다 1씩 줄어든다", () => {
    const r1 = turn(danger());
    expect(r1.state.hyejin.countdownTurnsLeft).toBe(2);
    expect(r1.events).toContainEqual({ type: "countdownTicked", turnsLeft: 2 });
    expect(turn(r1.state).state.hyejin.countdownTurnsLeft).toBe(1);
  });

  it("한정선 먹이기는 턴으로 치지 않는다", () => {
    const s = danger({ hanjeongseon: 100, happiness: 10 });
    const fed = act(s, { type: "feed", count: 1 }).state; // 20, 여전히 위험
    expect(fed.hyejin.countdownTurnsLeft).toBe(3);
  });

  it("행복도가 20을 넘으면 해제", () => {
    const s = danger({ hanjeongseon: 1 });
    const { state, events } = act(s, { type: "feed", count: 1 });
    expect(state.hyejin.countdownTurnsLeft).toBeNull();
    expect(events).toContainEqual({ type: "countdownCancelled" });
  });

  it("3번째 턴에 행복도를 올리면 판정 전에 해제된다", () => {
    const s = danger({ countdownTurnsLeft: 1 });
    const { state, events } = act(s, { type: "playTogether" }); // 35
    expect(state.hyejin.countdownTurnsLeft).toBeNull();
    expect(state.hyejin.jungwooBlockUsed).toBe(false);
    expect(events).not.toContainEqual({ type: "jungwooBlocked" });
  });

  it("날을 넘겨도 이어지고, 하루 마감은 턴으로 치지 않는다", () => {
    const s = danger({ countdownTurnsLeft: 2, happiness: 20 });
    const { state } = settle({ ...s, lastSettledDate: "2026-10-17" }, "2026-10-18", NEVER); // 토요일 마감
    expect(state.hyejin.countdownTurnsLeft).toBe(2);
  });
});

describe("정우 막기와 절반 섭취", () => {
  it("3턴 후에도 20 이하이면 첫 번째는 정우가 막고 다시 3턴 유예", () => {
    let s = danger({ hanjeongseon: 10 });
    s = turn(s).state;
    s = turn(s).state;
    const { state, events } = turn(s);
    expect(events).toContainEqual({ type: "jungwooBlocked" });
    expect(state.hyejin.jungwooBlockUsed).toBe(true);
    expect(state.hyejin.countdownTurnsLeft).toBe(3);
    expect(state.hyejin.hanjeongseon).toBe(10);
  });

  it("막은 뒤 유예 3턴 후에도 20 이하이면 절반(내림)을 먹고 개수 × 10 회복", () => {
    let s = danger({ hanjeongseon: 7, happiness: 5, jungwooBlockUsed: true });
    s = turn(s).state;
    s = turn(s).state;
    const { state, events } = turn(s);
    expect(events).toContainEqual({ type: "halfEaten", eaten: 3, recovered: 30 });
    expect(state.hyejin.hanjeongseon).toBe(4);
    expect(state.hyejin.happiness).toBe(35);
    expect(state.hyejin.countdownTurnsLeft).toBeNull();
  });

  it("회복은 최대 100까지", () => {
    const s = danger({ hanjeongseon: 400, happiness: 0, jungwooBlockUsed: true, countdownTurnsLeft: 1 });
    const { state, events } = turn(s);
    expect(state.hyejin.happiness).toBe(100);
    expect(state.hyejin.hanjeongseon).toBe(200);
    expect(events).toContainEqual({ type: "halfEaten", eaten: 200, recovered: 100 });
  });

  it("먹고도 20 이하이면 카운트다운을 새로 시작한다", () => {
    const s = danger({ hanjeongseon: 1, happiness: 0, jungwooBlockUsed: true, countdownTurnsLeft: 1 });
    const { state, events } = turn(s);
    expect(events).toContainEqual({ type: "halfEaten", eaten: 0, recovered: 0 });
    expect(state.hyejin.countdownTurnsLeft).toBe(3);
    expect(events).toContainEqual({ type: "countdownStarted", turnsLeft: 3 });
  });

  it("정우 막기는 게임 전체에서 한 번만: 회복 후 다시 위험해지면 바로 절반 섭취", () => {
    // 1차 위기: 막기 발동
    let s = danger({ hanjeongseon: 10, countdownTurnsLeft: 1 });
    s = turn(s).state;
    expect(s.hyejin.jungwooBlockUsed).toBe(true);
    // 회복 → 해제
    s = act(s, { type: "playTogether" }).state;
    expect(s.hyejin.countdownTurnsLeft).toBeNull();
    // 2차 위기: 다음 날 마감으로 다시 20 이하
    s = { ...s, hyejin: { ...s.hyejin, happiness: 30 } };
    s = settle(s, "2026-10-13", NEVER).state;
    s = { ...s, jungwoo: { ...s.jungwoo, actionsLeft: 99 } };
    expect(s.hyejin.countdownTurnsLeft).toBe(3);
    s = turn(s).state;
    s = turn(s).state;
    const { events } = turn(s);
    expect(events).not.toContainEqual({ type: "jungwooBlocked" });
    expect(events).toContainEqual(expect.objectContaining({ type: "halfEaten", eaten: 5 }));
  });

  it("데이트는 3턴으로 센다", () => {
    // 데이트 한 번에 카운트다운 3턴이 지나가지만 혜진 +30으로 20을 넘기므로 먼저 해제된다
    const s = makeState(
      { jungwoo: { money: 50_000 }, hyejin: { happiness: 0, countdownTurnsLeft: 3, hanjeongseon: 10 } },
      "2026-10-17",
    );
    const { state, events } = act(s, { type: "date", placeId: "p1", budget: 50_000, offering: 0 });
    expect(state.hyejin.countdownTurnsLeft).toBeNull();
    expect(events).not.toContainEqual({ type: "jungwooBlocked" });
  });

  it("거절된 웨이팅도 1턴, 사라진 행동은 턴이 아니다", () => {
    const s = makeState({
      jungwoo: { money: 10_000, happiness: 0, actionsLeft: 5 },
      hyejin: { happiness: 10, countdownTurnsLeft: 3 },
    });
    const { state, events } = act(s, { type: "waiting", quantity: 1 });
    expect(events).toContainEqual({ type: "waitingRejected" });
    expect(state.hyejin.countdownTurnsLeft).toBe(2);
  });
});

describe("부재 중에는 절반 섭취가 일어나지 않는다", () => {
  it("여러 날 밀려도 카운트다운 상태까지만 진행된다", () => {
    const s = makeState({ hyejin: { happiness: 25, hanjeongseon: 10, countdownTurnsLeft: null, jungwooBlockUsed: true } });
    const { state, events } = settle(s, "2026-10-20", NEVER); // 월~월 8일 정산
    expect(state.hyejin.happiness).toBe(0);
    expect(state.hyejin.hanjeongseon).toBe(10);
    expect(state.hyejin.countdownTurnsLeft).toBe(3);
    expect(events).not.toContainEqual(expect.objectContaining({ type: "halfEaten" }));
  });
});

describe("카운트다운 중에는 레벨업 불가", () => {
  it("카운트다운 중이면 한정선이 충분해도 레벨업할 수 없다", () => {
    const s = danger({ hanjeongseon: 100, happiness: 20 });
    expectError(s, { type: "levelUp" }, "HYEJIN_UPSET");
  });

  it("경고 구간(30 이하)이어도 카운트다운 전이면 레벨업할 수 있다", () => {
    const s = makeState({ hyejin: { happiness: 25, hanjeongseon: 100 } });
    expect(act(s, { type: "levelUp" }).state.hyejin.level).toBe(2);
  });

  it("기분을 풀어 카운트다운이 해제되면 다시 레벨업할 수 있다", () => {
    const s = danger({ hanjeongseon: 100, happiness: 20 });
    const fed = act(s, { type: "feed", count: 1 }).state; // 30 → 해제
    expect(fed.hyejin.countdownTurnsLeft).toBeNull();
    expect(act(fed, { type: "levelUp" }).state.hyejin.level).toBe(2);
  });

  it("만렙이면 만렙 사유가 먼저", () => {
    const s = danger({ level: 3, hanjeongseon: 100 });
    expectError(s, { type: "levelUp" }, "MAX_LEVEL");
  });
});
