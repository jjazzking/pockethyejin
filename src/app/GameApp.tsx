"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigError } from "@/lib/supabase";
import { LocalGameStore } from "@/persistence/localStore";
import type { SessionDeps } from "@/persistence/session";
import { createSupabaseGameStore } from "@/persistence/supabaseStore";
import { loadSupabaseContent, loadTrialContent } from "@/ui/content";
import { useGame } from "@/ui/useGame";
import GameShell from "./components/GameShell";
import LoginScreen from "./components/LoginScreen";
import styles from "./components/shell.module.css";

/**
 * 앱 진입점: 로그인 화면 / 게임 화면 / 체험 모드.
 * Supabase 설정이 없으면 바로 체험 모드로 들어간다.
 */
export default function GameApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [trial, setTrial] = useState(false);

  useEffect(() => {
    if (supabaseConfigError) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (supabaseConfigError) return <TrialGame />;
  if (trial) return <TrialGame onExit={() => setTrial(false)} />;
  if (session === undefined) {
    return (
      <div className={styles.center}>
        <p className={styles.loading}>🍡</p>
      </div>
    );
  }
  if (!session) return <LoginScreen onTrial={() => setTrial(true)} />;
  return <SupabaseGame userId={session.user.id} />;
}

function SupabaseGame({ userId }: { userId: string }) {
  const deps = useMemo<SessionDeps>(
    () => ({ store: createSupabaseGameStore(getSupabase(), userId), now: () => new Date(), rng: Math.random }),
    [userId],
  );
  const view = useGame(deps, loadSupabaseContent);
  return (
    <GameShell
      view={view}
      menu={
        <button type="button" onClick={() => getSupabase().auth.signOut()}>
          로그아웃
        </button>
      }
    />
  );
}

/** 로그인 없이 해보는 체험 모드: 이 브라우저에만 저장, 임시 장소·그림 */
function TrialGame({ onExit }: { onExit?: () => void }) {
  const store = useMemo(() => new LocalGameStore(), []);
  const [round, setRound] = useState(0);
  // round가 바뀌면(처음부터 다시) 게임을 새로 띄운다
  return (
    <TrialRound
      key={round}
      store={store}
      onReset={() => {
        if (!window.confirm("체험 기록을 지우고 처음부터 시작할까요?")) return;
        store.reset();
        setRound((r) => r + 1);
      }}
      onExit={onExit}
    />
  );
}

function TrialRound({ store, onReset, onExit }: { store: LocalGameStore; onReset: () => void; onExit?: () => void }) {
  const deps = useMemo<SessionDeps>(() => ({ store, now: () => new Date(), rng: Math.random }), [store]);
  const view = useGame(deps, loadTrialContent);
  return (
    <GameShell
      view={view}
      banner={<p className={styles.trialBanner}>🧪 체험 모드 · 이 브라우저에만 저장돼요</p>}
      menu={
        <>
          <button type="button" onClick={onReset}>
            처음부터
          </button>
          {onExit && (
            <button type="button" onClick={onExit}>
              로그인
            </button>
          )}
        </>
      }
    />
  );
}
