-- 꿍진이 키우기: 게임 상태 (사용자당 한 행)
--
-- state          : GameState 전체 (src/game/types.ts). 마지막 정산 날짜는 state.lastSettledDate.
-- schema_version : state 구조 버전. 구조가 바뀌면 앱이 읽을 때 변환한다 (src/persistence/schema.ts).
-- version        : 동시 수정 방지용. 저장할 때마다 1씩 오르며, 앱은
--                  "UPDATE ... WHERE version = 내가 읽은 버전"으로 저장해서
--                  다른 기기가 먼저 저장했으면 0행 갱신 → 최신 상태를 다시 불러온다.

create table public.game_states (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  state          jsonb not null,
  schema_version integer not null check (schema_version >= 1),
  version        bigint not null default 1 check (version >= 1),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.game_states is '꿍진이 키우기 게임 상태. 사용자당 한 행.';
comment on column public.game_states.schema_version is 'state JSON 구조 버전 (앱 코드의 CURRENT_SCHEMA_VERSION)';
comment on column public.game_states.version is '낙관적 동시성 제어용 버전. 저장마다 정확히 1 증가.';

-- 버전은 저장마다 정확히 1씩만 오르게 강제하고, updated_at을 자동 갱신한다.
create function public.game_states_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.version <> old.version + 1 then
    raise exception 'game_states.version must increase by exactly 1 (old %, new %)', old.version, new.version
      using errcode = 'check_violation';
  end if;
  if new.user_id <> old.user_id then
    raise exception 'game_states.user_id cannot change' using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger game_states_before_update
  before update on public.game_states
  for each row execute function public.game_states_before_update();

-- Row Level Security: 로그인한 본인 행만 읽고 쓴다. 삭제는 허용하지 않는다.
alter table public.game_states enable row level security;

create policy "본인 상태 읽기" on public.game_states
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "본인 상태 만들기" on public.game_states
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "본인 상태 저장" on public.game_states
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
