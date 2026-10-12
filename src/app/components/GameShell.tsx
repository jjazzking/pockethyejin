"use client";

import { useState, type ReactNode } from "react";
import { isWeekend } from "@/game/date";
import type { GameView } from "@/ui/useGame";
import DatePanel, { EMPTY_PLAN, type DatePlan } from "./DatePanel";
import MainPanel from "./MainPanel";
import MapPanel from "./MapPanel";
import { PopupLayer, ToastLayer } from "./PopupLayer";
import styles from "./shell.module.css";

type Tab = "main" | "map" | "date";

/**
 * 게임 화면 틀.
 * - 모바일 세로: 한 번에 한 화면, 아래 탭으로 메인·맵·데이트 전환
 * - 넓은 화면: 메인·맵·데이트를 나란히
 */
export default function GameShell({ view, banner, menu }: { view: GameView; banner?: ReactNode; menu?: ReactNode }) {
  const [tab, setTab] = useState<Tab>("main");
  const [plan, setPlan] = useState<DatePlan>(EMPTY_PLAN);

  if (view.error) {
    return (
      <div className={styles.center} role="alert">
        <p>😵 {view.error}</p>
      </div>
    );
  }
  if (!view.game || !view.content) {
    return (
      <div className={styles.center}>
        <p className={styles.loading}>🍡 혜진이 깨우는 중…</p>
      </div>
    );
  }

  const state = view.game.state;
  const dateOpen = isWeekend(state.lastSettledDate) && !state.weekendDateUsed;
  const tabs: { id: Tab; label: string; emoji: string; dot?: boolean }[] = [
    { id: "main", label: "메인", emoji: "🏠" },
    { id: "map", label: "추억 지도", emoji: "🗺️" },
    { id: "date", label: "데이트", emoji: "💑", dot: dateOpen },
  ];

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>꿍진이 키우기</h1>
        <div className={styles.menu}>{menu}</div>
      </header>
      {banner}

      <main className={styles.columns} data-tab={tab}>
        <div className={styles.pane} data-pane="main">
          <MainPanel view={view} />
        </div>
        <div className={styles.pane} data-pane="map">
          <MapPanel
            view={view}
            onPickPlace={(placeId) => {
              setPlan({ ...EMPTY_PLAN, placeId });
              setTab("date");
            }}
          />
        </div>
        <div className={styles.pane} data-pane="date">
          <DatePanel view={view} plan={plan} setPlan={setPlan} />
        </div>
      </main>

      <nav className={styles.tabs} aria-label="화면 전환">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={styles.tab} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            <span className={styles.tabEmoji} aria-hidden>
              {t.emoji}
              {t.dot && <span className={styles.dot} />}
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      <ToastLayer view={view} />
      <PopupLayer view={view} />
    </div>
  );
}
