"use client";

import { EVENT_ART } from "@/content/eventArt";
import { STORY_EVENTS } from "@/game/seen";
import { STORY_TEXT } from "@/ui/copy";
import type { GameView } from "@/ui/useGame";
import { PlaceArt } from "./ArtSlots";
import { Card, Hint } from "./controls";
import styles from "./map.module.css";

/** 이벤트 도감: 지금까지 만난 이벤트 그림 모아보기 */
export default function EventsPanel({ view }: { view: GameView }) {
  const seen = view.game?.state.seenEvents;
  if (!seen) return null;

  return (
    <Card title={`🎬 이벤트 (${seen.length}/${STORY_EVENTS.length})`}>
      <ol className={styles.grid}>
        {STORY_EVENTS.map((id) => {
          const text = STORY_TEXT[id];
          return seen.includes(id) ? (
            <li key={id}>
              <div className={styles.spot}>
                <PlaceArt url={EVENT_ART[id] ?? undefined} label={text.title} emoji={text.emoji} />
                <span className={styles.name}>{text.title}</span>
                <span className={styles.meta}>{text.caption}</span>
              </div>
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
      <Hint>게임하다 보면 이벤트가 하나씩 모여요.</Hint>
    </Card>
  );
}
