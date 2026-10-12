import { describe, expect, it } from "vitest";
import { applyAction } from "../engine";
import { isMaxLevel, syncPlaceCount } from "../places";
import { ctx, makeState } from "./helpers";

describe("새 추억 알림", () => {
  it("장소 수가 늘면 newPlacesAdded", () => {
    const s = makeState({ knownPlaceCount: 3, hyejin: { level: 2 } });
    const { state, events } = syncPlaceCount(s, 5);
    expect(state.knownPlaceCount).toBe(5);
    expect(events).toEqual([{ type: "newPlacesAdded", count: 2, levelCapRaised: false }]);
  });

  it("만렙이었으면 레벨 상한이 늘었다고 알려주고, 다시 레벨업할 수 있다", () => {
    const s = makeState({ knownPlaceCount: 3, hyejin: { level: 3, hanjeongseon: 100 } });
    expect(isMaxLevel(s, 3)).toBe(true);
    const { state, events } = syncPlaceCount(s, 4);
    expect(events).toEqual([{ type: "newPlacesAdded", count: 1, levelCapRaised: true }]);
    expect(isMaxLevel(state, 4)).toBe(false);
    expect(applyAction(state, { type: "levelUp" }, ctx(undefined, [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }])).ok).toBe(true);
  });

  it("그대로면 아무 일도 없고 같은 상태 객체", () => {
    const s = makeState({ knownPlaceCount: 3 });
    expect(syncPlaceCount(s, 3)).toEqual({ state: s, events: [] });
    expect(syncPlaceCount(s, 3).state).toBe(s);
  });

  it("처음 확인(null)이면 알림 없이 맞춘다", () => {
    const { state, events } = syncPlaceCount(makeState({ knownPlaceCount: null }), 3);
    expect(state.knownPlaceCount).toBe(3);
    expect(events).toEqual([]);
  });

  it("장소가 줄면 알림 없이 맞추고, 다시 늘면 알린다", () => {
    const fewer = syncPlaceCount(makeState({ knownPlaceCount: 3 }), 2);
    expect(fewer.events).toEqual([]);
    expect(syncPlaceCount(fewer.state, 3).events).toEqual([{ type: "newPlacesAdded", count: 1, levelCapRaised: false }]);
  });
});
