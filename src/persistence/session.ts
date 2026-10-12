import { toGameDate } from "@/game/date";
import { createInitialState, settle } from "@/game/day";
import { applyAction } from "@/game/engine";
import { summarizeAway, type AwaySummary } from "@/game/summary";
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
  /** 정산 중 일어난 일 (정산할 게 없었으면 빈 배열) */
  events: GameEvent[];
  /** "자리를 비운 동안" 요약. 날짜가 지나지 않았으면 null */
  summary: AwaySummary | null;
  isNewGame: boolean;
  /** 저장하려는 사이 다른 기기가 먼저 저장해서 최신 상태를 다시 불러왔는지 */
  syncedFromOtherDevice: boolean;
}

/**
 * 앱을 열 때 호출한다: 상태를 불러와 구조 버전을 맞추고, 밀린 날짜를 정산해서 저장한다.
 *
 * 두 기기가 동시에 열어도 정산은 한 번만 반영된다. 먼저 저장한 기기가 이기고,
 * 늦은 기기는 버전 충돌로 자기 정산 결과를 버린 뒤 최신 상태를 다시 불러온다.
 * 최신 상태는 이미 오늘로 정산돼 있으므로 다시 정산되지 않는다.
 */
export async function openGame(deps: SessionDeps): Promise<OpenResult> {
  const today = toGameDate(deps.now());
  for (let attempt = 0; attempt < MAX_SYNC_ATTEMPTS; attempt++) {
    const syncedFromOtherDevice = attempt > 0;
    const raw = await deps.store.load();

    if (!raw) {
      const initial = createInitialState(today, deps.rng);
      const created = await deps.store.create(initial.state);
      if (!created.ok) continue;
      return { game: created.game, events: initial.events, summary: null, isNewGame: true, syncedFromOtherDevice };
    }

    const before = migrateState(raw.schemaVersion, raw.state);
    const settled = settle(before, today, deps.rng);
    const needsSave = settled.events.length > 0 || raw.schemaVersion !== CURRENT_SCHEMA_VERSION;
    if (!needsSave) {
      return {
        game: { state: before, version: raw.version },
        events: [],
        summary: null,
        isNewGame: false,
        syncedFromOtherDevice,
      };
    }

    const saved = await deps.store.save(raw.version, settled.state);
    if (!saved.ok) continue;
    return {
      game: saved.game,
      events: settled.events,
      summary: summarizeAway(before, settled.state, settled.events),
      isNewGame: false,
      syncedFromOtherDevice,
    };
  }
  throw new SyncError();
}

export type ActionOutcome =
  /** 행동이 반영되고 저장됨 */
  | { kind: "done"; game: StoredGame; events: GameEvent[]; summary: AwaySummary | null }
  /** 규칙상 할 수 없는 행동. (그사이 날짜가 바뀌었으면 정산만 저장됨) */
  | { kind: "invalid"; error: ActionError; game: StoredGame; events: GameEvent[]; summary: AwaySummary | null }
  /** 다른 기기가 먼저 저장함. 이 행동은 반영되지 않았고 game은 최신 상태다. 사용자에게 알려야 한다. */
  | { kind: "conflict"; game: StoredGame; events: GameEvent[]; summary: AwaySummary | null };

/**
 * 행동 하나를 적용하고 저장한다.
 * 앱을 켜둔 채로 아침 6시가 지났으면 먼저 그날까지 정산한다 (켜둔 날은 접속한 날로 친다).
 */
export async function performAction(
  deps: SessionDeps,
  game: StoredGame,
  action: Action,
  places: readonly PlaceRef[],
): Promise<ActionOutcome> {
  const settled = settle(game.state, toGameDate(deps.now()), deps.rng);
  const summary = summarizeAway(game.state, settled.state, settled.events);
  const result = applyAction(settled.state, action, { rng: deps.rng, places });

  if (!result.ok && settled.events.length === 0) {
    return { kind: "invalid", error: result.error, game, events: [], summary: null };
  }

  const next = result.ok ? result.state : settled.state;
  const saved = await deps.store.save(game.version, next);
  if (!saved.ok) {
    const latest = await openGame(deps);
    return { kind: "conflict", game: latest.game, events: latest.events, summary: latest.summary };
  }

  if (!result.ok) {
    return { kind: "invalid", error: result.error, game: saved.game, events: settled.events, summary };
  }
  return { kind: "done", game: saved.game, events: [...settled.events, ...result.events], summary };
}
