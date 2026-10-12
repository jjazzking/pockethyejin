/*
 * 아직 아트가 없는 자리들. 나중에 그림이 생기면 이 컴포넌트 안만 바꾸면 된다.
 * (혜진 그림은 CharacterFrame이 character_images 선택 함수 결과로 그린다)
 */
import styles from "./art.module.css";

/** 장소 사진 자리. 사진이 없으면 도형 + 이모지 */
export function PlaceArt({ url, locked, label }: { url?: string; locked?: boolean; label: string }) {
  if (locked) {
    return (
      <span className={`${styles.place} ${styles.locked}`} role="img" aria-label="잠긴 장소">
        🔒
      </span>
    );
  }
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- Storage 서명 URL
    return <img className={`${styles.place} ${styles.photo}`} src={url} alt={label} draggable={false} />;
  }
  return (
    <span className={styles.place} role="img" aria-label={label}>
      📍
    </span>
  );
}

export type JungwooMood = "work" | "waiting" | "play" | "sulk" | "idle";
const JUNGWOO_EMOJI: Record<JungwooMood, string> = { work: "🧑‍💼", waiting: "🧍‍♂️", play: "🎧", sulk: "😤", idle: "🙂" };

/** 정우 그림 자리 (정우 그림은 추후 제작) */
export function JungwooArt({ mood = "idle" }: { mood?: JungwooMood }) {
  return (
    <span className={styles.jungwoo} role="img" aria-label="정우">
      {JUNGWOO_EMOJI[mood]}
    </span>
  );
}
