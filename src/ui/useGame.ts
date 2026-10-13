"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickFace, pickFullBody, pickJungwooFace, pickJungwooPose } from "@/content/images";
import type { CharacterImage, JungwooPose, Place } from "@/content/types";
import { applyAction } from "@/game/engine";
import type { AwaySummary } from "@/game/summary";
import type { Action, ActionError, GameEvent, GameState } from "@/game/types";
import { NewerSchemaError } from "@/persistence/schema";
import { openGame, performAction, type SessionDeps } from "@/persistence/session";
import type { StoredGame } from "@/persistence/store";
import { CONFLICT_TEXT, ERROR_TEXT, SYNCED_TEXT, type PlayFlavor } from "./copy";
import { describeEvents, type PopupSpec } from "./describe";
import { jungwooPoseFor } from "./jungwooPose";

export interface Content {
  places: Place[];
  images: CharacterImage[];
  /** 캐릭터 그림 경로 → 표시 URL */
  imageUrls: Map<string, string>;
  /** 장소 사진 경로 → 표시 URL */
  placeUrls: Map<string, string>;
}

/** face: 팝업 얼굴 (보통 혜진, 정우 팝업이면 정우). jungwoo: 정우 막기 연출에 세울 정우 전신 */
export type Popup = PopupSpec & { id: number; face: CharacterImage | null; jungwoo: CharacterImage | null };
export interface Toast {
  id: number;
  text: string;
}

const TOAST_MS = 2600;
/** 버튼 활성화 판정용 난수. 판정 결과는 버리므로 값은 상관없다. */
const DRY_RUN_RNG = () => 0.5;

export function useGame(deps: SessionDeps, loadContent: () => Promise<Content>) {
  const [content, setContent] = useState<Content | null>(null);
  const [game, setGame] = useState<StoredGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fullBodyId, setFullBodyId] = useState<string | null>(null);
  const [jungwooId, setJungwooId] = useState<string | null>(null);
  const nextId = useRef(1);

  const rotate = useCallback((images: CharacterImage[], state: GameState) => {
    setFullBodyId((prev) => pickFullBody(images, state.hyejin.happiness, prev, Math.random)?.id ?? null);
  }, []);

  const poseJungwoo = useCallback((images: CharacterImage[], state: GameState, pose: JungwooPose) => {
    setJungwooId((prev) => pickJungwooPose(images, pose, state.jungwoo.sulking, prev, Math.random)?.id ?? null);
  }, []);

  const show = useCallback(
    (loaded: Content, events: GameEvent[], summary: AwaySummary | null, playFlavor?: PlayFlavor) => {
      const described = describeEvents(events, { summary, places: loaded.places, playFlavor });
      if (described.popups.length > 0) {
        const resolved = described.popups.map((p) => ({
          ...p,
          id: nextId.current++,
          face: p.faceTag
            ? pickFace(loaded.images, p.faceTag, Math.random)
            : p.kind === "card" && p.jungwooFace
              ? pickJungwooFace(loaded.images, p.jungwooFace, Math.random)
              : null,
          jungwoo: p.kind === "block" ? pickJungwooPose(loaded.images, "run", false, null, Math.random) : null,
        }));
        setPopups((queue) => [...queue, ...resolved]);
      }
      for (const text of described.toasts) {
        const id = nextId.current++;
        setToasts((list) => [...list.slice(-2), { id, text }]);
        setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), TOAST_MS);
      }
    },
    [],
  );

  const sync = useCallback(
    () =>
      loadContent()
        .then(async (loaded) => {
          const result = await openGame(deps, loaded.places);
          setContent(loaded);
          setGame(result.game);
          rotate(loaded.images, result.game.state);
          poseJungwoo(loaded.images, result.game.state, "idle");
          show(loaded, result.events, result.summary);
          if (result.syncedFromOtherDevice) setNotice(SYNCED_TEXT);
        })
        .catch((e) =>
          setError(
            e instanceof NewerSchemaError
              ? "앱이 업데이트됐어요. 페이지를 새로고침해 주세요."
              : "불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        ),
    [deps, loadContent, poseJungwoo, rotate, show],
  );

  useEffect(() => {
    sync();
    // 다른 기기에서 플레이하다 돌아왔을 때 최신 상태로 맞춘다. (장소·그림 추가도 이때 반영)
    const onVisible = () => document.visibilityState === "visible" && sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sync]);

  /** 정우·혜진 행동 실행. 규칙은 전부 엔진이 판정한다. */
  const run = useCallback(
    async (action: Action, opts: { playFlavor?: PlayFlavor } = {}) => {
      if (!game || !content || busy) return;
      setBusy(true);
      setNotice(null);
      try {
        const outcome = await performAction(deps, game, action, content.places);
        setGame(outcome.game);
        rotate(content.images, outcome.game.state);
        if (outcome.kind === "done") poseJungwoo(content.images, outcome.game.state, jungwooPoseFor(action, opts.playFlavor));
        show(content, outcome.events, outcome.summary, opts.playFlavor);
        if (outcome.kind === "conflict") setNotice(CONFLICT_TEXT);
        if (outcome.kind === "invalid") setNotice(ERROR_TEXT[outcome.error]);
      } catch {
        setNotice("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setBusy(false);
      }
    },
    [busy, content, deps, game, poseJungwoo, rotate, show],
  );

  /** 지금 이 행동을 할 수 있는지 엔진에 물어본다 (상태는 바꾸지 않음). 할 수 있으면 null. */
  const check = useCallback(
    (action: Action): ActionError | null => {
      if (!game || !content) return null;
      const result = applyAction(game.state, action, { rng: DRY_RUN_RNG, places: content.places });
      return result.ok ? null : result.error;
    },
    [content, game],
  );

  const fullBody = content?.images.find((img) => img.id === fullBodyId) ?? null;
  const jungwoo = content?.images.find((img) => img.id === jungwooId) ?? null;

  return {
    content,
    game,
    error,
    busy,
    notice,
    clearNotice: () => setNotice(null),
    popup: popups[0] ?? null,
    dismissPopup: () => setPopups((queue) => queue.slice(1)),
    toasts,
    fullBody,
    jungwoo,
    tapHyejin: () => content && game && rotate(content.images, game.state),
    run,
    check,
  };
}

export type GameView = ReturnType<typeof useGame>;
