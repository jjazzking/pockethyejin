import type { GameState } from "@/game/types";
import { CURRENT_SCHEMA_VERSION } from "./schema";
import type { GameStore, RawStoredGame, SaveResult } from "./store";

/**
 * 메모리 저장소. 테스트와 Supabase 없이 띄우는 개발용.
 * 한 인스턴스를 여러 "기기"가 공유하면 같은 DB 행을 쓰는 것과 같다.
 */
export class MemoryGameStore implements GameStore {
  private row: RawStoredGame | null = null;

  constructor(initial?: RawStoredGame) {
    if (initial) this.row = structuredClone(initial);
  }

  async load(): Promise<RawStoredGame | null> {
    return this.row ? structuredClone(this.row) : null;
  }

  async create(state: GameState): Promise<SaveResult> {
    if (this.row) return { ok: false, reason: "conflict" };
    this.row = { state: structuredClone(state), version: 1, schemaVersion: CURRENT_SCHEMA_VERSION };
    return { ok: true, game: { state: structuredClone(state), version: 1 } };
  }

  async save(expectedVersion: number, state: GameState): Promise<SaveResult> {
    if (!this.row || this.row.version !== expectedVersion) return { ok: false, reason: "conflict" };
    const version = expectedVersion + 1;
    this.row = { state: structuredClone(state), version, schemaVersion: CURRENT_SCHEMA_VERSION };
    return { ok: true, game: { state: structuredClone(state), version } };
  }

  /** 테스트용: 저장된 행을 그대로 본다 */
  peek(): RawStoredGame | null {
    return this.row ? structuredClone(this.row) : null;
  }
}
