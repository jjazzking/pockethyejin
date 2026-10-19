"use client";

import { useEffect, useState } from "react";
import { buildMap } from "@/content/places";
import { isMaxLevel } from "@/game/places";
import { levelUpCost } from "@/game/rules";
import { WAITING_FOR_UPDATE_TEXT } from "@/ui/copy";
import type { Place } from "@/content/types";
import type { GameView } from "@/ui/useGame";
import { PlaceArt } from "./ArtSlots";
import { Button, Card, Hint, StarRow } from "./controls";
import styles from "./map.module.css";
import popup from "./popup.module.css";

/** 해금된 장소의 추억 사진을 옆으로 넘겨 본다 */
function PhotoViewer({ place, urls, onClose }: { place: Place; urls: ReadonlyMap<string, string>; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={popup.backdrop} onClick={onClose}>
      <div className={popup.sheet} role="dialog" aria-modal aria-labelledby="photos-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="photos-title" className={popup.title}>
          📷 {place.name}
        </h2>
        <ul className={styles.strip}>
          {place.photos.map((path, i) => (
            <li key={path}>
              <PlaceArt url={urls.get(path)} label={`${place.name} 사진 ${i + 1}`} />
            </li>
          ))}
        </ul>
        <p className={popup.dim}>옆으로 넘겨 보세요 · {place.photos.length}장</p>
        <Button variant="primary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

export default function MapPanel({ view, onPickPlace }: { view: GameView; onPickPlace?: (placeId: string) => void }) {
  const { game, content } = view;
  const [viewing, setViewing] = useState<Place | null>(null);
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
            <li key={spot.place.id} className={styles.cell}>
              <button type="button" className={styles.spot} onClick={() => onPickPlace?.(spot.place.id)}>
                <PlaceArt url={spot.place.image ? content.placeUrls.get(spot.place.image) : undefined} label={spot.place.name} />
                <span className={styles.name}>
                  {spot.place.order}. {spot.place.name}
                </span>
                {spot.place.date && <span className={styles.meta}>{spot.place.date.replaceAll("-", ".")}</span>}
                <StarRow stars={spot.bestStars} />
              </button>
              {spot.place.photos.length > 1 && (
                <button type="button" className={styles.photosButton} onClick={() => setViewing(spot.place)}>
                  📷 추억 사진 {spot.place.photos.length}장
                </button>
              )}
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
      {viewing && <PhotoViewer place={viewing} urls={content.placeUrls} onClose={() => setViewing(null)} />}
    </Card>
  );
}
