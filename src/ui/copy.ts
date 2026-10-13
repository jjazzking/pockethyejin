import { BALANCE } from "@/game";
import type { ActionError } from "@/game/types";

/** 화면 문구. 톤: "정우를 부려먹어서 혜진이를 키우는 게임" */

export const ERROR_TEXT: Record<ActionError, string> = {
  NO_ACTIONS_LEFT: "정우가 오늘은 녹초가 됐다. 내일 아침 6시에 다시 부려먹자.",
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
};

export const SULKING_TEXT = "정우가 삐져서 방에 들어갔다… 내일 아침엔 풀려요.";
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
