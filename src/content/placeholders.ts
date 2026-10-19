import type { Place } from "./types";

/*
 * 로그인 없이 해보는 체험 모드에서 쓰는 임시 장소.
 * supabase/migrations/20261013000200_seed_placeholders.sql 의 시드와 같은 내용이다.
 * (혜진 그림은 characterArt.ts)
 */

const episodes = { 1: "별 1개 에피소드 (임시)", 2: "별 2개 에피소드 (임시)", 3: "별 3개 에피소드 (임시)" };

export const PLACEHOLDER_PLACES: Place[] = [
  { id: "place-001", order: 1, name: "첫 번째 장소 (임시)", date: "2026-03-29", image: "/placeholders/place-1.svg", photos: ["/placeholders/place-1.svg"], episodes },
  { id: "place-002", order: 2, name: "두 번째 장소 (임시)", date: null, image: "/placeholders/place-2.svg", photos: ["/placeholders/place-2.svg"], episodes },
  { id: "place-003", order: 3, name: "세 번째 장소 (임시)", date: null, image: "/placeholders/place-3.svg", photos: ["/placeholders/place-3.svg"], episodes },
];
