import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameState } from "@/game/types";
import { CURRENT_SCHEMA_VERSION } from "./schema";
import type { GameStore, RawStoredGame, SaveResult } from "./store";

const TABLE = "game_states";
/** Postgres unique_violation */
const UNIQUE_VIOLATION = "23505";

interface Row {
  state: unknown;
  version: number;
  schema_version: number;
}

function toRaw(row: Row): RawStoredGame {
  return { state: row.state, version: row.version, schemaVersion: row.schema_version };
}

/** Supabase game_states 테이블 저장소 (supabase/migrations 참고). RLS로 본인 행만 접근된다. */
export function createSupabaseGameStore(client: SupabaseClient, userId: string): GameStore {
  return {
    async load() {
      const { data, error } = await client
        .from(TABLE)
        .select("state, version, schema_version")
        .eq("user_id", userId)
        .maybeSingle<Row>();
      if (error) throw error;
      return data ? toRaw(data) : null;
    },

    async create(state: GameState): Promise<SaveResult> {
      const { data, error } = await client
        .from(TABLE)
        .insert({ user_id: userId, state, version: 1, schema_version: CURRENT_SCHEMA_VERSION })
        .select("version")
        .single<{ version: number }>();
      if (error) {
        if (error.code === UNIQUE_VIOLATION) return { ok: false, reason: "conflict" };
        throw error;
      }
      return { ok: true, game: { state, version: data.version } };
    },

    async save(expectedVersion: number, state: GameState): Promise<SaveResult> {
      // WHERE version = expectedVersion 조건이 붙은 단일 UPDATE라 원자적이다.
      // 다른 기기가 먼저 저장했으면 일치하는 행이 없어 0행이 갱신된다.
      const { data, error } = await client
        .from(TABLE)
        .update({ state, version: expectedVersion + 1, schema_version: CURRENT_SCHEMA_VERSION })
        .eq("user_id", userId)
        .eq("version", expectedVersion)
        .select("version")
        .maybeSingle<{ version: number }>();
      if (error) throw error;
      if (!data) return { ok: false, reason: "conflict" };
      return { ok: true, game: { state, version: data.version } };
    },
  };
}
