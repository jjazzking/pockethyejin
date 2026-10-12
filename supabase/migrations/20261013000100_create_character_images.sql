-- 꿍진이 키우기: 캐릭터 이미지 (기획서 9장)
--
-- character: hyejin | jeongwoo
-- kind     : full(전신, 1024x1536 투명 PNG) | face(얼굴, 1024x1024 투명 PNG)
-- tags     : 전신은 풀 태그(normal, sad, danger), 얼굴은 이벤트 태그(eat_mochi, level_up, ..., default)
-- path     : characters Storage 버킷 안의 파일 경로 (예: "hyejin/full/smile.png").
--            "/"로 시작하면 앱에 들어 있는 파일 (플레이스홀더용).

create table public.character_images (
  id          uuid primary key default gen_random_uuid(),
  character   text not null check (character in ('hyejin', 'jeongwoo')),
  kind        text not null check (kind in ('full', 'face')),
  tags        text[] not null default '{}',
  path        text not null check (length(trim(path)) > 0),
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.character_images is '캐릭터 그림. 대시보드에서 행을 추가하면 바로 반영된다.';
comment on column public.character_images.tags is '전신: normal / sad / danger. 얼굴: 이벤트 태그 또는 default. 여러 개 가능.';
comment on column public.character_images.path is 'characters 버킷 안의 파일 경로 (예: hyejin/full/smile.png)';

-- 로그인한 사용자는 읽기만. 쓰기는 대시보드(관리자)에서만.
alter table public.character_images enable row level security;

create policy "로그인 사용자 캐릭터 이미지 읽기" on public.character_images
  for select to authenticated
  using (true);

-- 캐릭터 그림 버킷 (비공개: 로그인한 사용자만 서명 URL로 본다)
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('characters', 'characters', false, array['image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "로그인 사용자 캐릭터 그림 읽기" on storage.objects
  for select to authenticated
  using (bucket_id = 'characters');
