import { BALANCE } from "@/game";
import type { ActionError, SocialEventId, StoryEventId } from "@/game/types";

/** 화면 문구. 톤: "정우를 부려먹어서 혜진이를 키우는 게임" */

export const ERROR_TEXT: Record<ActionError, string> = {
  NO_ACTIONS_LEFT: "정우가 오늘은 녹초가 됐다. 이제 자러 가자 🌙",
  NOT_ENOUGH_ACTIONS: `데이트는 정우 행동이 ${BALANCE.ACTIONS.DATE.ACTION_COST}번 남아 있어야 갈 수 있어요.`,
  NOT_ENOUGH_MONEY: "돈이 모자라요. 정우를 더 일 시키자 💼",
  NOT_ENOUGH_HANJEONGSEON: "한정선이 모자라요. 정우를 웨이팅 보내자 🍡",
  INVALID_QUANTITY: "개수를 다시 골라주세요.",
  NO_BULLDAK_EVENT: "지금은 불닭이 안 땡긴대요.",
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
  INVALID_CHOICE: "다시 골라주세요.",
};

export const SULKING_TEXT = "정우가 삐져서 방에 들어갔다… 자고 일어나면 풀려요.";
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
};

/** 이벤트 탭(도감) 문구 */
export const STORY_TEXT: Record<StoryEventId, { emoji: string; title: string; caption: string }> = {
  bulldak: { emoji: "🌶️", title: "불닭이 땡기는 밤", caption: "평일 아침, 혜진이가 오늘 밤 불닭이 먹고 싶대요." },
  poker: { emoji: SOCIAL_TEXT.poker.emoji, title: "번개 포커", caption: "정우 친구들이랑 밤새 포커 한 판." },
  friends: { emoji: SOCIAL_TEXT.friends.emoji, title: "민정·다은이랑", caption: "혜진이가 민정이, 다은이랑 놀러 간 날." },
  snack: { emoji: SOCIAL_TEXT.snack.emoji, title: "야식 번개", caption: "밤 11시에 갑자기 치킨." },
  sulk: { emoji: "😤", title: "정우 삐짐", caption: "웨이팅 또 가라니까 정우가 방에 들어가 버렸어요." },
  promoted: { emoji: "📈", title: "정우 승진", caption: "열심히 일한 정우가 승진했어요." },
  block: { emoji: "🙅‍♂️", title: "냉동실 사수", caption: "정우가 냉동실 앞을 몸으로 막아섰어요." },
  raid: { emoji: "🧊", title: "냉동실 털림", caption: "혜진이가 냉동실 한정선을 절반 먹어치웠어요." },
};
