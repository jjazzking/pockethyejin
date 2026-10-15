import { BALANCE } from "@/game";
import type { ActionError, Mood, SocialEventId, StoryEventId } from "@/game/types";

/** 화면 문구. 톤: "정우를 부려먹어서 혜진이를 키우는 게임" */

export const ERROR_TEXT: Record<ActionError, string> = {
  NO_ACTIONS_LEFT: "정우가 오늘은 녹초가 됐다. 이제 자러 가자 🌙",
  NOT_ENOUGH_ACTIONS: `데이트는 정우 행동이 ${BALANCE.ACTIONS.DATE.ACTION_COST}번 남아 있어야 갈 수 있어요.`,
  NOT_ENOUGH_MONEY: "돈이 모자라요. 정우를 더 일 시키자 💼",
  NOT_ENOUGH_HANJEONGSEON: "한정선이 모자라요. 정우를 웨이팅 보내자 🍡",
  INVALID_QUANTITY: "개수를 다시 골라주세요.",
  NO_BULLDAK_EVENT: "지금은 불닭이 안 땡긴대요.",
  JUNGWOO_EXHAUSTED: "정우가 너무 지쳐서 일 못 하겠대요. 혼자 놀게 해주세요 🎧",
  HYEJIN_SICK: "혜진이가 감기라 오늘은 같이 못 놀아요. 죽을 사다 주세요 🥣",
  NOT_SICK: "혜진이 지금 멀쩡해요.",
  MAX_LEVEL: "새 추억 업데이트를 기다리는 중",
  HYEJIN_UPSET: "혜진이가 냉동실 앞을 서성이는 중이라 레벨업할 기분이 아니래요. 먼저 기분부터 풀어주세요.",
  NOT_WEEKEND: "데이트는 주말에만! 평일엔 혜진이 출근해요.",
  DATE_ALREADY_USED: "이번 주말 데이트는 이미 다녀왔어요.",
  PLACE_LOCKED: "아직 열리지 않은 장소예요.",
  INVALID_BUDGET: "예산을 다시 골라주세요.",
  INVALID_OFFERING: "한정선은 정해진 단위로만 바칠 수 있어요.",
  OFFERING_NOT_ALLOWED: "이미 별 3개를 받은 장소예요.",
  NO_NIGHTS_LEFT: "오늘은 여기까지! 내일 아침 6시에 또 놀자 🌙",
  NO_SOCIAL_EVENT: "오늘은 약속이 없어요.",
  ALREADY_PETTED: "오늘은 이미 쓰다듬었어요.",
  INVALID_CHOICE: "다시 골라주세요.",
};

export const SULKING_TEXT = "정우가 삐져서 방에 들어갔다… 자고 일어나면 풀려요.";
/** 오늘의 기분 (운). 날짜 옆 배지와 아침 요약에 쓴다 */
export const MOOD_TEXT: Record<Mood, { badge: string; detail: string }> = {
  sunny: { badge: "☀️ 맑음", detail: `날씨가 좋아서 같이 놀면 혜진 +${BALANCE.LUCK.SUNNY_TOGETHER_BONUS} 더` },
  gloomy: { badge: "☁️ 꿀꿀", detail: `혜진이 기분이 꿀꿀한 날. 자기 전에 혜진 ${BALANCE.LUCK.GLOOMY_DAY_END}` },
  rested: { badge: "😴 꿀잠", detail: `정우가 꿀잠 자서 오늘 행동 +${BALANCE.LUCK.RESTED_EXTRA_ACTIONS}` },
};

/** 웨이팅 거절할 때 정우 한마디 (하나 골라서 보여준다) */
export const SULK_LINES = [
  "흥! 오늘은 안 가줄래!",
  "나도 더워… 오늘은 파업이야!",
  "땡볕에 또? 싫어싫어! 😤",
  "한정선보다 내가 더 소중하지 않아?!",
  "오늘 정우는 영업 종료입니다. 흥!",
  "줄 서는 거 이제 지쳤어… 안 가!",
] as const;
export const CONFLICT_TEXT = "다른 기기에서 플레이한 내용이 있어서 최신 상태를 불러왔어요. 방금 행동은 반영되지 않았어요.";
export const SYNCED_TEXT = "다른 기기에서 저장한 최신 상태를 불러왔어요.";
export const WAITING_FOR_UPDATE_TEXT = "새 추억 업데이트를 기다리는 중";

export const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatMoney(won: number): string {
  if (won >= 10_000 && won % 1_000 === 0) {
    const man = won / 10_000;
    return `${Number.isInteger(man) ? man : man.toFixed(1).replace(/\.0$/, "")}만 원`;
  }
  return `${won.toLocaleString("ko-KR")}원`;
}

export function rankName(rank: number): string {
  return BALANCE.RANKS[rank - 1]?.name ?? `${rank}단계`;
}

