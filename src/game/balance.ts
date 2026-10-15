/**
 * 게임의 모든 수치. 기획서(game-design-spec.md) 기준 1차안이며 밸런스 조정 대상이다.
 * 규칙 엔진의 다른 파일에는 숫자를 하드코딩하지 않는다.
 */

/** 행복도 범위 (정우·혜진 공통) */
export const HAPPINESS_MIN = 0;
export const HAPPINESS_MAX = 100;

/** 시간 구조 */
export const TIME = {
  /** 게임 속 첫날 = 사귀기 시작한 날 (월요일) */
  START_DATE: "2026-03-30",
  /** 하루 정우 행동 횟수 (이월 없음) */
  ACTIONS_PER_DAY: 5,
  /** 현실 하루에 잘 수 있는 밤 (= 넘길 수 있는 게임 날짜 수) */
  NIGHTS_PER_REAL_DAY: 3,
  /** 현실 하루를 판정하는 시간대 */
  TIME_ZONE: "Asia/Seoul",
  /** 현실 하루가 바뀌는 시각 (서울 시간). 이때 밤 횟수가 다시 찬다. */
  REAL_DAY_RESET_HOUR: 6,
} as const;

/** 정우 */
export const JUNGWOO = {
  START_HAPPINESS: 100,
  START_MONEY: 0,
  /** 삐진 다음 날 아침 정우 행복도 */
  HAPPINESS_AFTER_SULK: 100,
} as const;

/** 혜진 */
export const HYEJIN = {
  START_HAPPINESS: 100,
  START_LEVEL: 1,
  START_HANJEONGSEON: 0,
} as const;

/** 정우 행동 */
export const ACTIONS = {
  WORK: {
    JUNGWOO_HAPPINESS: -10,
    ACTION_COST: 1,
  },
  WAITING: {
    JUNGWOO_HAPPINESS: -20,
    /** 한정선 1개 가격 (원) */
    PRICE_PER_HANJEONGSEON: 10_000,
    ACTION_COST: 1,
  },
  PLAY_ALONE: {
    JUNGWOO_HAPPINESS: 25,
    ACTION_COST: 1,
  },
  PLAY_TOGETHER: {
    JUNGWOO_HAPPINESS: 10,
    /** 기획서 1차안 +15 → 시뮬레이션 후 +10 */
    HYEJIN_HAPPINESS: 10,
    ACTION_COST: 1,
  },
  CONVENIENCE_STORE: {
    JUNGWOO_HAPPINESS: 0,
    HYEJIN_HAPPINESS: 25,
    COST_MONEY: 5_000,
    ACTION_COST: 1,
  },
  /** 혜진이 감기 걸린 날 죽 사다 주기. 감기가 낫는다 */
  PORRIDGE: {
    HYEJIN_HAPPINESS: 30,
    COST_MONEY: 10_000,
    ACTION_COST: 1,
  },
  DATE: {
    JUNGWOO_HAPPINESS: 30,
    HYEJIN_HAPPINESS: 30,
    HYEJIN_HAPPINESS_THREE_STARS: 50,
    ACTION_COST: 3,
  },
} as const;

/** 혜진 한정선 먹이기 (행동 소모 없음) */
export const FEED = {
  HYEJIN_HAPPINESS_PER_HANJEONGSEON: 10,
} as const;

/** 하루 마감 시 혜진 행복도 변화 */
export const DAY_END = {
  /** 평일 출근 (귀가 후 회복 반영 순변화). 기획서 1차안 -20 → 시뮬레이션 후 -25 */
  WEEKDAY_COMMUTE: -25,
  /** 그날 정우가 일을 이만큼 이상 했으면 */
  OVERWORK_THRESHOLD: 3,
  OVERWORK_PENALTY: -10,
  /** 불닭 이벤트 무시 */
  BULLDAK_IGNORED_PENALTY: -15,
} as const;

/** 웨이팅 거절(삐짐) */
export const SULK = {
  /** 정우 행복도가 이 값 이상이면 거절 확률 0% */
  SAFE_HAPPINESS: 50,
  /** 기준 아래로 행복도 1당 거절 확률 증가 (%p) */
  PERCENT_PER_HAPPINESS_BELOW: 2,
} as const;

