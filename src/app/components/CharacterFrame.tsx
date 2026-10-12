import type { CharacterImage, ImageKind } from "@/content/types";
import styles from "./CharacterFrame.module.css";

interface Props {
  kind: ImageKind;
  image: CharacterImage | null;
  /** 이미지 경로 → 표시 URL */
  urls: ReadonlyMap<string, string>;
  onTap?: () => void;
}

/** 캔버스 비율을 유지한 채 크기만 바뀌는 캐릭터 그림. 그림이 없으면 빈 자리만 보여준다. */
export default function CharacterFrame({ kind, image, urls, onTap }: Props) {
  const url = image ? urls.get(image.path) : undefined;
  const className = `${styles.frame} ${kind === "full" ? styles.full : styles.face}`;
  const content = url ? (
    // eslint-disable-next-line @next/next/no-img-element -- Storage 서명 URL이라 next/image 최적화를 쓰지 않는다
    <img className={styles.image} src={url} alt={image?.description ?? "혜진"} draggable={false} />
  ) : (
    <span className={styles.empty} aria-label="그림 준비 중" />
  );

  if (!onTap) return <div className={className}>{content}</div>;
  return (
    <button type="button" className={`${className} ${styles.tappable}`} onClick={onTap} aria-label="혜진이 쓰다듬기">
      {content}
    </button>
  );
}
