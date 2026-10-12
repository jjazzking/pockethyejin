import { expect } from "vitest";
import { createInitialState } from "../day";
import { applyAction } from "../engine";
import type { Action, ActionContext, GameState, PlaceRef, Rng } from "../types";

export const MONDAY = "2026-10-12";
export const FRIDAY = "2026-10-16";
export const SATURDAY = "2026-10-17";
export const SUNDAY = "2026-10-18";
export const NEXT_MONDAY = "2026-10-19";

/** 항상 같은 값을 내는 난수 */
export const fixed = (value: number): Rng => () => value;
/** 확률 판정이 전부 실패하는 난수 (불닭 없음, 거절 없음) */
export const NEVER = fixed(0.999);
/** 확률 판정이 전부 성공하는 난수 */
export const ALWAYS = fixed(0);

/** 정해진 값을 순서대로 내는 난수 */
export function sequence(...values: number[]): Rng {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error("sequence rng exhausted");
    return values[i++];
  };
}

export const PLACES: PlaceRef[] = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];

export function ctx(rng: Rng = NEVER, places: PlaceRef[] = PLACES): ActionContext {
  return { rng, places };
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

/** 불닭 없는 새 게임 상태에 덮어쓰기 */
export function makeState(overrides: DeepPartial<GameState> = {}, date = MONDAY): GameState {
  const base = createInitialState(date, NEVER).state;
  return {
    ...base,
    ...overrides,
    jungwoo: { ...base.jungwoo, ...overrides.jungwoo },
    hyejin: { ...base.hyejin, ...overrides.hyejin },
  } as GameState;
}

/** 성공을 기대하고 결과를 꺼낸다 */
export function act(state: GameState, action: Action, c: ActionContext = ctx()) {
  const result = applyAction(state, action, c);
  if (!result.ok) throw new Error(`action failed: ${result.error}`);
  return result;
}

export function expectError(state: GameState, action: Action, error: string, c: ActionContext = ctx()) {
  const result = applyAction(state, action, c);
  expect(result).toEqual({ ok: false, error });
}
