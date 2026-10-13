"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ALBUM, ALBUM_PHOTO_COUNT, albumUsage, type AlbumPhoto, type AlbumShape } from "@/content/album";
import styles from "./album.module.css";

/** 사진첩 전체를 한 줄로 펼친 목록 (보기 화면에서 앞뒤로 넘길 때 쓴다) */
const FLAT = ALBUM.flatMap((section) => section.photos.map((photo) => ({ photo, section })));

function Usage({ path, shape }: { path: string; shape: AlbumShape }) {
  if (shape === "poster") return <span className={styles.chip}>🎮 로그인 화면</span>;
  const usage = albumUsage(path);
  if (usage.length === 0) return <span className={`${styles.chip} ${styles.chipOnly}`}>📸 사진첩에서만</span>;
  return (
    <>
      {usage.map((u) => (
        <span key={u} className={styles.chip}>
          🎮 {u}
        </span>
      ))}
    </>
  );
}

function Viewer({ index, onClose, onMove }: { index: number; onClose: () => void; onMove: (delta: number) => void }) {
  const { photo, section } = FLAT[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onMove(-1);
      if (e.key === "ArrowRight") onMove(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onMove]);

  return (
    <div className={styles.viewerBackdrop} onClick={onClose}>
      <div className={styles.viewer} role="dialog" aria-modal aria-labelledby="viewer-title" onClick={(e) => e.stopPropagation()}>
        <div className={styles.viewerImageWrap} data-shape={section.shape}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 투명 배경 그림을 원본 비율 그대로 보여준다 */}
          <img key={photo.path} className={styles.viewerImage} src={photo.path} alt={photo.title} draggable={false} />
        </div>
        <p className={styles.viewerSection}>{section.title}</p>
        <h2 id="viewer-title" className={styles.viewerTitle}>
          {photo.title}
        </h2>
        <p className={styles.viewerCaption}>{photo.caption}</p>
        <div className={styles.chips}>
          <Usage path={photo.path} shape={section.shape} />
        </div>
        <div className={styles.viewerNav}>
          <button type="button" onClick={() => onMove(-1)} aria-label="이전 그림">
            ‹ 이전
          </button>
          <span className={styles.viewerCount}>
            {index + 1} / {FLAT.length}
          </span>
          <button type="button" onClick={() => onMove(1)} aria-label="다음 그림">
            다음 ›
          </button>
        </div>
        <button type="button" className={styles.viewerClose} onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>
    </div>
  );
}

function Card({ photo, shape, onOpen }: { photo: AlbumPhoto; shape: AlbumShape; onOpen: () => void }) {
  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <span className={styles.thumb} data-shape={shape}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 투명 배경 그림을 원본 비율 그대로 보여준다 */}
        <img src={photo.path} alt={photo.title} loading="lazy" draggable={false} />
      </span>
      <span className={styles.cardTitle}>{photo.title}</span>
      <span className={styles.cardCaption}>{photo.caption}</span>
    </button>
  );
}

export default function AlbumView() {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const move = useCallback((delta: number) => setOpen((i) => (i === null ? i : (i + delta + FLAT.length) % FLAT.length)), []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← 게임으로
        </Link>
        <h1 className={styles.title}>📸 꿍진이 사진첩</h1>
        <p className={styles.lead}>혜진이와 정우 그림 {ALBUM_PHOTO_COUNT}장. 눌러서 크게 보세요.</p>
      </header>

      <nav className={styles.jump} aria-label="사진첩 목차">
        {ALBUM.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>

      {ALBUM.map((section) => (
        <section key={section.id} id={section.id} className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {section.title} <span className={styles.sectionCount}>{section.photos.length}</span>
          </h2>
          <div className={styles.grid} data-shape={section.shape}>
            {section.photos.map((photo) => (
              <Card
                key={photo.path}
                photo={photo}
                shape={section.shape}
                onOpen={() => setOpen(FLAT.findIndex((f) => f.photo.path === photo.path))}
              />
            ))}
          </div>
        </section>
      ))}

      {open !== null && <Viewer index={open} onClose={close} onMove={move} />}
    </div>
  );
}
