import { faceTagForEvent } from "@/content/images";
import type { FaceEventTag, Place } from "@/content/types";
import type { AwaySummary } from "@/game/summary";
import type { GameEvent, Stars } from "@/game/types";
import { PLAY_ALONE_FLAVORS, formatMoney, rankName, type PlayFlavor } from "./copy";

/** 화면에 띄울 팝업 (얼굴 그림은 띄울 때 faceTag로 고른다) */
export type PopupSpec =
  | { kind: "card"; emoji: string; title: string; body?: string; faceTag: FaceEventTag | null; tone?: "danger" }
  /** 정우 막기 전용 연출 */
  | { kind: "block"; faceTag: FaceEventTag }
  | { kind: "summary"; summary: AwaySummary; faceTag: FaceEventTag }
  | { kind: "date"; place: Place | null; stars: Stars; newBest: boolean; firstVisit: boolean; faceTag: FaceEventTag };

export interface Described {
  popups: PopupSpec[];
  /** 잠깐 떴다 사라지는 한 줄 알림 */
  toasts: string[];
}

export interface DescribeOptions {
  /** 이번 결과에 포함된 "자리를 비운 동안" 요약 */
  summary: AwaySummary | null;
  places: readonly Place[];
  /** 혼자 놀기 연출 (디제잉/게임) */
  playFlavor?: PlayFlavor;
}

/** 이벤트 하나 → 팝업 또는 토스트. 아무것도 안 띄우면 null. */
function describeEvent(event: GameEvent, opts: DescribeOptions): PopupSpec | string | null {
  const faceTag = faceTagForEvent(event);
  switch (event.type) {
    case "worked":
      return `정우가 출근해서 ${formatMoney(event.income)} 벌어왔다 💼`;
    case "promoted":
      return { kind: "card", emoji: "🎉", title: `정우 승진! ${rankName(event.rank)}`, body: "이제 일 한 번에 더 많이 벌어온다.", faceTag: null };
    case "waitingDone":
      return `정우가 땡볕에 줄 서서 한정선 ${event.quantity}개를 사왔다 🍡`;
    case "waitingRejected":
      return { kind: "card", emoji: "🚪", title: "정우가 삐져서 방에 들어갔다…", body: "오늘은 더 못 시켜요. 자고 나면 풀린대요.", faceTag: null };
    case "playedAlone":
      return PLAY_ALONE_FLAVORS[opts.playFlavor ?? "dj"].done;
    case "playedTogether":
      return { kind: "card", emoji: "💞", title: "같이 놀았다!", body: "혜진이도 정우도 기분 최고.", faceTag };
    case "bulldakResolved":
      return { kind: "card", emoji: "🔥", title: "불닭 배달 완료!", body: "정우가 편의점까지 뛰어갔다 왔다. 혜진이 매운맛 충전 완료.", faceTag };
    case "fed":
      return { kind: "card", emoji: "🍡", title: `한정선 ${event.count}개 냠냠`, body: "혜진이 볼이 빵빵해졌다.", faceTag };
    case "leveledUp":
      return { kind: "card", emoji: "⭐", title: `혜진이 레벨 ${event.level}!`, body: "맵에 새 장소가 열렸다.", faceTag };
    case "dated": {
      const place = opts.places.find((p) => p.id === event.placeId) ?? null;
      return { kind: "date", place, stars: event.stars, newBest: event.newBest, firstVisit: event.firstVisit, faceTag: faceTag! };
    }
    case "warningStarted":
      return { kind: "card", emoji: "🧊", title: "혜진이가 냉동실을 힐끔거린다", body: "기분이 안 좋아 보여요. 놀아주거나 한정선을 먹여주세요.", faceTag, tone: "danger" };
    case "warningEnded":
      return "혜진이 기분이 좀 풀렸다 😌";
    case "countdownStarted":
      return {
        kind: "card",
        emoji: "⏳",
        title: "혜진이가 냉동실 앞을 서성인다!",
        body: `${event.turnsLeft}턴 안에 기분을 풀어주지 않으면 한정선이 위험해요.`,
        faceTag,
        tone: "danger",
      };
    case "countdownTicked":
      return `냉동실까지 ${event.turnsLeft}턴… 🧊`;
    case "countdownCancelled":
      return "휴, 혜진이가 냉동실에서 멀어졌다 😮‍💨";
    case "jungwooBlocked":
      return { kind: "block", faceTag: faceTag! };
    case "halfEaten":
      return {
        kind: "card",
        emoji: "😱",
        title: `혜진이가 한정선 ${event.eaten}개를 먹어치웠다!`,
        body: event.eaten > 0 ? `행복도가 ${event.recovered} 올랐지만… 냉동실이 텅 비어간다.` : "먹을 한정선도 없었다…",
        faceTag,
        tone: "danger",
      };
    case "bulldakCraving":
      return { kind: "card", emoji: "🌶️", title: "혜진이가 불닭이 땡긴다!", body: "오늘 안에 정우를 편의점에 보내주세요.", faceTag };
    case "newPlacesAdded":
      return {
        kind: "card",
        emoji: "🗺️",
        title: "새 추억이 추가됐어요!",
        body: event.levelCapRaised ? `맵에 장소 ${event.count}곳이 늘었어요. 다시 레벨업할 수 있어요!` : `맵에 장소 ${event.count}곳이 늘었어요.`,
        faceTag,
      };
    case "dayEnded":
    case "dayStarted":
      return null;
  }
}

/**
 * 엔진 이벤트 → 팝업·토스트 목록.
 * 밀린 날 정산 이벤트는 "자리를 비운 동안" 요약 하나로 묶고, 오늘 아침 불닭만 따로 알린다.
 */
export function describeEvents(events: readonly GameEvent[], opts: DescribeOptions): Described {
  const popups: PopupSpec[] = [];
  const toasts: string[] = [];

  let rest = events;
  if (opts.summary) {
    popups.push({ kind: "summary", summary: opts.summary, faceTag: "away_summary" });
    // 마지막 "새 날 아침"까지는 요약에 담겨 있다. 그 뒤(오늘 아침 불닭, 새 추억, 행동 결과)만 따로 알린다.
    const lastDayStart = events.findLastIndex((e) => e.type === "dayStarted");
    rest = events.slice(lastDayStart + 1);
  }

  for (const event of rest) {
    const d = describeEvent(event, opts);
    if (d === null) continue;
    if (typeof d === "string") toasts.push(d);
    else popups.push(d);
  }
  return { popups, toasts };
}
