import { toRealDay } from "@/game/date";
import { createInitialState } from "@/game/day";
import { applyAction } from "@/game/engine";
import { syncPlaceCount } from "@/game/places";
import { summarizeNight, type NightSummary } from "@/game/summary";
import type { Action, ActionError, GameEvent, PlaceRef, Rng } from "@/game/types";
import { CURRENT_SCHEMA_VERSION, migrateState } from "./schema";
import type { GameStore, StoredGame } from "./store";

export interface SessionDeps {
  store: GameStore;
  now: () => Date;
  rng: Rng;
}

/** 저장 충돌이 계속될 때 다시 시도하는 최대 횟수 */
const MAX_SYNC_ATTEMPTS = 5;

export class SyncError extends Error {
  constructor() {
    super("다른 기기와의 동기화가 계속 충돌해서 저장하지 못했어요.");
    this.name = "SyncError";
  }
}

export interface OpenResult {
  game: StoredGame;
  /** 새 게임 첫날 아침, "새 추억" 알림 같은 일 (없으면 빈 배열) */
  events: GameEvent[];
  isNewGame: boolean;
  /** 저장하려는 사이 다른 기기가 먼저 저장해서 최신 상태를 다시 불러왔는지 */
  syncedFromOtherDevice: boolean;
}

/**
 * 앱을 열 때 호출한다: 상태를 불러와 구조 버전을 맞추고, 등록된 장소 수를 확인해서("새 추억" 알림) 저장한다.
 * 게임 날짜는 잠잘 때만 넘어가므로 여기서는 날짜를 건드리지 않는다. places는 order 순.
 *
 * 두 기기가 동시에 열어도 한 번만 반영된다. 먼저 저장한 기기가 이기고,
 * 늦은 기기는 버전 충돌로 자기 결과를 버린 뒤 최신 상태를 다시 불러온다.
 */
export async function openGame(deps: SessionDeps, places: readonly PlaceRef[]): Promise<OpenResult> {
  for (let attempt = 0; attempt < MAX_SYNC_ATTEMPTS; attempt++) {
    const syncedFromOtherDevice = attempt > 0;
    const raw = await deps.store.load();

    if (!raw) {
      const initial = createInitialState(undefined, deps.rng);
      // 처음 시작할 때 이미 있는 장소는 "새 추억"이 아니다.
      const created = await deps.store.create({ ...initial.state, knownPlaceCount: places.length });
      if (!created.ok) continue;
      return { game: created.game, events: initial.events, isNewGame: true, syncedFromOtherDevice };
    }

    const before = migrateState(raw.schemaVersion, raw.state);
    const synced = syncPlaceCount(before, places.length);
    const needsSave = synced.state !== before || raw.schemaVersion !== CURRENT_SCHEMA_VERSION;
    if (!needsSave) {
      return { game: { state: before, version: raw.version }, events: [], isNewGame: false, syncedFromOtherDevice };
    }

    const saved = await deps.store.save(raw.version, synced.state);
    if (!saved.ok) continue;
    return { game: saved.game, events: synced.events, isNewGame: false, syncedFromOtherDevice };
  }
  throw new SyncError();
}

export type ActionOutcome =
  /** 행동이 반영되고 저장됨. 잠자기였으면 summary에 밤사이 요약 */
  | { kind: "done"; game: StoredGame; events: GameEvent[]; summary: NightSummary | null }
  /** 규칙상 할 수 없는 행동. 상태는 그대로 */
  | { kind: "invalid"; error: ActionError; game: StoredGame }
  /** 다른 기기가 먼저 저장함. 이 행동은 반영되지 않았고 game은 최신 상태다. 사용자에게 알려야 한다. */
  | { kind: "conflict"; game: StoredGame; events: GameEvent[] };

/** 행동 하나(잠자기 포함)를 적용하고 저장한다. 밤 횟수는 지금 시각의 현실 하루로 판정한다. */
export async function performAction(
  deps: SessionDeps,
  game: StoredGame,
  action: Action,
  places: readonly PlaceRef[],
  /** 임시: 하루 밤 횟수 제한을 안 센다 */
  unlimitedNights = false,
): Promise<ActionOutcome> {
  const realDay = unlimitedNights ? undefined : toRealDay(deps.now());
  const result = applyAction(game.state, action, { rng: deps.rng, luck: deps.rng, places, realDay });
  if (!result.ok) return { kind: "invalid", error: result.error, game };

  const saved = await deps.store.save(game.version, result.state);
  if (!saved.ok) {
    const latest = await openGame(deps, places);
    return { kind: "conflict", game: latest.game, events: latest.events };
  }
  const summary = action.type === "sleep" ? summarizeNight(game.state, result.state, result.events) : null;
  return { kind: "done", game: saved.game, events: result.events, summary };
}
