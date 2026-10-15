import { describe, expect, it } from "vitest";
import { ALWAYS, COMMUTE, MONDAY, NEVER, PLACES, makeState } from "@/game/__tests__/helpers";
import { TIME } from "@/game/balance";
import type { GameState, Rng } from "@/game/types";
import { MemoryGameStore } from "../memoryStore";
import { CURRENT_SCHEMA_VERSION, NewerSchemaError, migrateState } from "../schema";
import { openGame as open, performAction, type SessionDeps } from "../session";

/** 장소 3개가 등록된 상태로 연다 */
const openGame = (deps: SessionDeps, places = PLACES) => open(deps, places);

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
    // 현실 날짜와 상관없이 사귄 첫날부터
    expect(result.game.state.lastSettledDate).toBe(TIME.START_DATE);
    expect(store.peek()?.version).toBe(1);
  });

  it("두 기기가 동시에 처음 열어도 게임은 하나만 만들어진다", async () => {
    const store = new MemoryGameStore();
    const [a, b] = await Promise.all([openGame(device(store, MONDAY)), openGame(device(store, MONDAY, ALWAYS))]);
    expect(a.game).toEqual(b.game);
    expect(store.peek()?.version).toBe(1);
    expect([a.isNewGame, b.isNewGame].sort()).toEqual([false, true]);
  });

  it("며칠 지나서 열어도 게임 날짜는 그대로이고 아무것도 저장하지 않는다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const result = await openGame(device(store, "2026-10-20"));
    expect(result.events).toEqual([]);
    expect(result.game.state.lastSettledDate).toBe(MONDAY);
    expect(result.game.state.hyejin.happiness).toBe(100);
    expect(store.peek()?.version).toBe(7);
  });
});

describe("두 기기에서 잠자기는 한 번만", () => {
  it("같은 상태에서 둘 다 자면 먼저 저장한 쪽만 반영되고 늦은 쪽은 최신 상태를 받는다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    // 폰은 화요일 불닭 없음, 컴퓨터는 불닭 있음으로 굴린다. 결과는 한쪽 것만 남아야 한다.
    const phone = device(store, MONDAY, NEVER);
    const computer = device(store, MONDAY, ALWAYS);
    const onPhone = (await openGame(phone)).game;
    const onComputer = (await openGame(computer)).game;

    const a = await performAction(phone, onPhone, { type: "sleep" }, PLACES);
    const b = await performAction(computer, onComputer, { type: "sleep" }, PLACES);
    expect(a.kind).toBe("done");
    expect(b.kind).toBe("conflict");

    // 하루만 넘어가고 감소도 한 번만 (월요일 출근)
    expect(store.peek()?.state).toMatchObject({
      hyejin: { happiness: 100 + COMMUTE },
      lastSettledDate: "2026-10-13",
      bulldak: "none",
      nights: { used: 1 },
    });
    expect(store.peek()?.version).toBe(8);
    expect(b.game).toEqual(a.game);
  });
});