/** 승진. 단계 순서대로. 일 1회 수입은 원 단위. */
export const RANKS: readonly { name: string; minWorkCount: number; incomePerWork: number }[] = [
  { name: "1단계", minWorkCount: 0, incomePerWork: 30_000 },
  { name: "2단계", minWorkCount: 20, incomePerWork: 45_000 },
  { name: "3단계", minWorkCount: 50, incomePerWork: 67_500 },
  { name: "4단계", minWorkCount: 100, incomePerWork: 100_000 },
  { name: "5단계", minWorkCount: 170, incomePerWork: 150_000 },
];

/** 레벨업 비용: 레벨 1→2 비용이 BASE, 이후 직전 비용 × MULTIPLIER (반올림) */
export const LEVEL_UP = {
  BASE_COST: 10,
  COST_MULTIPLIER: 1.4,
} as const;

/** 혜진 경고와 한정선 절반 섭취 */
export const WARNING = {
  /** 이하이면 경고 표시 */
  WARNING_HAPPINESS: 30,
  /** 이하이면 카운트다운 시작, 초과하면 해제 */
  DANGER_HAPPINESS: 20,
  /** 카운트다운 길이 (턴 = 정우 행동 1회) */
  COUNTDOWN_TURNS: 3,
  /** 절반 섭취 시 먹는 비율 (내림) */
  EAT_RATIO: 0.5,
  /** 절반 섭취 시 먹은 1개당 혜진 행복도 회복 */
  HAPPINESS_PER_EATEN: 10,
} as const;

/** 불닭 이벤트 */
export const BULLDAK = {
  /** 평일 아침 발생 확률 (%) */
  WEEKDAY_CHANCE_PERCENT: 15,
} as const;

/** 데이트 예산별 별 확률 (%). 합은 100. */
export const DATE_BUDGETS: readonly {
  amount: number;
  starPercents: { 1: number; 2: number; 3: number };
}[] = [
  { amount: 50_000, starPercents: { 1: 60, 2: 30, 3: 10 } },
  { amount: 150_000, starPercents: { 1: 20, 2: 40, 3: 40 } },
  /** 기획서 1차안 2성 20 / 3성 80 → 시뮬레이션 후 40 / 60 */
  { amount: 300_000, starPercents: { 1: 0, 2: 40, 3: 60 } },
];

/** 3성 확률 올리기용 한정선 바치기 */
export const DATE_OFFERING = {
  /** 이 개수 단위로만 바칠 수 있다 */
  BUNDLE_SIZE: 5,
  /** 1묶음당 3성 확률 증가 (%p) */
  PERCENT_PER_BUNDLE: 10,
  /** 3성 확률 상한 (%) */
  MAX_THREE_STAR_PERCENT: 95,
} as const;

/** 혜진이 감기: 아침에 확률로 걸리고, 그날은 같이 놀기 불가 + 행복도가 반만 오른다. 다음 날 아침 낫는다 */
export const SICK = {
  CHANCE_PERCENT: 5,
} as const;

/**
 * 랜덤 이벤트 (번개 약속). 아침에 확률로 하나가 생기고 그날 자기 전까지 고른다.
 * 정우 행동은 쓰지 않는다. 대신 돈이나 다음 날 피로(행동 감소)가 든다. 안 고르면 그냥 지나간다.
 */
