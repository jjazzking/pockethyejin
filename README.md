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
npm run simulate   # 밸런스 시뮬레이터 (전략 4개 × 12주 × 100회)
```

밸런스 시뮬레이터 옵션: `npm run simulate -- --weeks 8 --runs 300 --seed 42 --strategy normal,greedy --json`
결과와 수치 조정 제안은 [`docs/balance-report.md`](./docs/balance-report.md)에 있다.

## 로그인 없이 해보기 (체험 모드)

로그인 화면의 **로그인 없이 해보기** 버튼을 누르면 체험 모드로 들어간다. Supabase 설정(환경 변수)이 아직 없으면 버튼 없이 바로 체험 모드로 열린다.
- 진행 기록은 그 브라우저(localStorage)에만 저장된다. 다른 기기와 이어지지 않고, Supabase에도 저장되지 않는다.
- 임시 장소 3개와 임시 그림으로 플레이한다.
- **처음부터 다시** 버튼으로 체험 기록을 지울 수 있다.

## Supabase 설정

1. Supabase에서 프로젝트를 만든다.
2. 대시보드 **SQL Editor**에서 `supabase/migrations` 폴더의 파일을 **이름 순서대로** 하나씩 붙여 넣고 실행한다. Supabase CLI를 쓴다면 `supabase db push`로 적용해도 된다.
   - `20261012000000_create_game_states.sql`: 게임 저장
   - `20261013000000_create_places.sql`: 장소 테이블 + 사진 버킷
   - `20261013000100_create_character_images.sql`: 캐릭터 그림 테이블 + 그림 버킷
   - `20261013000200_seed_placeholders.sql`: 임시 장소 3개 + 임시 혜진 그림 5장
   - `20261013000300_seed_hyejin_art.sql`: 진짜 혜진 그림 33장 (임시 그림 행은 지운다)
   - `20261013000400_seed_jeongwoo_art.sql`: 정우 그림 11장 + 둘이 함께 있는 "같이 놀기" 팝업 그림
   - `20261013000500_seed_mood_art.sql`: 시무룩·화남·위기 혜진 전신 18장, 정우 삐짐·눈치 7장, "냉동실 경고" 팝업 그림 1장
3. **Authentication → Users → Add user**에서 혜진 계정(이메일 + 비밀번호)을 만든다. 이때 "Auto Confirm User"를 체크한다.
4. **Authentication → Sign In / Providers**에서 "Allow new users to sign up"을 끈다. 이렇게 하면 계정이 하나로 고정된다.
5. `.env.example`을 `.env.local`로 복사하고 URL과 Publishable key를 채운다. Vercel에는 같은 이름으로 환경 변수를 등록한다.

로그인은 **이메일 + 비밀번호** 방식이다.
- 폰과 컴퓨터에서 각각 한 번만 로그인하면 세션이 브라우저에 남아서 계속 유지된다.
- 매직 링크는 폰의 메일 앱 안에서 링크가 열리면 다른 브라우저에 로그인되는 문제가 있어서 쓰지 않았다.
- 이메일 OTP는 로그인할 때마다 메일을 확인해야 해서 쓰지 않았다.

### 저장과 동시 접속

- `game_states` 테이블은 사용자당 한 행이며, RLS로 본인 행만 읽고 쓸 수 있다.
- `state`(jsonb)에는 GameState 전체가 들어간다. 지금 게임 속 날짜는 `state.lastSettledDate`, 현실 하루에 잔 밤 횟수는 `state.nights`에 있다.
- `schema_version`은 state의 구조 버전이다. 구조를 바꾸면 `src/persistence/schema.ts`의 `CURRENT_SCHEMA_VERSION`을 올리고 변환 함수를 추가한다.
- `version`은 동시 수정 방지용 번호다. 저장은 `UPDATE … WHERE version = 내가 읽은 버전`으로 하고, 트리거가 버전을 정확히 1씩만 올리도록 강제한다.
- 다른 기기가 먼저 저장했으면 0행이 갱신된다. 그러면 앱은 최신 상태를 다시 불러오고 "다른 기기에서 플레이한 내용을 불러왔어요"라고 알린다. 방금 한 행동은 반영되지 않는다.
- 두 기기에서 같은 상태로 동시에 잠자기를 눌러도, 먼저 저장한 기기 것만 남는다. 하루는 한 번만 넘어간다.
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

지금 게임에 쓰는 그림(혜진 53장, 정우 18장)은 앱 안(`public/characters`)에 있고, 행은 `20261013000300`·`20261013000400`·`20261013000500` 시드 파일로 들어간다.
원본 시트(`incoming/`)에서 만드는 방법은 아래 **원본 시트로 그림 만들기**를 본다.

**그림 규격**: 투명 배경 PNG(또는 WebP).
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
| 얼굴 `face` | `away_summary` | 자고 일어났을 때 "밤사이 있었던 일" 요약 |

정우 그림(`character`가 `jeongwoo`)은 태그가 따로 있다.

| 종류 | 태그 | 나오는 곳 |
|---|---|---|
| 전신 `full` | `idle` | 정우 카드 평소 모습 (그 포즈 그림이 없을 때도 이걸 쓴다) |
| 전신 `full` | `work` / `waiting` | 일 시킨 뒤 / 웨이팅 보낸 뒤 |
| 전신 `full` | `play_dj` / `play_game` | 혼자 디제잉 / 혼자 게임 뒤 |
| 전신 `full` | `run` | 편의점 불닭 심부름 뒤, 정우 막기 연출 |
| 전신 `full` | `sulk` | 정우가 삐져 있는 동안 (항상 이 그림) |
| 전신 `full` | `apologize` | 평소 모습일 때 혜진 행복도가 30 이하면 (눈치 보는 정우) |
| 얼굴 `face` | `happy` | 정우 승진 팝업 |
| 얼굴 `face` | `sulk` | 웨이팅 거절(삐짐) 팝업 |

- 한 그림에 태그를 여러 개 붙여도 되고, 같은 태그 그림이 여러 장이면 그중 하나가 무작위로 나온다.
- 메인 화면 전신은 앱을 열 때, 정우 행동을 할 때, 혜진을 탭할 때 바뀐다. 직전 그림은 연속으로 나오지 않는다.
- 어떤 풀에 그림이 하나도 없어도 게임은 멈추지 않는다. 해당 자리가 비어 보일 뿐이다.
- `/`로 시작하는 경로(`/characters/...`)는 앱 안에 들어 있는 파일이다.

### 로그인(타이틀) 화면 그림

- 세로 화면(핸드폰)은 `public/login/mobile.webp`, 가로 화면(컴퓨터·태블릿 가로)은 `public/login/desktop.webp`를 쓴다.
- 그림을 바꾸려면 파일만 바꾸면 된다. 원본을 `incoming/기본화면_핸드폰.png`, `incoming/기본화면_컴퓨터.png`로 올리고 `python3 scripts/art/build_login.py incoming`을 돌리면 알맞은 크기의 WebP로 만들어준다.
- 컴퓨터용 그림이 아직 없으면 스크립트가 핸드폰 그림을 가운데 둔 임시 그림을 만든다.
- 버튼은 그림 맨 아래(인물 발밑)에 올라가므로, 그림 아래쪽 1/6 정도는 비워두면 좋다. 컴퓨터용은 16:9(1920×1080)를 권장한다.

### 사진첩 (`/album`)

게임 화면 위쪽 **📸 사진첩** 버튼으로 들어간다. 로그인 없이도 볼 수 있다.
- 그려둔 혜진·정우 그림을 전부 모아 보여준다(게임에 안 쓰는 옆·뒷모습 등 포함).
- 그림마다 제목과 짧은 설명이 있고, 게임 그림이면 어디에 나오는지 표시한다.
- 내용은 `src/content/album.ts`에 있다. 새 그림을 게임에 넣으면 여기에도 한 줄 추가한다(빠지면 테스트가 알려준다).
- 게임에 안 쓰는 그림은 `build_art.py`의 `ART`에 `batch=None`으로 넣으면 그림 파일만 만들어진다.

### 원본 시트로 그림 만들기

한 장에 포즈가 여러 개 그려진 원본 시트(흰 배경)를 `incoming/`에 두고 아래를 실행한다. Python 3 + `numpy`, `opencv-python-headless`, `Pillow`가 필요하다.

```bash
python3 scripts/art/cut_sheets.py incoming /tmp/art-raw   # 시트 → 포즈별 조각
python3 scripts/art/build_art.py /tmp/art-raw             # 조각 → 투명 배경·규격 캔버스 + 시드 SQL + 체험 모드 목록
```

- 어느 시트를 어떻게 자를지는 `cut_sheets.py`의 `SHEETS`, 어떤 조각을 어떤 태그로 쓸지는 `build_art.py`의 `ART`에 적는다.
- 흰 배경은 자동으로 지운다. 다만 팔과 몸 사이처럼 막힌 빈틈은 눈 흰자·반사광과 구분이 안 되므로 `GAPS`에 위치를 적어야 지워진다.
- `src/content/characterArt.ts`와 시드 SQL은 스크립트가 만드는 파일이라 직접 고치지 않는다.

## 구조

```
src/game/            UI·저장 방식과 무관한 순수 규칙 엔진
  balance.ts         모든 수치 (밸런스 조정은 여기만)
  types.ts           게임 상태 · 행동 · 이벤트 타입
  engine.ts          applyAction(상태, 행동, {rng, places}) → 새 상태 + 이벤트
  hyejin.ts          경고 → 카운트다운 → 정우 막기 → 절반 섭취
  rules.ts           승진·레벨업 비용·거절 확률·데이트 확률 공식
  day.ts             createInitialState, closeDay(하루 마감 + 다음 날 아침), settle(밀린 날 일괄 정산)
  summary.ts         "밤사이 있었던 일" 요약
  date.ts            날짜 계산, 현실 하루(Asia/Seoul 06:00 기준), 사귄 지 며칠째
  places.ts          새 장소 알림(syncPlaceCount), 만렙 판정
  __tests__/         단위 테스트
