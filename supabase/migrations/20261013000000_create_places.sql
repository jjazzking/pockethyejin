-- 꿍진이 키우기: 데이트 장소 (기획서 6장)
--
-- 정우가 대시보드 Table Editor에서 행을 추가하면 재배포 없이 다음 접속부터 반영된다.
-- order 순으로 레벨에 따라 해금되고, 혜진의 최대 레벨 = 이 테이블의 행 수.
--
-- image: places Storage 버킷 안의 파일 경로 (예: "seongsu-cafe.jpg").
--        "/"로 시작하면 앱에 들어 있는 파일 (플레이스홀더용).
-- episodes: {"1": "별 1개 에피소드", "2": "...", "3": "..."}

create table public.places (
  id         text primary key,
  "order"    integer not null unique,
  name       text not null,
  date       date,
  image      text,
  episodes   jsonb not null default '{"1": "", "2": "", "3": ""}'::jsonb
             check (jsonb_typeof(episodes) = 'object'),
  created_at timestamptz not null default now()
);

comment on table public.places is '데이트 장소. order 순으로 해금. 대시보드에서 행을 추가하면 바로 반영된다.';
comment on column public.places."order" is '해금 순서 (1, 2, 3, ...). 겹치면 안 된다.';
comment on column public.places.image is 'places 버킷 안의 사진 경로 (예: seongsu-cafe.jpg)';
comment on column public.places.episodes is '{"1": "별 1개 에피소드", "2": "별 2개", "3": "별 3개"}';

-- 로그인한 사용자는 읽기만. 쓰기 정책이 없으므로 쓰기는 대시보드(관리자)에서만 된다.
alter table public.places enable row level security;

create policy "로그인 사용자 장소 읽기" on public.places
  for select to authenticated
  using (true);

-- 장소 사진 버킷 (비공개: 로그인한 사용자만 서명 URL로 본다)
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('places', 'places', false, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "로그인 사용자 장소 사진 읽기" on storage.objects
  for select to authenticated
  using (bucket_id = 'places');
