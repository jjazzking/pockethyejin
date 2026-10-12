/** 게임 날짜. 서울 시간 06:00 기준으로 바뀌는 날짜, "YYYY-MM-DD" 형식. */
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

export interface GameState {
  jungwoo: JungwooState;
  hyejin: HyejinState;
  bulldak: BulldakState;
  /** 장소 id → 최고 별 개수. 가본 적 없는 장소는 키가 없다. */
  bestStars: Record<string, Stars>;
  /** 이번 주말 데이트를 이미 했는지. 월요일 아침에 초기화된다. */
  weekendDateUsed: boolean;
  /** 마지막으로 정산한 게임 날짜 = 현재 진행 중인 게임 날짜 */
  lastSettledDate: GameDate;
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
  | { type: "date"; placeId: string; budget: number; offering: number };

export type ActionError =
  | "NO_ACTIONS_LEFT"
  | "NOT_ENOUGH_ACTIONS"
  | "NOT_ENOUGH_MONEY"
  | "NOT_ENOUGH_HANJEONGSEON"
  | "INVALID_QUANTITY"
  | "NO_BULLDAK_EVENT"
  | "MAX_LEVEL"
  | "NOT_WEEKEND"
  | "DATE_ALREADY_USED"
  | "PLACE_LOCKED"
  | "INVALID_BUDGET"
  | "INVALID_OFFERING"
  | "OFFERING_NOT_ALLOWED";

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
      absent: boolean;
      commute: number;
      overwork: number;
      bulldakIgnored: number;
    }
  | { type: "dayStarted"; date: GameDate; sulkHealed: boolean }
  | { type: "bulldakCraving"; date: GameDate };

export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: ActionError };

export interface ActionContext {
  rng: Rng;
  /** 등록된 장소, order 순 */
  places: readonly PlaceRef[];
}
