import type { GameState } from "@/game/types";
import { CURRENT_SCHEMA_VERSION } from "./schema";
import type { GameStore, RawStoredGame, SaveResult } from "./store";

/**
 * 브라우저 localStorage 저장소. 로그인 없이 해보는 체험 모드용.
 * 이 브라우저에만 저장되고 다른 기기와 이어지지 않는다.
 * 같은 브라우저의 여러 탭끼리는 버전 확인으로 덮어쓰기를 막는다.
 * localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 메모리에만 둔다.
 */
export class LocalGameStore implements GameStore {
  private fallback: RawStoredGame | null = null;

  constructor(private readonly key = "pockethyejin:trial-game") {}

  private read(): RawStoredGame | null {
    try {
      const text = window.localStorage.getItem(this.key);
      return text ? (JSON.parse(text) as RawStoredGame) : null;
    } catch {
      return this.fallback;
    }
  }

  private write(row: RawStoredGame): void {
    this.fallback = row;
    try {
      window.localStorage.setItem(this.key, JSON.stringify(row));
    } catch {
      // 메모리에만 남는다
    }
  }

  async load(): Promise<RawStoredGame | null> {
    return this.read();
  }

  async create(state: GameState): Promise<SaveResult> {
    if (this.read()) return { ok: false, reason: "conflict" };
    this.write({ state, version: 1, schemaVersion: CURRENT_SCHEMA_VERSION });
    return { ok: true, game: { state, version: 1 } };
  }

  async save(expectedVersion: number, state: GameState): Promise<SaveResult> {
    const row = this.read();
    if (!row || row.version !== expectedVersion) return { ok: false, reason: "conflict" };
    const version = expectedVersion + 1;
    this.write({ state, version, schemaVersion: CURRENT_SCHEMA_VERSION });
    return { ok: true, game: { state, version } };
  }

  /** 체험 기록 지우기 */
  reset(): void {
    this.fallback = null;
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      // 무시
    }
  }
}