export type PlayFlavor = "dj" | "game";
export const PLAY_ALONE_FLAVORS: Record<PlayFlavor, { label: string; emoji: string; done: string }> = {
  dj: { label: "디제잉", emoji: "🎧", done: "정우가 방에서 디제잉하며 혼자 신났다 🎧" },
  game: { label: "게임", emoji: "🎮", done: "정우가 게임 한 판으로 기분이 풀렸다 🎮" },
};

/** 랜덤 이벤트 문구. 선택지 키는 balance.ts SOCIAL.EVENTS와 같다 */
export const SOCIAL_TEXT: Record<
  SocialEventId,
  { emoji: string; title: string; body: string; choices: Record<string, { label: string; done: string }> }
> = {
  poker: {
    emoji: "🃏",
    title: "오늘 밤 번개 포커!",
    body: "정우 친구들이 밤새 포커 치자고 연락이 왔어요. 혜진이도 같이 가자는데…",
    choices: { go: { label: "밤새 치러 간다", done: "밤새 포커! 둘 다 신났지만 정우는 내일 좀 피곤할 듯 🃏" } },
  },
  friends: {
    emoji: "👯",
    title: "민정·다은이랑 놀러 간대요",
    body: "혜진이가 민정이, 다은이랑 놀기로 했어요. 정우도 합류할까요?",
    choices: {
      solo: { label: "혜진이만 보낸다", done: "셋이서 수다 삼매경. 혜진이 기분 최고 👯" },
      join: { label: "정우도 합류", done: "정우까지 합류! 넷이서 신나게 놀았다 🎉" },
    },
  },
  snack: {
    emoji: "🍗",
    title: "야식 번개!",
    body: "밤 11시, 혜진이가 갑자기 치킨이 먹고 싶대요.",
    choices: { order: { label: "치킨 시킨다", done: "야식은 진리. 둘 다 배부르고 행복 🍗" } },
  },
  rain: {
    emoji: "🌧️",
    title: "갑자기 소나기!",
    body: "퇴근길에 비가 쏟아지는데 혜진이가 우산이 없대요.",
    choices: {
      pickup: { label: "우산 들고 마중 간다", done: "우산 하나에 둘이 쏙. 정우 어깨는 다 젖었지만 혜진이는 감동 ☔" },
      taxi: { label: "택시비 보내준다", done: "택시 타고 뽀송하게 귀가. 혜진이 고마워해요 🚕" },
    },
  },
  karaoke: {
    emoji: "🎤",
    title: "코인노래방 번개",
    body: "혜진이가 갑자기 노래가 부르고 싶대요.",
    choices: {
      together: { label: "같이 간다", done: "듀엣까지 완벽. 목 다 쉬었지만 신났다 🎤" },
      solo: { label: "혼자 다녀오라 한다", done: "혜진이 혼자 콘서트 한 판. 그래도 기분 좋대요 🎶" },
    },
  },
  dessert: {
    emoji: "🍰",
    title: "편의점 신상 디저트",
    body: "혜진이가 SNS에서 편의점 신상 디저트를 봤대요. 먹고 싶다고 눈빛 발사 중.",
    choices: {
      buy: { label: "사다 준다", done: "신상 디저트 득템! 혜진이 한 입 먹고 눈이 반짝 ✨" },
      hanjeongseon: { label: "한정선으로 달랜다", done: "\"신상보다 한정선이지!\" 혜진이 금방 넘어왔다 🍡" },
    },
  },
  newgame: {
    emoji: "🕹️",
    title: "정우 게임 신작 출시",
    body: "기다리던 게임이 나왔어요. 정우가 오늘 밤새 하고 싶대요…",
    choices: {
      allow: { label: "오늘만 허락한다", done: "정우 신났다! 혜진이는 살짝 서운한 눈치 🕹️" },
      date: { label: "게임 대신 혜진이랑", done: "게임은 내일로. 혜진이 옆에 딱 붙어 있었다 💕" },
    },
  },
  homebody: {
    emoji: "🛋️",
    title: "주말 집콕",
    body: "밖에 나가기 귀찮은 주말. 둘 다 소파와 한 몸이 되고 싶대요.",
    choices: { netflix: { label: "넷플릭스 정주행", done: "담요 덮고 정주행. 이게 행복이지 🍿" } },
  },
  parcel: {
    emoji: "📦",
    title: "택배 왔어요",
    body: "혜진이가 몰래 시킨 택배가 도착했어요. 결제는 정우 카드로 되어 있는데…?",
    choices: {
      pay: { label: "쿨하게 내가 낸다", done: "혜진이 언박싱하며 신났다. 정우 지갑은 가벼워졌다 📦" },
      half: { label: "반반 하자고 한다", done: "\"치사해!\" 하면서도 혜진이 웃는다 😤" },
    },
  },
  yeppi: {
    emoji: "🐶",
    title: "예삐가 놀러 왔어요",
    body: "하얀 말티즈 예삐가 놀러 왔어요. 꼬리가 프로펠러처럼 돌아가는 중!",
    choices: {
      walk: { label: "다 같이 산책", done: "셋이서 동네 한 바퀴. 예삐가 제일 신났다 🐾" },
      treat: { label: "간식 사준다", done: "예삐 간식 냠냠. 혜진이는 예삐 보고 녹아내림 🦴" },
    },
  },
  payday: {
    emoji: "💸",
    title: "오늘은 월급날!",
    body: `정우 월급 ${formatMoney(BALANCE.SOCIAL.PAYDAY_SALARY)}이 들어왔어요! 혜진이가 "오늘 뭐 사줄 거야?" 하고 물어봐요.`,
    choices: {
      save: { label: "통장에 고이 넣는다", done: "월급 그대로 저축. 정우 마음이 든든하다 💰" },
      treat: { label: "혜진이 맛있는 거 사준다", done: "월급날 외식! 혜진이 볼이 빵빵 🍽️" },
      hanjeongseon: { label: "한정선 왕창 사온다", done: "월급 털어 한정선 3개! 냉동실이 든든해졌다 🍡" },
    },
  },
  anniversary: {
    emoji: "🎂",
    title: "오늘은 기념일!",
    body: "사귄 지 100일 단위가 되는 날이에요. 주말이면 오늘 데이트는 별이 하나 더 붙어요!",
    choices: {
      cake: { label: "케이크랑 편지", done: "촛불 끄고 편지 낭독. 혜진이 눈물 찔끔 🎂" },
      flowers: { label: "꽃다발 선물", done: "꽃다발 받고 혜진이 활짝 💐" },
    },
  },
};

