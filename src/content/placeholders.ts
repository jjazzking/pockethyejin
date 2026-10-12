import type { CharacterImage, Place } from "./types";

/*
 * 로그인 없이 해보는 체험 모드에서 쓰는 임시 장소·그림.
 * supabase/migrations/20261013000200_seed_placeholders.sql 의 시드와 같은 내용이다.
 */

const episodes = { 1: "별 1개 에피소드 (임시)", 2: "별 2개 에피소드 (임시)", 3: "별 3개 에피소드 (임시)" };

export const PLACEHOLDER_PLACES: Place[] = [
  { id: "place-001", order: 1, name: "첫 번째 장소 (임시)", date: "2026-03-29", image: "/placeholders/place-1.svg", episodes },
  { id: "place-002", order: 2, name: "두 번째 장소 (임시)", date: null, image: "/placeholders/place-2.svg", episodes },
  { id: "place-003", order: 3, name: "세 번째 장소 (임시)", date: null, image: "/placeholders/place-3.svg", episodes },
];

const full = (n: string, tag: string, path: string, description: string): CharacterImage => ({
  id: `placeholder-${n}`,
  character: "hyejin",
  kind: "full",
  tags: [tag],
  path,
  description,
});

export const PLACEHOLDER_IMAGES: CharacterImage[] = [
  full("1", "normal", "/placeholders/hyejin-full-normal-1.svg", "임시 전신 (평상시 1)"),
  full("2", "normal", "/placeholders/hyejin-full-normal-2.svg", "임시 전신 (평상시 2)"),
  full("3", "normal", "/placeholders/hyejin-full-normal-3.svg", "임시 전신 (평상시 3)"),
  full("4", "sad", "/placeholders/hyejin-full-sad-1.svg", "임시 전신 (시무룩)"),
  {
    id: "placeholder-5",
    character: "hyejin",
    kind: "face",
    tags: ["default"],
    path: "/placeholders/hyejin-face-default.svg",
    description: "임시 얼굴 (기본)",
  },
];
