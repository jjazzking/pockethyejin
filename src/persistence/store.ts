import type { GameState } from "@/game/types";

/** 저장소에서 읽은 그대로의 행. state는 아직 현재 구조로 변환되지 않았다. */
export interface RawStoredGame {
  state: unknown;
  /** 동시 수정 방지용 버전. 저장할 때마다 1씩 오른다. */
  version: number;
  /** 상태 구조 버전 (schema.ts) */
  schemaVersion: number;
}

/** 현재 구조로 변환된 상태 + 그 상태를 읽어온 시점의 버전 */
export interface StoredGame {
  state: GameState;
  version: number;
}

export type SaveResult = { ok: true; game: StoredGame } | { ok: false; reason: "conflict" };

/**
 * 게임 상태 저장소. 사용자당 한 행.
 * 구현은 낙관적 동시성 제어를 지켜야 한다:
 * - create: 행이 이미 있으면 conflict
 * - save: 저장된 version이 expectedVersion과 다르면 아무것도 쓰지 않고 conflict,
 *         같으면 상태를 쓰고 version을 1 올린다 (한 번의 원자적 연산으로)
 */
export interface GameStore {
  load(): Promise<RawStoredGame | null>;
  create(state: GameState): Promise<SaveResult>;
  save(expectedVersion: number, state: GameState): Promise<SaveResult>;
}
