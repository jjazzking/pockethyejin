-- 플레이스홀더 시드: 장소 3개, 혜진 그림 (전신 normal 3장, sad 1장, 얼굴 default 1장)
-- 그림 파일은 앱에 들어 있다 (public/placeholders). 실제 그림·장소가 생기면 이 행들을 고치거나 지우면 된다.
-- 여러 번 실행해도 중복으로 들어가지 않는다.

insert into public.places (id, "order", name, date, image, episodes) values
  ('place-001', 1, '첫 번째 장소 (임시)', '2026-03-29', '/placeholders/place-1.svg',
   '{"1": "별 1개 에피소드 (임시)", "2": "별 2개 에피소드 (임시)", "3": "별 3개 에피소드 (임시)"}'),
  ('place-002', 2, '두 번째 장소 (임시)', null, '/placeholders/place-2.svg',
   '{"1": "별 1개 에피소드 (임시)", "2": "별 2개 에피소드 (임시)", "3": "별 3개 에피소드 (임시)"}'),
  ('place-003', 3, '세 번째 장소 (임시)', null, '/placeholders/place-3.svg',
   '{"1": "별 1개 에피소드 (임시)", "2": "별 2개 에피소드 (임시)", "3": "별 3개 에피소드 (임시)"}')
on conflict (id) do nothing;

insert into public.character_images (id, character, kind, tags, path, description) values
  ('00000000-0000-4000-8000-000000000001', 'hyejin', 'full', '{normal}', '/placeholders/hyejin-full-normal-1.svg', '임시 전신 (평상시 1)'),
  ('00000000-0000-4000-8000-000000000002', 'hyejin', 'full', '{normal}', '/placeholders/hyejin-full-normal-2.svg', '임시 전신 (평상시 2)'),
  ('00000000-0000-4000-8000-000000000003', 'hyejin', 'full', '{normal}', '/placeholders/hyejin-full-normal-3.svg', '임시 전신 (평상시 3)'),
  ('00000000-0000-4000-8000-000000000004', 'hyejin', 'full', '{sad}',    '/placeholders/hyejin-full-sad-1.svg',    '임시 전신 (시무룩)'),
  ('00000000-0000-4000-8000-000000000005', 'hyejin', 'face', '{default}', '/placeholders/hyejin-face-default.svg', '임시 얼굴 (기본)')
on conflict (id) do nothing;