describe("performAction", () => {
  it("행동을 적용하고 버전을 올려 저장한다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const deps = device(store, MONDAY);
    const { game } = await openGame(deps);
    const outcome = await performAction(deps, game, { type: "work" }, PLACES);
    expect(outcome.kind).toBe("done");
    expect(outcome.game.version).toBe(8);
    expect(store.peek()?.state).toMatchObject({ jungwoo: { money: 30_000, actionsLeft: 4 } });
  });

  it("규칙상 안 되는 행동은 저장하지 않는다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const deps = device(store, MONDAY);
    const { game } = await openGame(deps);
    const outcome = await performAction(deps, game, { type: "convenienceStore" }, PLACES);
    expect(outcome).toMatchObject({ kind: "invalid", error: "NO_BULLDAK_EVENT" });
    expect(store.peek()?.version).toBe(7);
  });

  it("다른 기기가 먼저 저장했으면 덮어쓰지 않고 최신 상태를 돌려준다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const phone = device(store, MONDAY);
    const computer = device(store, MONDAY);
    const onPhone = (await openGame(phone)).game;
    const onComputer = (await openGame(computer)).game;

    const first = await performAction(phone, onPhone, { type: "work" }, PLACES);
    expect(first.kind).toBe("done");

    // 컴퓨터는 아직 일하기 전 상태를 들고 있다
    const second = await performAction(computer, onComputer, { type: "playAlone" }, PLACES);
    expect(second.kind).toBe("conflict");
    // 폰의 일은 살아 있고, 컴퓨터의 혼자 놀기는 반영되지 않았다
    expect(second.game.state.jungwoo).toMatchObject({ money: 30_000, actionsLeft: 4, happiness: 90 });
    expect(store.peek()?.version).toBe(8);

    // 최신 상태로 다시 시도하면 된다
    const retry = await performAction(computer, second.game, { type: "playAlone" }, PLACES);
    expect(retry.kind).toBe("done");
    expect(store.peek()?.state).toMatchObject({ jungwoo: { actionsLeft: 3, happiness: 100 } });
  });

  it("잠자기는 다음 날로 넘기고 밤사이 요약을 돌려준다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const deps = device(store, "2026-10-20");
    const { game } = await openGame(deps);
    const outcome = await performAction(deps, game, { type: "sleep" }, PLACES);
    expect(outcome.kind).toBe("done");
    if (outcome.kind !== "done") return;
    expect(outcome.summary).toMatchObject({ fromDate: MONDAY, toDate: "2026-10-13", hyejinHappiness: { change: COMMUTE } });
    // 밤 횟수는 지금 시각의 현실 하루로 센다
    expect(outcome.game.state.nights).toEqual({ realDay: "2026-10-20", used: 1 });
  });

  it("다른 행동은 요약이 없다", async () => {
    const store = storeWith(makeState({}, MONDAY));
    const deps = device(store, MONDAY);
    const outcome = await performAction(deps, (await openGame(deps)).game, { type: "work" }, PLACES);
    expect(outcome).toMatchObject({ kind: "done", summary: null });
  });

  it(`현실 하루에 ${TIME.NIGHTS_PER_REAL_DAY}번까지 자고, 아침 6시가 지나면 다시 잘 수 있다`, async () => {
    const store = storeWith(makeState({}, MONDAY));
    const night = { store, now: () => new Date("2026-10-21T05:59:00+09:00"), rng: NEVER };
    let { game } = await openGame(night);
    for (let i = 0; i < TIME.NIGHTS_PER_REAL_DAY; i++) {
      const slept = await performAction(night, game, { type: "sleep" }, PLACES);
      expect(slept.kind).toBe("done");
      game = slept.game;
    }
    expect(await performAction(night, game, { type: "sleep" }, PLACES)).toMatchObject({ kind: "invalid", error: "NO_NIGHTS_LEFT" });

    const morning = { ...night, now: () => new Date("2026-10-21T06:00:00+09:00") };
    expect((await performAction(morning, game, { type: "sleep" }, PLACES)).kind).toBe("done");
  });
});

describe("한정선 절반 섭취는 행동(턴)으로만", () => {
  it("카운트다운이 끝나기 직전에 자도 발동하지 않고, 다음 날 행동해야 발동한다", async () => {
    const state = makeState(
      { hyejin: { happiness: 10, hanjeongseon: 10, countdownTurnsLeft: 1, jungwooBlockUsed: true } },
      MONDAY,
    );
    const store = storeWith(state);
    const deps = device(store, MONDAY);

    const slept = await performAction(deps, (await openGame(deps)).game, { type: "sleep" }, PLACES);
    expect(slept.kind).toBe("done");
    if (slept.kind !== "done") return;
    expect(slept.game.state.hyejin).toMatchObject({ hanjeongseon: 10, countdownTurnsLeft: 1, happiness: 0 });
    expect(slept.events.map((e) => e.type)).not.toContain("halfEaten");

    const outcome = await performAction(deps, slept.game, { type: "playAlone" }, PLACES);
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
    const fed = await performAction(deps, game, { type: "feed", count: 1 }, PLACES);
    const played = await performAction(deps, fed.game, { type: "playAlone" }, PLACES);
    expect(played.kind).toBe("done");
    expect(played.game.state.hyejin).toMatchObject({ hanjeongseon: 9, happiness: 25, countdownTurnsLeft: null });
  });
});

