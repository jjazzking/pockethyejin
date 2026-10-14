/** 날짜, "YYYY-MM-DD" 형식. 게임 속 날짜(잠잘 때 넘어감)와 현실 하루(밤 횟수 단위)에 쓴다. */
export type GameDate = string;

export type Stars = 1 | 2 | 3;

/** 무작위 함수. [0, 1) 범위의 수를 반환한다. 테스트에서는 고정값을 주입한다. */
export type Rng = () => number;

export interface JungwooState {
  /** 0–100 */
  happiness: number;
  /** 원 */
  money: number;
  /** 누적 일 횟수 (= 업무능력) */
  totalWorkCount: number;
  /** 직급 단계, 1부터 */
  rank: number;
  /** 오늘 남은 행동 */
  actionsLeft: number;
  /** 오늘 일 횟수 */
  workCountToday: number;
  /** 오늘 웨이팅을 거절하고 삐졌는지. 다음 날 아침 풀린다. */
  sulking: boolean;
}

export interface HyejinState {
  /** 0–100 */
  happiness: number;
  /** 1부터. 최대 레벨 = 등록된 장소 수 */
  level: number;
  /** 보유 한정선 찹쌀떡 */
  hanjeongseon: number;
  /**
   * 경고 카운트다운의 남은 턴. 행복도가 20 이하일 때만 값이 있고, 20을 넘으면 null.
   * 경고 표시(행복도 30 이하) 여부는 행복도에서 바로 알 수 있으므로 따로 저장하지 않는다.
   */
  countdownTurnsLeft: number | null;
  /** 정우 막기를 이미 썼는지. 게임 전체에서 한 번만 쓸 수 있다. */
  jungwooBlockUsed: boolean;
}

/** 오늘의 불닭 이벤트 상태 */
export type BulldakState = "none" | "active" | "resolved";

/** 랜덤 이벤트 종류 (balance.ts SOCIAL.EVENTS) */
export type SocialEventId = "poker" | "friends" | "snack";

/** 이벤트 탭에 모이는 이벤트. 랜덤 번개 약속 + 게임 중 생기는 사건들 */
export type StoryEventId = SocialEventId | "bulldak" | "sulk" | "promoted" | "block" | "raid";

export interface GameState {
  jungwoo: JungwooState;
  hyejin: HyejinState;
  bulldak: BulldakState;
  /** 장소 id → 최고 별 개수. 가본 적 없는 장소는 키가 없다. */
  bestStars: Record<string, Stars>;
  /** 이번 주말 데이트를 이미 했는지. 월요일 아침에 초기화된다. */
  weekendDateUsed: boolean;
  /** 현재 진행 중인 게임 속 날짜 */
  lastSettledDate: GameDate;
  /** 오늘 생긴 랜덤 이벤트 (아직 안 골랐으면). 고르거나 하루가 끝나면 null */
  social: SocialEventId | null;
  /** 지금까지 만난 이벤트 (이벤트 탭 도감). 처음 만난 순서대로 */
  seenEvents: StoryEventId[];
  /** 내일 아침 정우 행동에서 뺄 수 (밤샘 포커 피로) */
  jungwooTiredActions: number;
  /** 현실 하루에 잔 밤 횟수. realDay가 바뀌면 0부터 다시 센다. */
  nights: { realDay: GameDate | null; used: number };
  /**
   * 마지막으로 확인한 등록 장소 수. 접속 시 실제 장소 수가 이보다 많으면 "새 추억" 알림.
   * null이면 아직 확인 전 (알림 없이 현재 수로 맞춘다).
   */
  knownPlaceCount: number | null;
}

/** 규칙 엔진이 알아야 하는 장소 정보. order 순으로 정렬된 상태로 넘긴다. */
export interface PlaceRef {
  id: string;
}

export type Action =
  | { type: "work" }
  | { type: "waiting"; quantity: number }
  | { type: "playAlone" }
  | { type: "playTogether" }
  | { type: "convenienceStore" }
  | { type: "feed"; count: number }
  | { type: "levelUp" }
  | { type: "date"; placeId: string; budget: number; offering: number }
  /** 랜덤 이벤트 고르기 (행동 안 씀). choice는 SOCIAL.EVENTS의 선택지 또는 "skip" */
  | { type: "social"; choice: string }
  /** 하루를 마감하고 다음 날 아침으로 */
  | { type: "sleep" };

export type ActionError =
  | "NO_ACTIONS_LEFT"
  | "NOT_ENOUGH_ACTIONS"
  | "NOT_ENOUGH_MONEY"
  | "NOT_ENOUGH_HANJEONGSEON"
  | "INVALID_QUANTITY"
  | "NO_BULLDAK_EVENT"
  | "MAX_LEVEL"
  /** 경고 카운트다운 중이라 레벨업 불가 (혜진이 기분이 나쁨) */
  | "HYEJIN_UPSET"
  | "NOT_WEEKEND"
  | "DATE_ALREADY_USED"
  | "PLACE_LOCKED"
  | "INVALID_BUDGET"
  | "INVALID_OFFERING"
  | "OFFERING_NOT_ALLOWED"
  /** 현실 하루에 잘 수 있는 밤을 다 씀 */
  | "NO_NIGHTS_LEFT"
  | "NO_SOCIAL_EVENT"
  | "INVALID_CHOICE";

export type GameEvent =
  // 정우 행동
  | { type: "worked"; income: number }
  | { type: "promoted"; rank: number }
  | { type: "waitingDone"; quantity: number; cost: number }
  | { type: "waitingRejected" }
  | { type: "playedAlone" }
  | { type: "playedTogether" }
  | { type: "bulldakResolved" }
  | { type: "dated"; placeId: string; stars: Stars; newBest: boolean; firstVisit: boolean }
  // 혜진
  | { type: "fed"; count: number }
  | { type: "leveledUp"; level: number; cost: number }
  | { type: "warningStarted" }
  | { type: "warningEnded" }
  | { type: "countdownStarted"; turnsLeft: number }
  | { type: "countdownTicked"; turnsLeft: number }
  | { type: "countdownCancelled" }
  | { type: "jungwooBlocked" }
  | { type: "halfEaten"; eaten: number; recovered: number }
  // 날짜 흐름
  | {
      type: "dayEnded";
      date: GameDate;
      commute: number;
      overwork: number;
      bulldakIgnored: number;
    }
  | { type: "dayStarted"; date: GameDate; sulkHealed: boolean; tired: number }
  // 업데이트
  | {
      type: "newPlacesAdded";
      /** 새로 늘어난 장소 수 */
      count: number;
      /** 혜진이 만렙이었다가 다시 레벨업할 수 있게 됐는지 */
      levelCapRaised: boolean;
    }
  | { type: "bulldakCraving"; date: GameDate }
  // 랜덤 이벤트
  | { type: "socialEvent"; event: SocialEventId }
  | { type: "socialDone"; event: SocialEventId; choice: string }
  | { type: "socialSkipped"; event: SocialEventId };

export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: ActionError };

export interface ActionContext {
  rng: Rng;
  /** 등록된 장소, order 순 */
  places: readonly PlaceRef[];
  /** 지금의 현실 하루 (잠자기 밤 횟수 판정용). 없으면 밤 횟수를 제한하지 않는다 (시뮬레이션). */
  realDay?: GameDate;
}
