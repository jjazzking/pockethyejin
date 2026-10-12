import { describe, expect, it } from "vitest";
import { ALWAYS, MONDAY, NEVER, makeState } from "@/game/__tests__/helpers";
import type { GameState, Rng } from "@/game/types";
import { MemoryGameStore } from "../memoryStore";
import { CURRENT_SCHEMA_VERSION, NewerSchemaError, migrateState } from "../schema";
import { openGame, performAction, type SessionDeps } from "../session";

/** 서울 시간 정오 */
const noon = (date: string) => new Date(`${date}T12:00:00+09:00`);

function device(store: MemoryGameStore, date: string, rng: Rng = NEVER): SessionDeps {
  return { store, now: () => noon(date), rng };
}

function storeWith(state: GameState, version = 7): MemoryGameStore {
  return new MemoryGameStore({ state, version, schemaVersion: CURRENT_SCHEMA_VERSION });
}

describe("openGame", () => {
  it("저장된 게 없으면 새 게임을 만든다", async () => {
    const store = new MemoryGameStore();
    const result = await openGame(device(store, MONDAY));
    expect(result.isNewGame).toBe(true);
    expect(result.game.version).toBe(1);
    expect(result.game.state.lastSettledDate).toBe(MONDAY);
    expect(store.peek()?.version).toBe(1);
  });

  it("두 기기가 동시에 처음 열어도 게임은 하나만 만들어진다", async () => {
    const store = new MemoryGameStore();
    const [a, b] = await Promise.all([openGame(device(store, MONDAY)), openGame(device(store, MONDAY, ALWAYS))]);
    expect(a.game).toEqual(b.game);
    expect(store.peek()?.version).toBe(1);
    expect([a.isNewGame, b.isNewGame].sort()).toEqual([false, true]);
  });

  it("밀린 날을 정산해서 저장하고 요약을 돌려준다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const result = await openGame(device(store, "2026-10-15"));
    expect(result.summary).toMatchObject({ daysPassed: 3, absentDays: 2 });
    expect(result.game.version).toBe(8);
    expect(store.peek()?.state).toEqual(result.game.state);
    expect(result.game.state.hyejin.happiness).toBe(100 - 20 - 10 - 10);
  });

  it("같은 날 다시 열면 아무것도 저장하지 않는다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const result = await openGame(device(store, MONDAY));
    expect(result.summary).toBeNull();
    expect(result.events).toEqual([]);
    expect(store.peek()?.version).toBe(7);
  });

  it("오늘 05:59(서울)에는 아직 전날이라 정산하지 않는다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const deps = { store, now: () => new Date("2026-10-13T05:59:00+09:00"), rng: NEVER };
    expect((await openGame(deps)).summary).toBeNull();
    const after = { ...deps, now: () => new Date("2026-10-13T06:00:00+09:00") };
    expect((await openGame(after)).summary).toMatchObject({ daysPassed: 1 });
  });
});

describe("두 기기에서 같은 날 정산은 한 번만", () => {
  it("동시에 열면 먼저 저장한 쪽만 반영되고 늦은 쪽은 최신 상태를 다시 불러온다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    // 폰은 화요일 불닭 없음, 컴퓨터는 불닭 있음으로 굴린다. 결과는 한쪽 것만 남아야 한다.
    const phone = device(store, "2026-10-13", NEVER);
    const computer = device(store, "2026-10-13", ALWAYS);

    const [a, b] = await Promise.all([openGame(phone), openGame(computer)]);

    // 감소는 한 번만 (월요일 출근 -20)
    expect(store.peek()?.state).toMatchObject({ hyejin: { happiness: 80 }, lastSettledDate: "2026-10-13" });
    // 정산 저장은 한 번 → 버전도 한 번만 오른다
    expect(store.peek()?.version).toBe(8);
    expect(a.game).toEqual(b.game);
    expect(a.game.state.bulldak).toBe("none");

    // 먼저 저장한 기기만 요약을 받고, 늦은 기기는 동기화 알림을 받는다
    expect(a.summary).not.toBeNull();
    expect(a.syncedFromOtherDevice).toBe(false);
    expect(b.summary).toBeNull();
    expect(b.syncedFromOtherDevice).toBe(true);
  });

  it("한쪽이 정산한 뒤 다른 쪽이 열어도 다시 정산되지 않는다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    await openGame(device(store, "2026-10-14"));
    const second = await openGame(device(store, "2026-10-14", ALWAYS));
    expect(second.summary).toBeNull();
    expect(store.peek()?.version).toBe(8);
    expect(second.game.state.hyejin.happiness).toBe(100 - 20 - 10);
  });
});

