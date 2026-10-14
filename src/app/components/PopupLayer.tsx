"use client";

import { useEffect, useRef } from "react";
import { BALANCE } from "@/game";
import { daysTogether } from "@/game/date";
import type { GameView, Popup } from "@/ui/useGame";
import CharacterFrame from "./CharacterFrame";
import { Button, StarRow } from "./controls";
import styles from "./popup.module.css";

function Face({ popup, urls }: { popup: Popup; urls: ReadonlyMap<string, string> }) {
  return (
    <div className={styles.face}>
      <CharacterFrame kind="face" image={popup.face} urls={urls} />
    </div>
  );
}

function SummaryBody({ popup }: { popup: Extract<Popup, { kind: "summary" }> }) {
  const s = popup.summary;
  const change = s.hyejinHappiness.change;
  const [, m, d] = s.toDate.split("-").map(Number);
  return (
    <>
      <h2 className={styles.title}>밤사이 있었던 일</h2>
      <p className={styles.lead}>
        {m}월 {d}일 아침이 밝았어요 · 사귄 지 {daysTogether(s.toDate)}일째
      </p>
      <div className={styles.change} data-down={change < 0}>
        💗 {s.hyejinHappiness.before} → <strong>{s.hyejinHappiness.after}</strong> ({change >= 0 ? `+${change}` : change})
      </div>
      <ul className={styles.list}>
        {s.breakdown.commute < 0 && <li>🏢 출근하느라 지쳤어요 {s.breakdown.commute}</li>}
        {s.breakdown.overwork < 0 && <li>💼 정우가 일만 해서 서운해요 {s.breakdown.overwork}</li>}
        {s.breakdown.bulldakIgnored < 0 && <li>🌶️ 불닭을 못 먹었어요 {s.breakdown.bulldakIgnored}</li>}
        {change === 0 && <li>😴 푹 잤어요</li>}
        {s.jungwooSulkHealed && <li>😤→🙂 삐졌던 정우가 자고 일어나서 풀렸어요</li>}
        {s.jungwooTired > 0 && <li>🥱 밤샘 포커 여파로 정우가 피곤해요 (오늘 행동 -{s.jungwooTired})</li>}
        {s.countdownTurnsLeft !== null && <li>🚨 냉동실 카운트다운 중! {s.countdownTurnsLeft}턴 남았어요</li>}
      </ul>
    </>
  );
}

function DateBody({ popup }: { popup: Extract<Popup, { kind: "date" }> }) {
  const episode = popup.place?.episodes[popup.stars];
  return (
    <>
      <h2 className={styles.title}>{popup.place?.name ?? "데이트"} 다녀왔어요</h2>
      <div className={styles.bigStars}>
        <StarRow stars={popup.stars} />
      </div>
      {popup.newBest && !popup.firstVisit && <p className={styles.lead}>🎉 최고 기록 갱신!</p>}
      {episode && <p className={styles.episode}>{episode}</p>}
      <p className={styles.dim}>
        혜진 +{popup.stars === 3 ? BALANCE.ACTIONS.DATE.HYEJIN_HAPPINESS_THREE_STARS : BALANCE.ACTIONS.DATE.HYEJIN_HAPPINESS} · 정우 +
        {BALANCE.ACTIONS.DATE.JUNGWOO_HAPPINESS}
      </p>
    </>
  );
}

/** 정우 막기 연출의 정우. 그림이 없으면 이모지 */
function JungwooRun({ popup, urls }: { popup: Popup; urls: ReadonlyMap<string, string> }) {
  const url = popup.jungwoo ? urls.get(popup.jungwoo.path) : undefined;
  if (!url) return <span className={styles.blockJungwoo}>🙅‍♂️</span>;
  // eslint-disable-next-line @next/next/no-img-element -- Storage 서명 URL일 수 있어 next/image 최적화를 쓰지 않는다
  return <img className={`${styles.blockJungwoo} ${styles.blockJungwooImage}`} src={url} alt="" draggable={false} />;
}

function BlockOverlay({ popup, urls, onClose }: { popup: Popup; urls: ReadonlyMap<string, string>; onClose: () => void }) {
  return (
    <div className={styles.blockBackdrop} role="alertdialog" aria-modal aria-labelledby="block-title">
      <div className={styles.blockStripes} aria-hidden />
      <div className={styles.block}>
        <div className={styles.blockScene} aria-hidden>
          <span className={styles.blockFreezer}>🧊</span>
          <JungwooRun popup={popup} urls={urls} />
        </div>
        <Face popup={popup} urls={urls} />
        <h2 id="block-title" className={styles.blockTitle}>
          정우가 냉동실 앞을 막아섰다!
        </h2>
        <p>&quot;이것만은 안 돼…!&quot;</p>
        <p className={styles.blockSub}>
          딱 한 번뿐인 기회예요. {BALANCE.WARNING.COUNTDOWN_TURNS}턴 안에 혜진 기분을 {BALANCE.WARNING.DANGER_HAPPINESS}보다 높여주세요.
          <br />
          다음엔 정우도 못 막아요.
        </p>
        <Button variant="primary" onClick={onClose}>
          알겠어, 기분 풀어줄게!
        </Button>
      </div>
    </div>
  );
}

/** 이벤트 팝업 (한 번에 하나씩 차례로) */
export function PopupLayer({ view }: { view: GameView }) {
  const popup = view.popup;
  const urls = view.content?.imageUrls ?? new Map<string, string>();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, [popup?.id]);

  if (!popup) return null;
  if (popup.kind === "block") return <BlockOverlay popup={popup} urls={urls} onClose={view.dismissPopup} />;

  return (
    <div className={styles.backdrop} onClick={view.dismissPopup}>
      <div
        key={popup.id}
        className={styles.sheet}
        data-tone={popup.kind === "card" ? popup.tone : undefined}
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
      >
        <Face popup={popup} urls={urls} />
        {popup.kind === "card" && (
          <>
            <div className={styles.emoji} aria-hidden>
              {popup.emoji}
            </div>
            <h2 className={styles.title}>{popup.title}</h2>
            {popup.body && <p className={styles.lead}>{popup.body}</p>}
          </>
        )}
        {popup.kind === "summary" && <SummaryBody popup={popup} />}
        {popup.kind === "date" && <DateBody popup={popup} />}
        <button ref={buttonRef} type="button" className={styles.ok} onClick={view.dismissPopup}>
          확인
        </button>
      </div>
    </div>
  );
}

/** 잠깐 떴다 사라지는 한 줄 알림 + 고정 안내 */
export function ToastLayer({ view }: { view: GameView }) {
  return (
    <div className={styles.toasts} aria-live="polite">
      {view.notice && (
        <div className={`${styles.toast} ${styles.notice}`} role="status">
          <span>{view.notice}</span>
          <button type="button" onClick={view.clearNotice} aria-label="닫기">
            ✕
          </button>
        </div>
      )}
      {view.toasts.map((t) => (
        <div key={t.id} className={styles.toast}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
