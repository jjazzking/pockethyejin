-- 시무룩·화남·위기 그림 시드 (혜진 전신 sad/danger, 정우 삐짐·눈치) (scripts/art/build_art.py 로 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것)
-- 그림 파일은 앱에 들어 있다 (public/characters).
-- 여러 번 실행해도 중복으로 들어가지 않는다.

insert into public.character_images (id, character, kind, tags, path, description) values
  ('00000000-0000-4000-8000-000000000154', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-rain.webp', '먹구름 아래 무릎 끌어안기'),
  ('00000000-0000-4000-8000-000000000155', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-kick.webp', '고개 숙이고 바닥 콕콕'),
  ('00000000-0000-4000-8000-000000000156', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-snack.webp', '빈 과자 봉지 들고 울먹'),
  ('00000000-0000-4000-8000-000000000157', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-blanket.webp', '담요 뒤집어쓰고 빼꼼'),
  ('00000000-0000-4000-8000-000000000158', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-sofa.webp', '소파에 축 늘어짐'),
  ('00000000-0000-4000-8000-000000000159', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-window.webp', '창밖 보며 한숨'),
  ('00000000-0000-4000-8000-000000000160', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-pillow.webp', '베개 끌어안고 삐죽'),
  ('00000000-0000-4000-8000-000000000161', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-sad-wet.webp', '비 맞고 터덜터덜'),
  ('00000000-0000-4000-8000-000000000162', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-angry-huff.webp', '팔짱 끼고 흥'),
  ('00000000-0000-4000-8000-000000000163', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-angry-stomp.webp', '발 쾅쾅 구르기'),
  ('00000000-0000-4000-8000-000000000164', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-angry-steam.webp', '머리에서 김 모락모락'),
  ('00000000-0000-4000-8000-000000000165', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-angry-pillow.webp', '쿠션 던지기 직전'),
  ('00000000-0000-4000-8000-000000000166', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-angry-point.webp', '손가락질하며 따지기'),
  ('00000000-0000-4000-8000-000000000167', 'hyejin', 'full', '{sad}', '/characters/hyejin/full-angry-glare.webp', '입 꾹 다물고 째려보기'),
  ('00000000-0000-4000-8000-000000000168', 'hyejin', 'full', '{danger}', '/characters/hyejin/full-danger-fridge.webp', '냉동실 열고 침 흘리기'),
  ('00000000-0000-4000-8000-000000000169', 'hyejin', 'full', '{danger}', '/characters/hyejin/full-danger-spoon.webp', '숟가락 들고 눈에 불'),
  ('00000000-0000-4000-8000-000000000170', 'hyejin', 'full', '{danger}', '/characters/hyejin/full-danger-cry.webp', '폭포수 눈물'),
  ('00000000-0000-4000-8000-000000000171', 'hyejin', 'full', '{danger}', '/characters/hyejin/full-danger-flail.webp', '드러누워 버둥버둥'),
  ('00000000-0000-4000-8000-000000000172', 'jeongwoo', 'full', '{sulk}', '/characters/jeongwoo/full-sulk-corner.webp', '구석에서 등 돌리고 삐짐'),
  ('00000000-0000-4000-8000-000000000173', 'jeongwoo', 'full', '{sulk}', '/characters/jeongwoo/full-sulk-blanket.webp', '헤드폰 끼고 이불 속으로'),
  ('00000000-0000-4000-8000-000000000174', 'jeongwoo', 'full', '{sulk}', '/characters/jeongwoo/full-sulk-door.webp', '문 뒤에서 빼꼼'),
  ('00000000-0000-4000-8000-000000000175', 'jeongwoo', 'full', '{waiting}', '/characters/jeongwoo/full-tired.webp', '웨이팅 끝에 녹초'),
  ('00000000-0000-4000-8000-000000000177', 'jeongwoo', 'full', '{apologize}', '/characters/jeongwoo/full-sorry-pray.webp', '두 손 싹싹 빌기'),
  ('00000000-0000-4000-8000-000000000178', 'jeongwoo', 'full', '{apologize}', '/characters/jeongwoo/full-sorry-mochi.webp', '찹쌀떡 공손히 바치기'),
  ('00000000-0000-4000-8000-000000000179', 'jeongwoo', 'full', '{apologize}', '/characters/jeongwoo/full-sorry-kneel.webp', '무릎 꿇고 반성'),
  ('00000000-0000-4000-8000-000000000180', 'hyejin', 'face', '{warning}', '/characters/hyejin/face-massage.webp', '삐진 혜진 어깨 주물러 주는 정우')
on conflict (id) do nothing;