describe("새 추억 알림 (접속 시)", () => {
  it("저장된 장소 수보다 늘었으면 알림 이벤트를 내고 새 수를 저장한다", async () => {
    const store = storeWith(makeState({ knownPlaceCount: 3, hyejin: { level: 3 } }, MONDAY));
    const four = [...PLACES, { id: "p4" }];
    const result = await openGame(device(store, MONDAY), four);
    expect(result.events).toEqual([{ type: "newPlacesAdded", count: 1, levelCapRaised: true }]);
    expect(store.peek()?.state).toMatchObject({ knownPlaceCount: 4 });
    expect(store.peek()?.version).toBe(8);
    // 다시 열면 알림은 한 번뿐
    expect((await openGame(device(store, MONDAY), four)).events).toEqual([]);
  });

  it("새 게임은 이미 있는 장소를 새 추억으로 치지 않는다", async () => {
    const store = new MemoryGameStore();
    const first = await openGame(device(store, MONDAY));
    expect(first.game.state.knownPlaceCount).toBe(3);
    expect((await openGame(device(store, MONDAY))).events).toEqual([]);
  });
});

describe("상태 구조 버전", () => {
  it("현실 날짜로 진행하던 저장(구조 버전 2)은 사귄 첫날부터 새로 시작하고, 장소 수는 알림 없이 맞춘다", async () => {
    const { nights: _omit, ...v2 } = makeState({ hyejin: { level: 3, hanjeongseon: 7 } }, MONDAY);
    void _omit;
    const store = new MemoryGameStore({ state: v2, version: 4, schemaVersion: 2 });
    const result = await openGame(device(store, MONDAY));
    expect(result.events).toEqual([]);
    expect(store.peek()).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      version: 5,
      state: {
        lastSettledDate: TIME.START_DATE,
        knownPlaceCount: 3,
        bulldak: "none",
        nights: { realDay: null, used: 0 },
        hyejin: { level: 1, hanjeongseon: 0, happiness: 100 },
      },
    });
  });

  it("구조 버전 1도 차례로 올려서 새로 시작한다", async () => {
    const { knownPlaceCount: _a, nights: _b, ...v1 } = makeState({}, MONDAY);
    void _a;
    void _b;
    const store = new MemoryGameStore({ state: v1, version: 4, schemaVersion: 1 });
    await openGame(device(store, MONDAY));
    expect(store.peek()).toMatchObject({ schemaVersion: CURRENT_SCHEMA_VERSION, state: { lastSettledDate: TIME.START_DATE } });
  });

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

  it("v4 → v5: 저장된 상태로 알 수 있는 이벤트만 도감에 채운다", () => {
    const v4: Partial<GameState> = makeState({ social: "poker", jungwoo: { rank: 2 }, hyejin: { jungwooBlockUsed: true } });
    delete v4.seenEvents;
    expect(migrateState(4, v4, undefined, 5).seenEvents).toEqual(["poker", "promoted", "block"]);
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

describe("v5 → v6 마이그레이션", () => {
  it("진행 중인 게임은 감기 안 걸린 상태로 이어진다", () => {
    const current = makeState();
    const hyejinV5: Partial<GameState["hyejin"]> = { ...current.hyejin };
    delete hyejinV5.sick;
    expect(migrateState(5, { ...current, hyejin: hyejinV5 }).hyejin.sick).toBe(false);
  });
});

describe("v6 → v7 마이그레이션", () => {
  it("진행 중인 게임은 평범한 기분, 쓰다듬기 기록 없음으로 이어진다", () => {
    const v6: Partial<GameState> = makeState();
    delete v6.mood;
    delete v6.lastPetDate;
    const migrated = migrateState(6, v6);
    expect(migrated.mood).toBeNull();
    expect(migrated.lastPetDate).toBeNull();
  });
});
