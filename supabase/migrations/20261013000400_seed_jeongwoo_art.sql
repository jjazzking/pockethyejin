-- 정우 그림 시드 (+ 혜진·정우 함께 있는 팝업 그림) (scripts/art/build_art.py 로 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것)
-- 그림 파일은 앱에 들어 있다 (public/characters).
-- 여러 번 실행해도 중복으로 들어가지 않는다.

insert into public.character_images (id, character, kind, tags, path, description) values
  ('00000000-0000-4000-8000-000000000134', 'jeongwoo', 'full', '{idle}', '/characters/jeongwoo/full-music.webp', '헤드폰 끼고 음악 감상'),
  ('00000000-0000-4000-8000-000000000135', 'jeongwoo', 'full', '{work}', '/characters/jeongwoo/full-laptop.webp', '노트북으로 일하기'),
  ('00000000-0000-4000-8000-000000000136', 'jeongwoo', 'full', '{waiting}', '/characters/jeongwoo/full-shopping.webp', '한정선 사서 돌아오기'),
  ('00000000-0000-4000-8000-000000000137', 'jeongwoo', 'full', '{play_dj}', '/characters/jeongwoo/full-dj.webp', '디제잉'),
  ('00000000-0000-4000-8000-000000000138', 'jeongwoo', 'full', '{play_game}', '/characters/jeongwoo/full-gaming.webp', '컴퓨터 게임'),
  ('00000000-0000-4000-8000-000000000139', 'jeongwoo', 'full', '{play_game}', '/characters/jeongwoo/full-poker.webp', '포커 지고 넋 나감'),
  ('00000000-0000-4000-8000-000000000140', 'jeongwoo', 'full', '{run}', '/characters/jeongwoo/full-running.webp', '다급하게 달려가기'),
  ('00000000-0000-4000-8000-000000000141', 'jeongwoo', 'full', '{sulk}', '/characters/jeongwoo/full-arms-crossed.webp', '팔짱 끼고 삐짐'),
  ('00000000-0000-4000-8000-000000000142', 'jeongwoo', 'face', '{happy}', '/characters/jeongwoo/face-happy.webp', '활짝 웃음'),
  ('00000000-0000-4000-8000-000000000143', 'jeongwoo', 'face', '{sulk}', '/characters/jeongwoo/face-sulking.webp', '볼 부풀리고 삐짐'),
  ('00000000-0000-4000-8000-000000000144', 'jeongwoo', 'face', '{sulk}', '/characters/jeongwoo/face-mock-angry.webp', '팔짱 끼고 흥'),
  ('00000000-0000-4000-8000-000000000145', 'hyejin', 'face', '{play_together}', '/characters/hyejin/face-with-jeongwoo.webp', '정우가 혜진 볼에 볼 맞대기')
on conflict (id) do nothing;
