import type { GameState } from "@/game/types";

/**
 * 저장되는 GameState 구조의 버전. GameState 모양을 바꾸면 1 올리고
 * MIGRATIONS에 (이전 버전 → 다음 버전) 변환 함수를 추가한다.
 * 동시 수정 방지용 버전(game_states.version)과는 별개다.
 */
export const CURRENT_SCHEMA_VERSION = 2;

/** MIGRATIONS[n]: 구조 버전 n → n + 1 */
const MIGRATIONS: Record<number, (raw: unknown) => unknown> = {
  // v2: 새 장소 알림용 knownPlaceCount 추가. 기존 저장은 아직 확인 전(null)으로 두고 다음 접속 때 맞춘다.
  1: (raw) => ({ ...(raw as object), knownPlaceCount: null }),
};

/** 이 앱보다 새로운 구조로 저장된 상태 (다른 기기에서 새 버전 앱을 쓴 경우) */
export class NewerSchemaError extends Error {
  constructor(public readonly schemaVersion: number) {
    super(`저장된 상태 구조 버전 ${schemaVersion}이 앱이 아는 버전 ${CURRENT_SCHEMA_VERSION}보다 새롭습니다.`);
    this.name = "NewerSchemaError";
  }
}

/** 저장된 구조 버전의 상태를 현재 구조로 변환한다. */
export function migrateState(
  schemaVersion: number,
  raw: unknown,
  migrations: Record<number, (raw: unknown) => unknown> = MIGRATIONS,
  target: number = CURRENT_SCHEMA_VERSION,
): GameState {
  if (schemaVersion > target) throw new NewerSchemaError(schemaVersion);
  let value = raw;
  for (let v = schemaVersion; v < target; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`구조 버전 ${v} → ${v + 1} 마이그레이션이 없습니다.`);
    value = step(value);
  }
  return value as GameState;
}
