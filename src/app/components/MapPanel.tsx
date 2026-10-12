"use client";

import { buildMap } from "@/content/places";
import { isMaxLevel } from "@/game/places";
import { levelUpCost } from "@/game/rules";
import { WAITING_FOR_UPDATE_TEXT } from "@/ui/copy";
import type { GameView } from "@/ui/useGame";
import { PlaceArt } from "./ArtSlots";
import { Card, Hint, StarRow } from "./controls";
import styles from "./map.module.css";

export default function MapPanel({ view, onPickPlace }: { view: GameView; onPickPlace?: (placeId: string) => void }) {
  const { game, content } = view;
  if (!game || !content) return null;
  const state = game.state;
  const map = buildMap(content.places, state);
  const unlocked = map.filter((s) => s.unlocked).length;

  return (
    <Card title={`🗺️ 추억 지도 (${unlocked}/${map.length})`}>
      {map.length === 0 && <Hint>아직 등록된 장소가 없어요.</Hint>}
      <ol className={styles.grid}>
        {map.map((spot) =>
          spot.unlocked ? (
            <li key={spot.place.id}>
              <button type="button" className={styles.spot} onClick={() => onPickPlace?.(spot.place.id)}>
                <PlaceArt url={spot.place.image ? content.placeUrls.get(spot.place.image) : undefined} label={spot.place.name} />
                <span className={styles.name}>
                  {spot.place.order}. {spot.place.name}
                </span>
                {spot.place.date && <span className={styles.meta}>{spot.place.date.replaceAll("-", ".")}</span>}
                <StarRow stars={spot.bestStars} />
              </button>
            </li>
          ) : (
            <li key={`locked-${spot.order}`}>
              <div className={`${styles.spot} ${styles.lockedSpot}`}>
                <PlaceArt locked label="잠긴 장소" />
                <span className={styles.name}>{spot.order}. ???</span>
                <span className={styles.meta}>레벨 {spot.order}에 열려요</span>
              </div>
            </li>
          ),
        )}
      </ol>
      {isMaxLevel(state, content.places.length) ? (
        <Hint>🗺️ {WAITING_FOR_UPDATE_TEXT}</Hint>
      ) : (
        <Hint>다음 장소까지 한정선 {levelUpCost(state.hyejin.level)}개 (메인 화면에서 레벨업)</Hint>
      )}
    </Card>
  );
}