src/content/         장소·캐릭터 그림 (순수 로직)
  places.ts          맵 구성(해금 여부·최고 별), DB 행 읽기
  images.ts          전신·얼굴 그림 고르기, 이벤트 → 얼굴 태그
  placeholders.ts    체험 모드용 임시 장소·그림
src/persistence/     저장 (규칙 엔진과 분리)
  store.ts           GameStore 인터페이스 (낙관적 동시성 제어)
  supabaseStore.ts   Supabase 구현
  memoryStore.ts     메모리 구현 (테스트·개발용)
  localStore.ts      브라우저 localStorage 구현 (체험 모드)
  schema.ts          상태 구조 버전과 마이그레이션
  session.ts         openGame(접속 시 구조 버전·장소 확인·저장), performAction(행동·저장·충돌 처리)
  contentRepo.ts     places·character_images 읽기, Storage 서명 URL
src/lib/supabase.ts  환경 변수로 만드는 브라우저 Supabase 클라이언트
src/ui/              화면 로직 (규칙은 엔진 함수만 호출)
  useGame.ts         불러오기·행동 실행·팝업 대기열·전신 그림 교체, 버튼 활성화는 엔진 dry-run
  describe.ts        엔진 이벤트 → 팝업·토스트
  copy.ts            화면 문구
