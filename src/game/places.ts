import type { GameEvent, GameState } from "./types";

/** 만렙인지 (최대 레벨 = 등록된 장소 수) */
export function isMaxLevel(state: GameState, placeCount: number): boolean {
  return state.hyejin.level >= placeCount;
}

/**
 * 등록된 장소 수를 상태에 기록한다. 마지막으로 확인한 수보다 늘었으면 "새 추억" 이벤트.
 * 입력 상태는 바꾸지 않는다. 변화가 없으면 같은 상태 객체를 돌려준다.
 */
export function syncPlaceCount(
  state: GameState,
  placeCount: number,
): { state: GameState; events: GameEvent[] } {
  const known = state.knownPlaceCount;
  if (known === placeCount) return { state, events: [] };

  const events: GameEvent[] = [];
  if (known !== null && placeCount > known) {
    events.push({
      type: "newPlacesAdded",
      count: placeCount - known,
      levelCapRaised: state.hyejin.level >= known,
    });
  }
  return { state: { ...state, knownPlaceCount: placeCount }, events };
}
