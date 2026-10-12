import type { CharacterImage, FullBodyPool, ImageKind } from "@/content/types";
import styles from "./CharacterFrame.module.css";

interface Props {
  kind: ImageKind;
  image: CharacterImage | null;
  /** 이미지 경로 → 표시 URL */
  urls: ReadonlyMap<string, string>;
  /** 그림이 없을 때 보여줄 플레이스홀더 표정 */
  mood?: FullBodyPool;
  onTap?: () => void;
  tapLabel?: string;
}

const MOOD_EMOJI: Record<FullBodyPool, string> = { normal: "😊", sad: "🥺", danger: "😱" };

/**
 * 캔버스 비율을 유지한 채 크기만 바뀌는 캐릭터 그림 자리.
 * 그림이 바뀌면 짧게 페이드되고, 그림이 없으면 도형 + 이모지 플레이스홀더를 보여준다.
 */
export default function CharacterFrame({ kind, image, urls, mood = "normal", onTap, tapLabel }: Props) {
  const url = image ? urls.get(image.path) : undefined;
  const className = `${styles.frame} ${kind === "full" ? styles.full : styles.face}`;
  const content = url ? (
    // eslint-disable-next-line @next/next/no-img-element -- Storage 서명 URL이라 next/image 최적화를 쓰지 않는다
    <img key={url} className={`${styles.image} ${styles.fade}`} src={url} alt={image?.description ?? "혜진"} draggable={false} />
  ) : (
    <span key={`placeholder-${mood}`} className={`${styles.placeholder} ${styles.fade}`} aria-hidden>
      <span className={styles.emoji}>{MOOD_EMOJI[mood]}</span>
    </span>
  );

  if (!onTap) return <div className={className}>{content}</div>;
  return (
    <button type="button" className={`${className} ${styles.tappable}`} onClick={onTap} aria-label={tapLabel ?? "혜진이"}>
      {content}
    </button>
  );
}
