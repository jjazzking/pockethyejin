import type { JungwooPose } from "@/content/types";
import { isWarning } from "@/game/hyejin";
import type { Action } from "@/game/types";
import type { PlayFlavor } from "./copy";

/**
 * 혜진 기분까지 따져 실제로 세울 포즈. 평소 모습일 때 혜진이 경고 구간(30 이하)이면 눈치 보는 정우.
 * (그림이 없으면 pickJungwooPose가 idle로 대신한다)
 */
export function resolveJungwooPose(pose: JungwooPose, hyejinHappiness: number): JungwooPose {
  return pose === "idle" && isWarning(hyejinHappiness) ? "apologize" : pose;
}

/** 방금 시킨 행동 → 정우 카드에 세울 포즈. 정우가 직접 하지 않는 행동은 평소 모습. */
export function jungwooPoseFor(action: Action, playFlavor: PlayFlavor = "dj"): JungwooPose {
  switch (action.type) {
    case "work":
      return "work";
    case "waiting":
      return "waiting";
    case "playAlone":
      return playFlavor === "game" ? "play_game" : "play_dj";
    case "convenienceStore":
    case "porridge":
      return "run";
    default:
      return "idle";
  }
}
