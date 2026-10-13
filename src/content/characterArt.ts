import type { CharacterImage } from "./types";

/*
 * 앱에 들어 있는 혜진 그림 (public/characters/hyejin).
 * scripts/art/build_art.py 가 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것.
 * supabase/migrations/20261013000300_seed_hyejin_art.sql 의 시드와 같은 내용이다.
 */
export const HYEJIN_ART: CharacterImage[] = [
  { id: "00000000-0000-4000-8000-000000000101", character: "hyejin", kind: "full", tags: ["normal"], path: "/characters/hyejin/full-turn-front.webp", description: "정면 기본 자세" },
  { id: "00000000-0000-4000-8000-000000000102", character: "hyejin", kind: "full", tags: ["normal"], path: "/characters/hyejin/full-cards.webp", description: "카드 들고 음흉한 웃음" },
  { id: "00000000-0000-4000-8000-000000000103", character: "hyejin", kind: "full", tags: ["normal"], path: "/characters/hyejin/full-dance.webp", description: "신나는 춤" },
  { id: "00000000-0000-4000-8000-000000000104", character: "hyejin", kind: "full", tags: ["normal"], path: "/characters/hyejin/full-sunglasses.webp", description: "선글라스" },
  { id: "00000000-0000-4000-8000-000000000105", character: "hyejin", kind: "full", tags: ["normal"], path: "/characters/hyejin/full-taco.webp", description: "타코 냠냠" },
  { id: "00000000-0000-4000-8000-000000000106", character: "hyejin", kind: "full", tags: ["normal"], path: "/characters/hyejin/full-hands-hips.webp", description: "허리에 손" },
  { id: "00000000-0000-4000-8000-000000000107", character: "hyejin", kind: "full", tags: ["normal"], path: "/characters/hyejin/full-bucket.webp", description: "양동이 쓰고 갸우뚱" },
  { id: "00000000-0000-4000-8000-000000000108", character: "hyejin", kind: "full", tags: ["sad"], path: "/characters/hyejin/full-awkward.webp", description: "머쓱한 웃음 (땀방울)" },
  { id: "00000000-0000-4000-8000-000000000109", character: "hyejin", kind: "full", tags: ["sad", "danger"], path: "/characters/hyejin/full-bump-cry.webp", description: "혹 나서 울먹" },
  { id: "00000000-0000-4000-8000-000000000110", character: "hyejin", kind: "face", tags: ["default"], path: "/characters/hyejin/face-default.webp", description: "기본 얼굴" },
  { id: "00000000-0000-4000-8000-000000000111", character: "hyejin", kind: "face", tags: ["eat_mochi"], path: "/characters/hyejin/face-mochi.webp", description: "찹쌀떡 받고 신남" },
  { id: "00000000-0000-4000-8000-000000000112", character: "hyejin", kind: "face", tags: ["eat_half"], path: "/characters/hyejin/face-full-belly.webp", description: "배 두드리며 배부름" },
  { id: "00000000-0000-4000-8000-000000000113", character: "hyejin", kind: "face", tags: ["buldak_craving"], path: "/characters/hyejin/face-pleading.webp", description: "애원하는 눈빛" },
  { id: "00000000-0000-4000-8000-000000000114", character: "hyejin", kind: "face", tags: ["buldak_eat"], path: "/characters/hyejin/face-buldak.webp", description: "불닭 먹기" },
  { id: "00000000-0000-4000-8000-000000000115", character: "hyejin", kind: "face", tags: ["level_up"], path: "/characters/hyejin/face-very-happy.webp", description: "아주 행복" },
  { id: "00000000-0000-4000-8000-000000000116", character: "hyejin", kind: "face", tags: ["level_up"], path: "/characters/hyejin/face-balloon.webp", description: "보라 풍선" },
  { id: "00000000-0000-4000-8000-000000000117", character: "hyejin", kind: "face", tags: ["warning"], path: "/characters/hyejin/face-sulking.webp", description: "볼 빵빵 삐짐" },
  { id: "00000000-0000-4000-8000-000000000118", character: "hyejin", kind: "face", tags: ["warning"], path: "/characters/hyejin/face-suspicious.webp", description: "의심의 눈초리" },
  { id: "00000000-0000-4000-8000-000000000119", character: "hyejin", kind: "face", tags: ["countdown"], path: "/characters/hyejin/face-angry.webp", description: "화남" },
  { id: "00000000-0000-4000-8000-000000000120", character: "hyejin", kind: "face", tags: ["countdown"], path: "/characters/hyejin/face-arms-up.webp", description: "벌서기" },
  { id: "00000000-0000-4000-8000-000000000121", character: "hyejin", kind: "face", tags: ["jeongwoo_block"], path: "/characters/hyejin/face-accuse.webp", description: "손가락질" },
  { id: "00000000-0000-4000-8000-000000000122", character: "hyejin", kind: "face", tags: ["play_together"], path: "/characters/hyejin/face-kazoo.webp", description: "카주 불기" },
  { id: "00000000-0000-4000-8000-000000000123", character: "hyejin", kind: "face", tags: ["play_together"], path: "/characters/hyejin/face-singing.webp", description: "노래하기" },
  { id: "00000000-0000-4000-8000-000000000124", character: "hyejin", kind: "face", tags: ["play_together"], path: "/characters/hyejin/face-puppy.webp", description: "강아지 껴안기" },
  { id: "00000000-0000-4000-8000-000000000125", character: "hyejin", kind: "face", tags: ["date_1star"], path: "/characters/hyejin/face-clueless.webp", description: "멍한 얼굴" },
  { id: "00000000-0000-4000-8000-000000000126", character: "hyejin", kind: "face", tags: ["date_2star"], path: "/characters/hyejin/face-wink.webp", description: "윙크 브이" },
  { id: "00000000-0000-4000-8000-000000000127", character: "hyejin", kind: "face", tags: ["date_2star"], path: "/characters/hyejin/face-playful.webp", description: "장난스러운 얼굴" },
  { id: "00000000-0000-4000-8000-000000000128", character: "hyejin", kind: "face", tags: ["date_3star"], path: "/characters/hyejin/face-kiss.webp", description: "뽀뽀 직전" },
  { id: "00000000-0000-4000-8000-000000000129", character: "hyejin", kind: "face", tags: ["date_3star"], path: "/characters/hyejin/face-shy.webp", description: "수줍은 홍조" },
  { id: "00000000-0000-4000-8000-000000000130", character: "hyejin", kind: "face", tags: ["new_place"], path: "/characters/hyejin/face-surprise.webp", description: "깜짝 놀람" },
  { id: "00000000-0000-4000-8000-000000000131", character: "hyejin", kind: "face", tags: ["new_place"], path: "/characters/hyejin/face-skating.webp", description: "스케이트" },
  { id: "00000000-0000-4000-8000-000000000132", character: "hyejin", kind: "face", tags: ["away_summary"], path: "/characters/hyejin/face-sleepy.webp", description: "졸려서 눈 비비기" },
  { id: "00000000-0000-4000-8000-000000000133", character: "hyejin", kind: "face", tags: ["away_summary"], path: "/characters/hyejin/face-working.webp", description: "노트북으로 공부 중" },
];
