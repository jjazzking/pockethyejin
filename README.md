# 꿍진이 키우기

정우를 부려먹어서 혜진이를 키우는 커플 육성 게임. 기획서: [`game-design-spec.md`](./game-design-spec.md)

- 프레임워크: Next.js (App Router, TypeScript) — Vercel 배포 예정
- 백엔드: Supabase (Auth + Postgres)
- 테스트: Vitest

```bash
npm install
npm run dev        # 개발 서버
npm test           # 규칙 엔진 단위 테스트
npm run typecheck
npm run lint
```

## Supabase 설정

1. Supabase에서 프로젝트를 만든다.
2. 대시보드 **SQL Editor**에서 `supabase/migrations` 폴더의 파일을 **이름 순서대로** 하나씩 붙여 넣고 실행한다. Supabase CLI를 쓴다면 `supabase db push`로 적용해도 된다.
   - `20261012000000_create_game_states.sql`: 게임 저장
   - `20261013000000_create_places.sql`: 장소 테이블 + 사진 버킷
   - `20261013000100_create_character_images.sql`: 캐릭터 그림 테이블 + 그림 버킷
   - `20261013000200_seed_placeholders.sql`: 임시 장소 3개 + 임시 혜진 그림 5장
3. **Authentication → Users → Add user**에서 혜진 계정(이메일 + 비밀번호)을 만든다. 이때 "Auto Confirm User"를 체크한다.
4. **Authentication → Sign In / Providers**에서 "Allow new users to sign up"을 끈다. 이렇게 하면 계정이 하나로 고정된다.
5. `.env.example`을 `.env.local`로 복사하고 URL과 Publishable key를 채운다. Vercel에는 같은 이름으로 환경 변수를 등록한다.

로그인은 **이메일 + 비밀번호** 방식이다.
- 폰과 컴퓨터에서 각각 한 번만 로그인하면 세션이 브라우저에 남아서 계속 유지된다.
- 매직 링크는 폰의 메일 앱 안에서 링크가 열리면 다른 브라우저에 로그인되는 문제가 있어서 쓰지 않았다.
- 이메일 OTP는 로그인할 때마다 메일을 확인해야 해서 쓰지 않았다.

### 저장과 동시 접속

- `game_states` 테이블은 사용자당 한 행이며, RLS로 본인 행만 읽고 쓸 수 있다.
- `state`(jsonb)에는 GameState 전체가 들어가고, 마지막 정산 날짜는 `state.lastSettledDate`에 있다.
- `schema_version`은 state의 구조 버전이다. 구조를 바꾸면 `src/persistence/schema.ts`의 `CURRENT_SCHEMA_VERSION`을 올리고 변환 함수를 추가한다.
- `version`은 동시 수정 방지용 번호다. 저장은 `UPDATE … WHERE version = 내가 읽은 버전`으로 하고, 트리거가 버전을 정확히 1씩만 올리도록 강제한다.
- 다른 기기가 먼저 저장했으면 0행이 갱신된다. 그러면 앱은 최신 상태를 다시 불러오고 "다른 기기에서 플레이한 내용을 불러왔어요"라고 알린다. 방금 한 행동은 반영되지 않는다.
- 두 기기가 같은 날 동시에 앱을 열면, 정산은 먼저 저장한 기기 것만 남는다. 늦은 기기가 다시 불러온 상태는 이미 오늘로 정산돼 있어서 두 번 정산되지 않는다.
- 탭이 다시 화면에 보이면 최신 상태를 다시 불러온다.

## 새 장소 추가하기 (대시보드)

코드를 고치거나 다시 배포할 필요가 없다. 혜진이 다음에 앱을 열면 "새 추억이 추가됐어요!" 알림이 뜬다.

**1. 사진 올리기**
1. 왼쪽 메뉴 **Storage** → **places** 버킷을 연다.
2. **Upload file**로 사진을 올린다. 파일 이름은 **영어·숫자·`-`만** 쓴다 (예: `seongsu-cafe.jpg`). jpg, png, webp를 올릴 수 있다.
3. 올린 파일 이름을 그대로 기억해 둔다. 폴더 안에 올렸다면 `폴더/파일이름`이 경로다.

**2. 장소 행 추가하기**
1. 왼쪽 메뉴 **Table Editor** → **places** 테이블 → **Insert → Insert row**.
2. 칸을 채운다.