src/app/GameApp.tsx  로그인 / Supabase 게임 / 체험 모드 진입점
src/app/components/  화면 컴포넌트
  GameShell          모바일: 아래 탭(메인·지도·데이트), 넓은 화면(960px+): 세 칸 나란히
  MainPanel          날짜·혜진 전신·경고·불닭·정우/혜진 상태와 행동
  MapPanel           추억 지도 (해금·가림·최고 별)
  DatePanel          장소 → 예산(별 확률) → 한정선 추가 → 출발
  PopupLayer         이벤트 팝업(혜진 얼굴), 정우 막기 연출, 밤사이 있었던 일, 데이트 결과
  CharacterFrame     비율 고정 캐릭터 그림 자리 (페이드 전환, 그림 없으면 이모지)
  ArtSlots           장소 사진·정우 그림 자리 (아트가 생기면 여기만 교체)
public/placeholders/ 임시 그림
src/sim/             밸런스 시뮬레이터 (엔진 그대로 사용): strategies, simulate, report
scripts/simulate.ts  시뮬레이터 커맨드라인
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
7. 게임 날짜는 잠자기를 할 때만 하루 넘어간다(첫날 2026-03-30). 하루 마감 때는 출근, 일 3회 이상, 불닭 무시 순으로 정산한다.
8. 잠자기는 현실 하루(KST 06:00 기준)에 `TIME.NIGHTS_PER_REAL_DAY`(3)번까지다. 다 써도 그날 남은 행동은 쓸 수 있다.
   - 행동이 남아 있어도 잘 수 있고, 남은 행동은 사라진다.
   - 잠자기는 턴이 아니다. 마감으로 20 이하가 되면 카운트다운만 시작되고, 절반 섭취는 다음 행동부터 판정한다.
9. 데이트 예산은 5만, 15만, 30만 원 세 가지 중에서만 고른다.
10. 데이트에 바치는 한정선은 5개 단위이고, 3성 확률이 95%에 닿는 데 필요한 개수까지만 받는다.
11. 3성을 아직 받지 못한 장소라면 처음 가는 곳에도 한정선을 바칠 수 있다.
12. 정우 행동이 0회이거나 정우가 삐진 상태여도 한정선 먹이기와 레벨업은 할 수 있다. (단, 아래 "카운트다운 중 레벨업 불가"는 적용된다.)
13. 정우와 혜진의 행복도는 0~100으로 제한한다. 정우 행복도가 0이어도 일과 놀기는 할 수 있다.

## 기획서 이후 바뀐 점 (밸런스 v0.2)

밸런스 시뮬레이션 결과에 따라 아래를 바꿨다. 자세한 근거는 [`docs/balance-report.md`](./docs/balance-report.md)에 있다.

- 평일 출근: 혜진 행복도 -20 → **-25**
- 같이 놀기: 혜진 행복도 +15 → **+10**
- 30만 원 데이트: 2성 20% / 3성 80% → **40% / 60%**
- **카운트다운 중에는 레벨업할 수 없다.** 혜진 행복도가 20 이하로 떨어져 카운트다운이 진행 중이면, 한정선이 충분해도 먼저 기분을 풀어줘야 레벨업할 수 있다. 경고 구간(21~30)에서는 레벨업할 수 있다.