/** 이벤트 탭(도감) 문구 */
export const STORY_TEXT: Record<StoryEventId, { emoji: string; title: string; caption: string }> = {
  bulldak: { emoji: "🌶️", title: "불닭이 땡기는 밤", caption: "평일 아침, 혜진이가 오늘 밤 불닭이 먹고 싶대요." },
  poker: { emoji: SOCIAL_TEXT.poker.emoji, title: "번개 포커", caption: "정우 친구들이랑 밤새 포커 한 판." },
  friends: { emoji: SOCIAL_TEXT.friends.emoji, title: "민정·다은이랑", caption: "혜진이가 민정이, 다은이랑 놀러 간 날." },
  snack: { emoji: SOCIAL_TEXT.snack.emoji, title: "야식 번개", caption: "밤 11시에 갑자기 치킨." },
  rain: { emoji: SOCIAL_TEXT.rain.emoji, title: "갑자기 소나기", caption: "퇴근길에 우산 없는 혜진이." },
  karaoke: { emoji: SOCIAL_TEXT.karaoke.emoji, title: "코인노래방 번개", caption: "갑자기 노래가 부르고 싶은 날." },
  dessert: { emoji: SOCIAL_TEXT.dessert.emoji, title: "편의점 신상 디저트", caption: "SNS에서 본 신상은 못 참지." },
  newgame: { emoji: SOCIAL_TEXT.newgame.emoji, title: "게임 신작 출시", caption: "정우가 기다리던 게임이 나왔어요." },
  homebody: { emoji: SOCIAL_TEXT.homebody.emoji, title: "주말 집콕", caption: "소파와 한 몸이 된 주말." },
  parcel: { emoji: SOCIAL_TEXT.parcel.emoji, title: "택배 왔어요", caption: "결제는 정우 카드로…?" },
  yeppi: { emoji: SOCIAL_TEXT.yeppi.emoji, title: "예삐가 놀러 왔어요", caption: "하얀 말티즈 예삐랑 노는 날." },
  cold: { emoji: "🤒", title: "혜진이 감기", caption: "콜록콜록, 정우가 죽을 사 왔어요." },
  payday: { emoji: SOCIAL_TEXT.payday.emoji, title: "월급날", caption: "오늘 뭐 사줄 거야?" },
  anniversary: { emoji: SOCIAL_TEXT.anniversary.emoji, title: "기념일", caption: "사귄 지 100일 단위가 되는 날." },
  sulk: { emoji: "😤", title: "정우 삐짐", caption: "웨이팅 또 가라니까 정우가 방에 들어가 버렸어요." },
  promoted: { emoji: "📈", title: "정우 승진", caption: "열심히 일한 정우가 승진했어요." },
  block: { emoji: "🙅‍♂️", title: "냉동실 사수", caption: "정우가 냉동실 앞을 몸으로 막아섰어요." },
  raid: { emoji: "🧊", title: "냉동실 털림", caption: "혜진이가 냉동실 한정선을 절반 먹어치웠어요." },
};
