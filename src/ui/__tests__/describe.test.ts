import { describe, expect, it } from "vitest";
import { makeState, MONDAY, sequence } from "@/game/__tests__/helpers";
import { settle } from "@/game/day";
import { summarizeAway } from "@/game/summary";
import type { GameEvent } from "@/game/types";
import { describeEvents } from "../describe";

const opts = { summary: null, places: [] };

describe("이벤트 → 팝업·토스트", () => {
  it("정우 막기는 전용 연출", () => {
    expect(describeEvents([{ type: "jungwooBlocked" }], opts).popups).toEqual([{ kind: "block", faceTag: "jeongwoo_block" }]);
  });

  it("거절은 삐짐 팝업, 일은 토스트", () => {
    const d = describeEvents([{ type: "waitingRejected" }, { type: "worked", income: 30_000 }], opts);
    expect(d.popups[0]).toMatchObject({ kind: "card", title: "정우가 삐져서 방에 들어갔다…" });
    expect(d.toasts).toEqual(["정우가 출근해서 3만 원 벌어왔다 💼"]);
  });

  it("데이트 결과는 장소 에피소드와 함께", () => {
    const place = { id: "p1", order: 1, name: "카페", date: null, image: null, episodes: { 1: "a", 2: "b", 3: "c" } };
    const d = describeEvents([{ type: "dated", placeId: "p1", stars: 3, newBest: true, firstVisit: true }], { summary: null, places: [place] });
    expect(d.popups).toEqual([{ kind: "date", place, stars: 3, newBest: true, firstVisit: true, faceTag: "date_3star" }]);
  });

  it("모든 이벤트 종류를 처리한다 (빠진 종류가 있으면 타입 오류)", () => {
    const all: GameEvent[] = [
      { type: "worked", income: 1 },
      { type: "promoted", rank: 2 },
      { type: "waitingDone", quantity: 1, cost: 1 },
      { type: "waitingRejected" },
      { type: "playedAlone" },
      { type: "playedTogether" },
      { type: "bulldakResolved" },
      { type: "dated", placeId: "x", stars: 1, newBest: false, firstVisit: false },
      { type: "fed", count: 1 },
      { type: "leveledUp", level: 2, cost: 10 },
      { type: "warningStarted" },
      { type: "warningEnded" },
      { type: "countdownStarted", turnsLeft: 3 },
      { type: "countdownTicked", turnsLeft: 2 },
      { type: "countdownCancelled" },
      { type: "jungwooBlocked" },
      { type: "halfEaten", eaten: 1, recovered: 10 },
      { type: "bulldakCraving", date: MONDAY },
      { type: "newPlacesAdded", count: 1, levelCapRaised: true },
    ];
    const d = describeEvents(all, opts);
    expect(d.popups.length + d.toasts.length).toBe(all.length);
  });
});

describe("밀린 날 정산", () => {
  it("정산 이벤트는 요약 하나로 묶고, 오늘 아침 불닭과 새 추억은 따로 알린다", () => {
    const before = makeState({ hyejin: { happiness: 40 } }, MONDAY);
    // 화 불닭(놓침), 수 불닭(오늘)
    const { state, events } = settle(before, "2026-10-14", sequence(0, 0));
    const summary = summarizeAway(before, state, events);
    const all: GameEvent[] = [...events, { type: "newPlacesAdded", count: 1, levelCapRaised: false }];
    const d = describeEvents(all, { summary, places: [] });
    expect(d.popups.map((p) => p.kind)).toEqual(["summary", "card", "card"]);
    expect(d.popups[1]).toMatchObject({ title: "혜진이가 불닭이 땡긴다!" });
    expect(d.popups[2]).toMatchObject({ title: "새 추억이 추가됐어요!" });
    // 정산 중 경고·카운트다운은 요약에 담기므로 따로 띄우지 않는다
    expect(d.popups.some((p) => p.kind === "card" && p.title.includes("냉동실"))).toBe(false);
  });
});
