/*
 * 장소 사진·정우 그림 자리. 그림이 없으면 도형 + 이모지로 대신한다.
 * (혜진 그림은 CharacterFrame이 character_images 선택 함수 결과로 그린다)
 */
import styles from "./art.module.css";

/** 장소 사진(이벤트 그림) 자리. 사진이 없으면 도형 + 이모지 */
export function PlaceArt({ url, locked, label, emoji = "📍" }: { url?: string; locked?: boolean; label: string; emoji?: string }) {
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
      {emoji}
    </span>
  );
}

/** 정우 그림 자리. 그림이 없으면 도형 + 이모지 */
export function JungwooArt({ url, label, sulking }: { url?: string; label?: string; sulking: boolean }) {
  if (url) {
    return (
      <span className={styles.jungwooPose}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Storage 서명 URL일 수 있어 next/image 최적화를 쓰지 않는다 */}
        <img key={url} className={styles.jungwooImage} src={url} alt={label ?? "정우"} draggable={false} />
      </span>
    );
  }
  return (
    <span className={styles.jungwoo} role="img" aria-label="정우">
      {sulking ? "😤" : "🙂"}
    </span>
  );
}
