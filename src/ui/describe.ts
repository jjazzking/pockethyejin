import { faceTagForEvent } from "@/content/images";
import type { FaceEventTag, JungwooFaceTag, Place } from "@/content/types";
import type { NightSummary } from "@/game/summary";
import type { GameEvent, Stars } from "@/game/types";
import { PLAY_ALONE_FLAVORS, SOCIAL_TEXT, formatMoney, rankName, type PlayFlavor } from "./copy";

/** 화면에 띄울 팝업 (얼굴 그림은 띄울 때 faceTag로 고른다. 정우가 주인공이면 jungwooFace로 정우 얼굴) */
export type PopupSpec =
  | {
      kind: "card";
      emoji: string;
      title: string;
      body?: string;
      faceTag: FaceEventTag | null;
      jungwooFace?: JungwooFaceTag;
      tone?: "danger";
    }
  /** 정우 막기 전용 연출 */
  | { kind: "block"; faceTag: FaceEventTag }
  /** 웨이팅 연출: 정우가 갈지 말지 뜸 들인 뒤 결과. quantity가 null이면 삐짐. luck: 1+1 / 앞에서 품절 */
  | { kind: "waiting"; quantity: number | null; luck?: "extra" | "short"; faceTag: null; jungwooFace?: JungwooFaceTag }
  | { kind: "summary"; summary: NightSummary; faceTag: FaceEventTag }
  | { kind: "date"; place: Place | null; stars: Stars; newBest: boolean; firstVisit: boolean; faceTag: FaceEventTag };

export interface Described {
  popups: PopupSpec[];
  /** 잠깐 떴다 사라지는 한 줄 알림 */
  toasts: string[];
}

export interface DescribeOptions {
  /** 잠자기 결과의 "밤사이 있었던 일" 요약 */
  summary: NightSummary | null;
  places: readonly Place[];
  /** 혼자 놀기 연출 (디제잉/게임) */
  playFlavor?: PlayFlavor;
}

/** 이벤트 하나 → 팝업 또는 토스트. 아무것도 안 띄우면 null. */
function describeEvent(event: GameEvent, opts: DescribeOptions): PopupSpec | string | null {
  const faceTag = faceTagForEvent(event);
  switch (event.type) {
    case "worked":
      if (event.luck === "bonus") return `상사 칭찬받고 보너스까지! ${formatMoney(event.income)} 벌어왔다 🎉`;
      if (event.luck === "overtime") return `야근까지 하고 ${formatMoney(event.income)} 벌어왔다… 정우 녹초 🥱`;
      return `정우가 출근해서 ${formatMoney(event.income)} 벌어왔다 💼`;
    case "promoted":
      return { kind: "card", emoji: "🎉", title: `정우 승진! ${rankName(event.rank)}`, body: "이제 일 한 번에 더 많이 벌어온다.", faceTag: null, jungwooFace: "happy" };
    case "waitingDone":
      return { kind: "waiting", quantity: event.quantity, ...(event.luck && { luck: event.luck }), faceTag: null };
    case "waitingRejected":
      return { kind: "waiting", quantity: null, faceTag: null, jungwooFace: "sulk" };
    case "playedAlone":
      return PLAY_ALONE_FLAVORS[opts.playFlavor ?? "dj"].done;
    case "playedTogether":
      if (event.luck === "fight")
        return { kind: "card", emoji: "😤", title: "놀다가 투닥투닥…", body: "사소한 걸로 말다툼. 분위기가 싸해졌다.", faceTag: "warning", tone: "danger" };
      if (event.luck === "great") return { kind: "card", emoji: "📸", title: "인생샷 건졌다!", body: "오늘 노는 거 대성공. 둘 다 기분 최고!", faceTag };
      return { kind: "card", emoji: "💞", title: "같이 놀았다!", body: "혜진이도 정우도 기분 최고.", faceTag };
    case "kissed":
      return { kind: "card", emoji: "💋", title: "혜진이가 뽀뽀해줬다!", body: "쓰다듬어 줬더니 볼에 쪽. 정우 기분 최고.", faceTag: "play_together" };
    case "hyejinSick":
      return {
        kind: "card",
        emoji: "🤒",
        title: "혜진이가 감기에 걸렸다…",
        body: "오늘은 같이 못 놀고, 행복도도 반만 올라요. 죽을 사다 주면 금방 나아요.",
        faceTag: "warning",
      };
    case "porridgeDelivered":
      return { kind: "card", emoji: "🥣", title: "죽 배달 완료!", body: "따끈한 죽 먹고 혜진이 감기가 싹 나았다.", faceTag: null, jungwooFace: "happy" };
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
      return { kind: "card", emoji: "🌶️", title: "혜진이가 불닭이 땡긴다!", body: "자기 전에 정우를 편의점에 보내주세요.", faceTag };
    case "socialEvent": {
      const t = SOCIAL_TEXT[event.event];
      return { kind: "card", emoji: t.emoji, title: t.title, body: `${t.body} 메인 화면에서 골라주세요. (행동은 안 써요)`, faceTag: "play_together" };
    }
    case "socialDone":
      return SOCIAL_TEXT[event.event].choices[event.choice]?.done ?? null;
    case "socialSkipped":
      return null;
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
 * 잠자기로 넘어간 밤의 이벤트는 "밤사이 있었던 일" 요약 하나로 묶고, 새 아침 불닭만 따로 알린다.
 */
export function describeEvents(events: readonly GameEvent[], opts: DescribeOptions): Described {
  const popups: PopupSpec[] = [];
  const toasts: string[] = [];

  let rest = events;
  if (opts.summary) {
    popups.push({ kind: "summary", summary: opts.summary, faceTag: "away_summary" });
    // "새 날 아침"까지는 요약에 담겨 있다. 그 뒤(아침 불닭 등)만 따로 알린다.
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
