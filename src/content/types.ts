import type { Stars } from "@/game/types";

/** Supabase places 테이블 한 행 (기획서 6장 형식) */
export interface Place {
  id: string;
  /** 해금 순서. 레벨 N이면 order 순으로 N번째 장소까지 열린다. */
  order: number;
  name: string;
  /** 실제로 다녀온 날짜 "YYYY-MM-DD" (없을 수 있음) */
  date: string | null;
  /** 사진 경로. Storage places 버킷 안의 경로, 또는 앱에 들어 있는 "/..." 경로 */
  image: string | null;
  /** 별 개수별 에피소드 텍스트 */
  episodes: Record<Stars, string>;
}

export type CharacterName = "hyejin" | "jeongwoo";
export type ImageKind = "full" | "face";

/** 전신 이미지 풀 태그 */
export const FULL_BODY_POOLS = ["normal", "sad", "danger"] as const;
export type FullBodyPool = (typeof FULL_BODY_POOLS)[number];

/** 얼굴 이미지 이벤트 태그 (기획서 9장) */
export const FACE_EVENT_TAGS = [
  "eat_mochi",
  "level_up",
  "warning",
  "countdown",
  "jeongwoo_block",
  "eat_half",
  "buldak_craving",
  "buldak_eat",
  "play_together",
  "date_1star",
  "date_2star",
  "date_3star",
  "new_place",
  "away_summary",
] as const;
export type FaceEventTag = (typeof FACE_EVENT_TAGS)[number];
/** 이벤트에 맞는 얼굴이 없을 때 쓰는 태그 */
export const DEFAULT_FACE_TAG = "default";

/** Supabase character_images 테이블 한 행 */
export interface CharacterImage {
  id: string;
  character: CharacterName;
  kind: ImageKind;
  tags: string[];
  /** Storage characters 버킷 안의 경로, 또는 앱에 들어 있는 "/..." 경로 */
  path: string;
  description: string | null;
}
