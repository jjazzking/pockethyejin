import type { StoryEventId } from "@/game/types";

/**
 * 이벤트 탭(도감) 그림. 그림은 public/events/<id>.webp.
 * null이면 이모지 자리로 보여준다.
 */
export const EVENT_ART: Record<StoryEventId, string | null> = {
  bulldak: "/events/bulldak.webp",
  poker: "/events/poker.webp",
  friends: "/events/friends.webp",
  snack: "/events/snack.webp",
  sulk: "/events/sulk.webp",
  promoted: "/events/promoted.webp",
  block: "/events/block.webp",
  raid: "/events/raid.webp",
};