| 칸 | 넣을 값 | 예시 |
|---|---|---|
| id | 겹치지 않는 아무 이름 (영어) | `place-004` |
| order | 해금 순서. 지금 마지막 번호 + 1 | `4` |
| name | 장소 이름 | `성수동 카페` |
| date | 다녀온 날짜 (비워도 됨) | `2026-11-01` |
| image | 1단계에서 올린 사진 경로 | `seongsu-cafe.jpg` |
| episodes | 별 개수별 에피소드 (아래 형식 그대로) | 아래 참고 |

```json
{ "1": "별 1개일 때 보여줄 이야기", "2": "별 2개일 때 이야기", "3": "별 3개일 때 이야기" }
```

3. **Save**.

- 임시 장소(`place-001`~`003`)는 진짜 장소로 내용을 바꾸면 된다. 지우면 그만큼 레벨 상한이 줄어드니, 지우지 말고 **수정**하는 걸 추천한다.
- 이미 가본 장소의 별 기록은 장소 **id**에 붙어 있다. 그러니 이미 쓰고 있는 장소의 id는 바꾸지 않는다.

## 캐릭터 그림 추가하기 (대시보드)

**그림 규격**: 투명 배경 PNG.
- 전신은 **1024×1536**(세로 2:3)이고, 모든 그림에서 발끝 높이와 머리 크기를 똑같이 맞춘다.
- 얼굴은 **1024×1024**이고, 얼굴 중심과 크기를 똑같이 맞춘다. 테두리나 글자는 넣지 않는다.
- 이렇게 맞춰 그리면 그림이 바뀌어도 캐릭터 위치가 튀지 않는다.

**1. 그림 올리기**
1. **Storage** → **characters** 버킷 → **Upload file**.
2. 파일 이름은 영어·숫자·`-`·`/`만 쓴다 (예: `hyejin/full/smile.png`, `hyejin/face/yummy.png`).

**2. 그림 행 추가하기**
SQL Editor에 아래 내용을 붙여 넣고, 값만 바꿔서 **Run**하면 가장 확실하다.

```sql
insert into public.character_images (character, kind, tags, path, description) values
  ('hyejin', 'full', '{normal}', 'hyejin/full/smile.png', '웃는 혜진');
```

- `character`: `hyejin` 또는 `jeongwoo`
- `kind`: 전신이면 `full`, 얼굴이면 `face`
- `tags`: `'{normal}'`처럼 중괄호 안에 쓴다. 여러 개면 `'{eat_mochi,level_up}'`처럼 쉼표로 구분한다.
- `path`: 1단계에서 올린 경로

Table Editor → **character_images** → Insert row로 넣어도 된다.

**태그를 붙이면 어디에 나오나**

| 종류 | 태그 | 나오는 곳 |
|---|---|---|
| 전신 `full` | `normal` | 메인 화면 평상시 (혜진 행복도 30 초과). 여러 장이면 번갈아 나온다 |
| 전신 `full` | `sad` | 혜진 행복도 30 이하 (경고 구간) |
| 전신 `full` | `danger` | 혜진 행복도 20 이하 (카운트다운 구간). 없으면 `sad` 그림을 쓴다 |
| 얼굴 `face` | `default` | 그 이벤트용 얼굴이 없을 때 대신 나오는 기본 얼굴 |
| 얼굴 `face` | `eat_mochi` | 한정선 먹이기 |
| 얼굴 `face` | `level_up` | 레벨업 |
| 얼굴 `face` | `warning` | 경고 (행복도 30 이하로 내려감) |
| 얼굴 `face` | `countdown` | 카운트다운 시작 (행복도 20 이하) |
| 얼굴 `face` | `jeongwoo_block` | 정우가 냉동실을 막음 |
| 얼굴 `face` | `eat_half` | 한정선 절반 먹어치움 |
| 얼굴 `face` | `buldak_craving` | 불닭이 땡김 |
| 얼굴 `face` | `buldak_eat` | 편의점 불닭 먹음 |
| 얼굴 `face` | `play_together` | 같이 놀기 |
| 얼굴 `face` | `date_1star` / `date_2star` / `date_3star` | 데이트 결과 별 1·2·3개 |
| 얼굴 `face` | `new_place` | 새 추억 추가 알림 |
| 얼굴 `face` | `away_summary` | 자리를 비운 동안 요약 |

- 한 그림에 태그를 여러 개 붙여도 되고, 같은 태그 그림이 여러 장이면 그중 하나가 무작위로 나온다.
- 메인 화면 전신은 앱을 열 때, 정우 행동을 할 때, 혜진을 탭할 때 바뀐다. 직전 그림은 연속으로 나오지 않는다.
- 어떤 풀에 그림이 하나도 없어도 게임은 멈추지 않는다. 해당 자리가 비어 보일 뿐이다.
- 임시 그림(`/placeholders/...` 경로)은 앱 안에 들어 있는 파일이다. 진짜 그림을 올리면 임시 행은 지워도 된다.

