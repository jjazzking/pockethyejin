-- 혜진 그림 시드 (scripts/art/build_art.py 로 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것)
-- 그림 파일은 앱에 들어 있다 (public/characters). 임시 혜진 그림 행은 지운다.
-- 여러 번 실행해도 중복으로 들어가지 않는다.

delete from public.character_images where path like '/placeholders/%';

insert into public.character_images (id, character, kind, tags, path, description) values
  ('00000000-0000-4000-8000-000000000101', 'hyejin', 'full', '{normal}', '/characters/hyejin/full-turn-front.webp', '정면 기본 자세'),
  ('00000000-0000-4000-8000-000000000102', 'hyejin', 'full', '{normal}', '/characters/hyejin/full-cards.webp', '카드 들고 음흉한 웃음'),
  ('00000000-0000-4000-8000-000000000103', 'hyejin', 'full', '{normal}', '/characters/hyejin/full-dance.webp', '신나는 춤'),
  ('00000000-0000-4000-8000-000000000104', 'hyejin', 'full', '{normal}', '/characters/hyejin/full-sunglasses.webp', '선글라스'),
  ('00000000-0000-4000-8000-000000000105', 'hyejin', 'full', '{normal}', '/characters/hyejin/full-taco.webp', '타코 냠냠'),
  ('00000000-0000-4000-8000-000000000106', 'hyejin', 'full', '{normal}', '/characters/hyejin/full-hands-hips.webp', '허리에 손'),
  ('00000000-0000-4000-8000-000000000107', 'hyejin', 'full', '{normal}', '/characters/hyejin/full-bucket.webp', '양동이 쓰고 갸우뚱'),
  ('00000000-0000-4000-8000-000000000108', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-awkward.webp', '머쓱한 웃음 (땀방울)'),
  ('00000000-0000-4000-8000-000000000109', 'hyejin', 'full', '{sad,danger}', '/characters/hyejin/full-bump-cry.webp', '혹 나서 울먹'),
  ('00000000-0000-4000-8000-000000000110', 'hyejin', 'face', '{default}', '/characters/hyejin/face-default.webp', '기본 얼굴'),
  ('00000000-0000-4000-8000-000000000111', 'hyejin', 'face', '{eat_mochi}', '/characters/hyejin/face-mochi.webp', '찹쌀떡 받고 신남'),
  ('00000000-0000-4000-8000-000000000112', 'hyejin', 'face', '{eat_half}', '/characters/hyejin/face-full-belly.webp', '배 두드리며 배부름'),
  ('00000000-0000-4000-8000-000000000113', 'hyejin', 'face', '{buldak_craving}', '/characters/hyejin/face-pleading.webp', '애원하는 눈빛'),
  ('00000000-0000-4000-8000-000000000114', 'hyejin', 'face', '{buldak_eat}', '/characters/hyejin/face-buldak.webp', '불닭 먹기'),
  ('00000000-0000-4000-8000-000000000115', 'hyejin', 'face', '{level_up}', '/characters/hyejin/face-very-happy.webp', '아주 행복'),
  ('00000000-0000-4000-8000-000000000116', 'hyejin', 'face', '{level_up}', '/characters/hyejin/face-balloon.webp', '보라 풍선'),
  ('00000000-0000-4000-8000-000000000117', 'hyejin', 'face', '{warning}', '/characters/hyejin/face-sulking.webp', '볼 빵빵 삐짐'),
  ('00000000-0000-4000-8000-000000000118', 'hyejin', 'face', '{warning}', '/characters/hyejin/face-suspicious.webp', '의심의 눈초리'),
  ('00000000-0000-4000-8000-000000000119', 'hyejin', 'face', '{countdown}', '/characters/hyejin/face-angry.webp', '화남'),
  ('00000000-0000-4000-8000-000000000120', 'hyejin', 'face', '{countdown}', '/characters/hyejin/face-arms-up.webp', '벌서기'),
  ('00000000-0000-4000-8000-000000000121', 'hyejin', 'face', '{jeongwoo_block}', '/characters/hyejin/face-accuse.webp', '손가락질'),
  ('00000000-0000-4000-8000-000000000122', 'hyejin', 'face', '{play_together}', '/characters/hyejin/face-kazoo.webp', '카주 불기'),
  ('00000000-0000-4000-8000-000000000123', 'hyejin', 'face', '{play_together}', '/characters/hyejin/face-singing.webp', '노래하기'),
  ('00000000-0000-4000-8000-000000000124', 'hyejin', 'face', '{play_together}', '/characters/hyejin/face-puppy.webp', '강아지 껴안기'),
  ('00000000-0000-4000-8000-000000000125', 'hyejin', 'face', '{date_1star}', '/characters/hyejin/face-clueless.webp', '멍한 얼굴'),
  ('00000000-0000-4000-8000-000000000126', 'hyejin', 'face', '{date_2star}', '/characters/hyejin/face-wink.webp', '윙크 브이'),
  ('00000000-0000-4000-8000-000000000127', 'hyejin', 'face', '{date_2star}', '/characters/hyejin/face-playful.webp', '장난스러운 얼굴'),
  ('00000000-0000-4000-8000-000000000128', 'hyejin', 'face', '{date_3star}', '/characters/hyejin/face-kiss.webp', '뽀뽀 직전'),
  ('00000000-0000-4000-8000-000000000129', 'hyejin', 'face', '{date_3star}', '/characters/hyejin/face-shy.webp', '수줍은 홍조'),
  ('00000000-0000-4000-8000-000000000130', 'hyejin', 'face', '{new_place}', '/characters/hyejin/face-surprise.webp', '깜짝 놀람'),
  ('00000000-0000-4000-8000-000000000131', 'hyejin', 'face', '{new_place}', '/characters/hyejin/face-skating.webp', '스케이트'),
  ('00000000-0000-4000-8000-000000000132', 'hyejin', 'face', '{away_summary}', '/characters/hyejin/face-sleepy.webp', '졸려서 눈 비비기'),
  ('00000000-0000-4000-8000-000000000133', 'hyejin', 'face', '{away_summary}', '/characters/hyejin/face-working.webp', '노트북으로 공부 중')
on conflict (id) do nothing;
