"use client";

import { useEffect, useState } from "react";
import { EVENT_ART } from "@/content/eventArt";
import { STORY_EVENTS } from "@/game/seen";
import type { StoryEventId } from "@/game/types";
import { STORY_TEXT } from "@/ui/copy";
import type { GameView } from "@/ui/useGame";
import { PlaceArt } from "./ArtSlots";
import { Card, Hint } from "./controls";
import styles from "./map.module.css";
import popup from "./popup.module.css";

/** 이벤트 그림 크게 보기 */
function EventViewer({ id, onClose }: { id: StoryEventId; onClose: () => void }) {
  const text = STORY_TEXT[id];
  const art = EVENT_ART[id];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={popup.backdrop} onClick={onClose}>
      <div className={popup.sheet} role="dialog" aria-modal aria-labelledby="event-title" onClick={(e) => e.stopPropagation()}>
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element -- 연출용 고정 그림
          <img className={popup.scene} src={art} alt={text.title} draggable={false} />
        ) : (
          <div className={popup.emoji} aria-hidden>
            {text.emoji}
          </div>
        )}
        <h2 id="event-title" className={popup.title}>
          {text.emoji} {text.title}
        </h2>
        <p className={popup.lead}>{text.caption}</p>
        <button type="button" className={popup.ok} onClick={onClose} autoFocus>
          닫기
        </button>
      </div>
    </div>
  );
}

/** 이벤트 도감: 지금까지 만난 이벤트 그림 모아보기. 누르면 크게 본다 */
export default function EventsPanel({ view }: { view: GameView }) {
  const [open, setOpen] = useState<StoryEventId | null>(null);
  const seen = view.game?.state.seenEvents;
  if (!seen) return null;

  return (
    <Card title={`🎬 이벤트 (${seen.length}/${STORY_EVENTS.length})`}>
      <ol className={styles.grid}>
        {STORY_EVENTS.map((id) => {
          const text = STORY_TEXT[id];
          return seen.includes(id) ? (
            <li key={id}>
              <button type="button" className={styles.spot} onClick={() => setOpen(id)} aria-label={`${text.title} 크게 보기`}>
                <PlaceArt url={EVENT_ART[id] ?? undefined} label={text.title} emoji={text.emoji} />
                <span className={styles.name}>{text.title}</span>
                <span className={styles.meta}>{text.caption}</span>
              </button>
            </li>
          ) : (
            <li key={id}>
              <div className={`${styles.spot} ${styles.lockedSpot}`}>
                <PlaceArt locked label="아직 못 만난 이벤트" />
                <span className={styles.name}>???</span>
                <span className={styles.meta}>아직 못 만난 이벤트</span>
              </div>
            </li>
          );
        })}
      </ol>
      <Hint>게임하다 보면 이벤트가 하나씩 모여요. 누르면 크게 볼 수 있어요.</Hint>
      {open && <EventViewer id={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}