## 구조

```
src/game/            UI·저장 방식과 무관한 순수 규칙 엔진
  balance.ts         모든 수치 (밸런스 조정은 여기만)
  types.ts           게임 상태 · 행동 · 이벤트 타입
  engine.ts          applyAction(상태, 행동, {rng, places}) → 새 상태 + 이벤트
  hyejin.ts          경고 → 카운트다운 → 정우 막기 → 절반 섭취
  rules.ts           승진·레벨업 비용·거절 확률·데이트 확률 공식
  day.ts             createInitialState, closeDay(하루 마감 + 다음 날 아침), settle(밀린 날 일괄 정산)
  summary.ts         "자리를 비운 동안" 요약
  date.ts            게임 날짜 (Asia/Seoul 06:00 기준)
  places.ts          새 장소 알림(syncPlaceCount), 만렙 판정
  __tests__/         단위 테스트
src/content/         장소·캐릭터 그림 (순수 로직)
  places.ts          맵 구성(해금 여부·최고 별), DB 행 읽기
  images.ts          전신·얼굴 그림 고르기, 이벤트 → 얼굴 태그
src/persistence/     저장 (규칙 엔진과 분리)
  store.ts           GameStore 인터페이스 (낙관적 동시성 제어)
  supabaseStore.ts   Supabase 구현
  memoryStore.ts     메모리 구현 (테스트·개발용)
  schema.ts          상태 구조 버전과 마이그레이션
  session.ts         openGame(접속 시 정산·장소 확인·저장), performAction(행동·저장·충돌 처리)
  contentRepo.ts     places·character_images 읽기, Storage 서명 URL
src/lib/supabase.ts  환경 변수로 만드는 브라우저 Supabase 클라이언트
src/app/GameApp.tsx  로그인 + 임시 확인용 화면 (실제 UI는 다음 단계)
src/app/components/  CharacterFrame (비율 고정 캐릭터 그림 틀)
public/placeholders/ 임시 그림
supabase/migrations/ DB 마이그레이션 SQL
```

## 기획서 해석 (확정)

기획서에 없거나 서로 맞지 않던 부분은 다음과 같이 정했다.

1. 레벨업 비용은 공식대로 계산한다(×1.4, 반올림): 10, 14, 20, 28, 39, 55, … 비용 10은 레벨 1→2에 드는 비용이다.
2. 직급별 일 1회 수입: 3만 / 4.5만 / 6.75만 / 10만 / 15만 원.
3. 카운트다운의 1턴 = 정우 행동 1회.
   - 한정선 먹이기와 레벨업, 하루 마감은 턴으로 세지 않는다.
   - 데이트는 3턴으로 센다.
   - 판정은 행동 효과가 적용된 직후에 한다.
   - 카운트다운은 날을 넘겨도 이어진다.
   - 거절된 웨이팅은 1턴으로 세고, 그 뒤에 사라진 행동은 턴이 아니다.
4. 절반 섭취 후에도 행복도가 20 이하이면 3턴 카운트다운을 새로 시작한다.
5. 거절된 웨이팅은 돈, 한정선, 정우 행복도가 모두 그대로다. 행동 1회만 소모되고 남은 행동은 사라진다.
6. 주말에도 일을 할 수 있고, "일 3회 이상 → 혜진 -10" 벌점도 적용된다. 불닭 이벤트는 평일만 발생한다.
7. 게임 날짜는 KST 06:00에 바뀐다. 하루 마감 때는 출근, 일 3회 이상, 불닭 무시 순으로 정산한다.
8. 부재한 날은 혜진 행복도 감소를 절반만, 소수점 버림으로 적용한다(-20 → -10, -15 → -7).
   - 부재한 평일에도 불닭은 확률대로 발생하고, 대응할 수 없으므로 무시 페널티를 받는다.
   - 마지막으로 접속했던 날은 감소를 그대로 적용한다.
9. 데이트 예산은 5만, 15만, 30만 원 세 가지 중에서만 고른다.
10. 데이트에 바치는 한정선은 5개 단위이고, 3성 확률이 95%에 닿는 데 필요한 개수까지만 받는다.
11. 3성을 아직 받지 못한 장소라면 처음 가는 곳에도 한정선을 바칠 수 있다.
12. 정우 행동이 0회이거나 정우가 삐진 상태여도 한정선 먹이기와 레벨업은 할 수 있다.
13. 정우와 혜진의 행복도는 0~100으로 제한한다. 정우 행복도가 0이어도 일과 놀기는 할 수 있다.
