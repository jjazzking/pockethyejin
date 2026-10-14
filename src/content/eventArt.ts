import type { StoryEventId } from "@/game/types";

/**
 * 이벤트 탭(도감) 그림. 그림이 생기면 public/events/<id>.webp 로 넣고 여기 경로를 채운다.
 * null이면 이모지 자리로 보여준다.
 */
export const EVENT_ART: Record<StoryEventId, string | null> = {
  bulldak: null,
  poker: null,
  friends: null,
  snack: null,
  sulk: null,
  promoted: null,
  block: null,
  raid: null,
};
