import type { GameEvent, GameState, StoryEventId } from "./types";

/** 이벤트 탭에 보여줄 순서 */
export const STORY_EVENTS: readonly StoryEventId[] = [
  "bulldak",
  "poker",
  "friends",
  "snack",
  "rain",
  "karaoke",
  "dessert",
  "newgame",
  "homebody",
  "parcel",
  "yeppi",
  "cold",
  "payday",
  "anniversary",
  "sulk",
  "promoted",
  "block",
  "raid",
];

function storyId(e: GameEvent): StoryEventId | null {
  switch (e.type) {
    case "socialEvent":
      return e.event;
    case "bulldakCraving":
      return "bulldak";
    case "waitingRejected":
      return "sulk";
    case "promoted":
      return "promoted";
    case "jungwooBlocked":
      return "block";
    case "halfEaten":
      return "raid";
    case "hyejinSick":
      return "cold";
    default:
      return null;
  }
}

/** 이번에 처음 만난 이벤트를 도감에 남긴다 */
export function markSeen(s: GameState, events: readonly GameEvent[]): void {
  for (const e of events) {
    const id = storyId(e);
    if (id && !s.seenEvents.includes(id)) s.seenEvents.push(id);
  }
}