describe("performAction", () => {
  it("행동을 적용하고 버전을 올려 저장한다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const deps = device(store, MONDAY);
    const { game } = await openGame(deps);
    const outcome = await performAction(deps, game, { type: "work" }, []);
    expect(outcome.kind).toBe("done");
    expect(outcome.game.version).toBe(8);
    expect(store.peek()?.state).toMatchObject({ jungwoo: { money: 30_000, actionsLeft: 4 } });
  });

  it("규칙상 안 되는 행동은 저장하지 않는다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const deps = device(store, MONDAY);
    const { game } = await openGame(deps);
    const outcome = await performAction(deps, game, { type: "convenienceStore" }, []);
    expect(outcome).toMatchObject({ kind: "invalid", error: "NO_BULLDAK_EVENT" });
    expect(store.peek()?.version).toBe(7);
  });

  it("다른 기기가 먼저 저장했으면 덮어쓰지 않고 최신 상태를 돌려준다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const phone = device(store, MONDAY);
    const computer = device(store, MONDAY);
    const onPhone = (await openGame(phone)).game;
    const onComputer = (await openGame(computer)).game;

    const first = await performAction(phone, onPhone, { type: "work" }, []);
    expect(first.kind).toBe("done");

    // 컴퓨터는 아직 일하기 전 상태를 들고 있다
    const second = await performAction(computer, onComputer, { type: "playAlone" }, []);
    expect(second.kind).toBe("conflict");
    // 폰의 일은 살아 있고, 컴퓨터의 혼자 놀기는 반영되지 않았다
    expect(second.game.state.jungwoo).toMatchObject({ money: 30_000, actionsLeft: 4, happiness: 90 });
    expect(store.peek()?.version).toBe(8);

    // 최신 상태로 다시 시도하면 된다
    const retry = await performAction(computer, second.game, { type: "playAlone" }, []);
    expect(retry.kind).toBe("done");
    expect(store.peek()?.state).toMatchObject({ jungwoo: { actionsLeft: 3, happiness: 100 } });
  });

  it("앱을 켜둔 채 아침 6시가 지나면 행동 전에 정산한다 (켜둔 날은 접속한 날)", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const { game } = await openGame(device(store, MONDAY));
    const nextDay = device(store, "2026-10-13");
    const outcome = await performAction(nextDay, game, { type: "work" }, []);
    expect(outcome.kind).toBe("done");
    expect(outcome.summary).toMatchObject({ daysPassed: 1, absentDays: 0 });
    expect(outcome.game.state).toMatchObject({
      lastSettledDate: "2026-10-13",
      hyejin: { happiness: 80 },
      jungwoo: { actionsLeft: 4 },
    });
  });
});

describe("한정선 절반 섭취는 접속 중 행동으로만", () => {
  it("카운트다운이 끝나기 직전인 채로 며칠 비워도, 접속해서 행동해야 발동한다", async () => {
    const state = makeState(
      { hyejin: { happiness: 10, hanjeongseon: 10, countdownTurnsLeft: 1, jungwooBlockUsed: true } },
      MONDAY,
    );
    const store = storeWith(state);
    const deps = device(store, "2026-10-16");

    const opened = await openGame(deps);
    expect(opened.game.state.hyejin).toMatchObject({ hanjeongseon: 10, countdownTurnsLeft: 1, happiness: 0 });
    expect(opened.events.map((e) => e.type)).not.toContain("halfEaten");

    const outcome = await performAction(deps, opened.game, { type: "playAlone" }, []);
    expect(outcome.kind).toBe("done");
    if (outcome.kind !== "done") return;
    expect(outcome.events).toContainEqual({ type: "halfEaten", eaten: 5, recovered: 50 });
    expect(store.peek()?.state).toMatchObject({ hyejin: { hanjeongseon: 5, happiness: 50 } });
  });

  it("경고를 본 혜진이 행동 전에 한정선을 먹이면 막을 수 있다", async () => {
    const state = makeState(
      { hyejin: { happiness: 15, hanjeongseon: 10, countdownTurnsLeft: 1, jungwooBlockUsed: true } },
      MONDAY,
    );
    const store = storeWith(state);
    const deps = device(store, MONDAY);
    const { game } = await openGame(deps);
    const fed = await performAction(deps, game, { type: "feed", count: 1 }, []);
    const played = await performAction(deps, fed.game, { type: "playAlone" }, []);
    expect(played.kind).toBe("done");
    expect(played.game.state.hyejin).toMatchObject({ hanjeongseon: 9, happiness: 25, countdownTurnsLeft: null });
  });
});

describe("상태 구조 버전", () => {
  it("이전 구조는 마이그레이션을 차례로 적용한다", () => {
    const migrations = {
      1: (raw: unknown) => ({ ...(raw as object), a: 1 }),
      2: (raw: unknown) => ({ ...(raw as object), b: 2 }),
    };
    expect(migrateState(1, { x: 0 }, migrations, 3)).toEqual({ x: 0, a: 1, b: 2 });
    expect(migrateState(2, { x: 0 }, migrations, 3)).toEqual({ x: 0, b: 2 });
  });

  it("마이그레이션이 빠져 있으면 에러", () => {
    expect(() => migrateState(1, {}, {}, 2)).toThrow();
  });

  it("앱보다 새로운 구조면 NewerSchemaError (오래된 탭이 덮어쓰지 않게)", async () => {
    const store = new MemoryGameStore({
      state: makeState(),
      version: 3,
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
    });
    await expect(openGame(device(store, "2026-10-14"))).rejects.toBeInstanceOf(NewerSchemaError);
    expect(store.peek()?.version).toBe(3);
  });
});