export const SOCIAL = {
  /** 아침마다 이벤트가 생길 확률 (%) */
  CHANCE_PERCENT: 30,
  /** 평일에만 / 주말에만 생기는 이벤트 */
  WEEKDAY_ONLY: ["rain"],
  WEEKEND_ONLY: ["homebody"],
  /** 날짜로 정해지는 이벤트 (확률과 상관없이 그날 아침 생긴다). 기념일이 월급날보다 먼저 */
  ANNIVERSARY_EVERY_DAYS: 100,
  PAYDAY_DAY_OF_MONTH: 25,
  /** 월급날 아침에 자동으로 들어오는 월급 */
  PAYDAY_SALARY: 100_000,
  /**
   * 이벤트 → 고를 수 있는 선택지 → 효과.
   * money: 드는 돈, hanjeongseon: 한정선 변화, tired: 다음 날 정우 행동 감소
   */
  EVENTS: {
    poker: {
      go: { hyejin: 20, jungwoo: 20, money: 0, hanjeongseon: 0, tired: 2 },
    },
    friends: {
      solo: { hyejin: 15, jungwoo: 0, money: 0, hanjeongseon: 0, tired: 0 },
      join: { hyejin: 25, jungwoo: 10, money: 50_000, hanjeongseon: 0, tired: 0 },
    },
    snack: {
      order: { hyejin: 15, jungwoo: 10, money: 20_000, hanjeongseon: 0, tired: 0 },
    },
    rain: {
      pickup: { hyejin: 20, jungwoo: 0, money: 0, hanjeongseon: 0, tired: 1 },
      taxi: { hyejin: 10, jungwoo: 0, money: 20_000, hanjeongseon: 0, tired: 0 },
    },
    karaoke: {
      together: { hyejin: 15, jungwoo: 15, money: 10_000, hanjeongseon: 0, tired: 0 },
      solo: { hyejin: 10, jungwoo: 0, money: 0, hanjeongseon: 0, tired: 0 },
    },
    dessert: {
      buy: { hyejin: 10, jungwoo: 0, money: 5_000, hanjeongseon: 0, tired: 0 },
      hanjeongseon: { hyejin: 15, jungwoo: 0, money: 0, hanjeongseon: -1, tired: 0 },
    },
    newgame: {
      allow: { hyejin: -10, jungwoo: 30, money: 0, hanjeongseon: 0, tired: 0 },
      date: { hyejin: 10, jungwoo: -10, money: 0, hanjeongseon: 0, tired: 0 },
    },
    homebody: {
      netflix: { hyejin: 10, jungwoo: 10, money: 0, hanjeongseon: 0, tired: 0 },
    },
    parcel: {
      pay: { hyejin: 25, jungwoo: 0, money: 30_000, hanjeongseon: 0, tired: 0 },
      half: { hyejin: 10, jungwoo: 0, money: 15_000, hanjeongseon: 0, tired: 0 },
    },
    yeppi: {
      walk: { hyejin: 15, jungwoo: 15, money: 0, hanjeongseon: 0, tired: 0 },
      treat: { hyejin: 20, jungwoo: 10, money: 5_000, hanjeongseon: 0, tired: 0 },
    },
    payday: {
      save: { hyejin: 0, jungwoo: 10, money: 0, hanjeongseon: 0, tired: 0 },
      treat: { hyejin: 20, jungwoo: 0, money: 50_000, hanjeongseon: 0, tired: 0 },
      hanjeongseon: { hyejin: 0, jungwoo: 0, money: 50_000, hanjeongseon: 5, tired: 0 },
    },
    anniversary: {
      cake: { hyejin: 30, jungwoo: 10, money: 30_000, hanjeongseon: 0, tired: 0 },
      flowers: { hyejin: 20, jungwoo: 0, money: 20_000, hanjeongseon: 0, tired: 0 },
    },
  },
} as const;

/**
 * 운: 같은 행동도 가끔 결과가 달라진다. 숫자는 확률(%). 행운 난수(ActionContext.luck)가 있을 때만 판정한다.
 */
export const LUCK = {
  /** 같이 놀기: 투닥(fight) / 인생샷(great) */
  PLAY_TOGETHER: { fight: 15, great: 10 },
  PLAY_TOGETHER_FIGHT: { HYEJIN: -5, JUNGWOO: -5 },
  PLAY_TOGETHER_GREAT: { HYEJIN: 20, JUNGWOO: 15 },
  /** 일 시키기: 상사 칭찬 보너스 / 야근 */
  WORK: { bonus: 10, overtime: 10 },
  WORK_BONUS_MULTIPLIER: 1.5,
  WORK_OVERTIME_JUNGWOO: -10,
  /** 웨이팅: 1+1 행사(하나 더, 공짜) / 앞에서 품절(하나 덜, 그만큼 돈 안 듦) */
  WAITING: { extra: 10, short: 10 },
  /** 오늘의 기분 (아침마다): 맑음 / 꿀꿀 / 꿀잠 */
  MOOD: { sunny: 10, gloomy: 10, rested: 10 },
  SUNNY_TOGETHER_BONUS: 5,
  GLOOMY_DAY_END: -5,
  RESTED_EXTRA_ACTIONS: 1,
  /** 혜진이 쓰다듬기: 하루 한 번, 뽀뽀 받을 확률 */
  KISS_PERCENT: 15,
  KISS_JUNGWOO: 10,
} as const;
