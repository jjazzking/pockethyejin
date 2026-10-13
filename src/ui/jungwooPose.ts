import type { JungwooPose } from "@/content/types";
import type { Action } from "@/game/types";
import type { PlayFlavor } from "./copy";

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
      return "run";
    default:
      return "idle";
  }
}
