"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AwaySummary } from "@/game/summary";
import type { Action } from "@/game/types";
import { getSupabase, supabaseConfigError } from "@/lib/supabase";
import { NewerSchemaError } from "@/persistence/schema";
import { openGame, performAction, type SessionDeps } from "@/persistence/session";
import type { StoredGame } from "@/persistence/store";
import { createSupabaseGameStore } from "@/persistence/supabaseStore";

/** 앱 진입점: 로그인 여부에 따라 로그인 화면 / 게임 화면 */
export default function GameApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (supabaseConfigError) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (supabaseConfigError) return <p role="alert">{supabaseConfigError}</p>;
  if (session === undefined) return <p>불러오는 중…</p>;
  if (!session) return <LoginForm />;
  return <GameScreen userId={session.user.id} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) setError("이메일이나 비밀번호가 맞지 않아요.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
      <h2>로그인</h2>
      <input type="email" autoComplete="username" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={busy}>
        {busy ? "로그인 중…" : "로그인"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

const CONFLICT_NOTICE = "다른 기기에서 플레이한 내용이 있어서 최신 상태를 불러왔어요. 방금 행동은 반영되지 않았어요.";

/** 임시 확인용 화면. 실제 게임 UI는 다음 단계에서 만든다. */
function GameScreen({ userId }: { userId: string }) {
  const deps = useMemo<SessionDeps>(
    () => ({ store: createSupabaseGameStore(getSupabase(), userId), now: () => new Date(), rng: Math.random }),
    [userId],
  );
  const [game, setGame] = useState<StoredGame | null>(null);
  const [summary, setSummary] = useState<AwaySummary | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sync = useCallback(
    () =>
      openGame(deps).then(
        (result) => {
          setGame(result.game);
          if (result.summary) setSummary(result.summary);
          if (result.syncedFromOtherDevice) setNotice("다른 기기에서 저장한 최신 상태를 불러왔어요.");
        },
        (e) =>
          setError(
            e instanceof NewerSchemaError
              ? "앱이 업데이트됐어요. 페이지를 새로고침해 주세요."
              : "불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
      ),
    [deps],
  );

  useEffect(() => {
    sync();
    // 다른 기기에서 플레이하다 돌아왔을 때 최신 상태로 맞춘다.
    const onVisible = () => document.visibilityState === "visible" && sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sync]);

  async function run(action: Action) {
    if (!game) return;
    setBusy(true);
    setNotice(null);
    try {
      const outcome = await performAction(deps, game, action, []);
      setGame(outcome.game);
      if (outcome.summary) setSummary(outcome.summary);
      if (outcome.kind === "conflict") setNotice(CONFLICT_NOTICE);
      if (outcome.kind === "invalid") setNotice(`할 수 없어요: ${outcome.error}`);
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p role="alert">{error}</p>;
  if (!game) return <p>불러오는 중…</p>;
  const { jungwoo, hyejin } = game.state;

  return (
    <section style={{ display: "grid", gap: 12 }}>
      {notice && <p role="status">{notice}</p>}
      {summary && (
        <div>
          <h2>자리를 비운 동안</h2>
          <p>
            {summary.daysPassed}일 지났어요 (접속 안 한 날 {summary.absentDays}일). 혜진 행복도{" "}
            {summary.hyejinHappiness.before} → {summary.hyejinHappiness.after}
          </p>
          {summary.missedBulldakDates.length > 0 && <p>놓친 불닭: {summary.missedBulldakDates.join(", ")}</p>}
          <button onClick={() => setSummary(null)}>확인</button>
        </div>
      )}
      <p>
        {game.state.lastSettledDate} · 정우 행복도 {jungwoo.happiness} · 돈 {jungwoo.money.toLocaleString()}원 · 남은 행동{" "}
        {jungwoo.actionsLeft}
      </p>
      <p>
        혜진 행복도 {hyejin.happiness} · 레벨 {hyejin.level} · 한정선 {hyejin.hanjeongseon}
        {hyejin.countdownTurnsLeft !== null && ` · 카운트다운 ${hyejin.countdownTurnsLeft}턴`}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button disabled={busy} onClick={() => run({ type: "work" })}>일</button>
        <button disabled={busy} onClick={() => run({ type: "waiting", quantity: 1 })}>웨이팅 1개</button>
        <button disabled={busy} onClick={() => run({ type: "playAlone" })}>혼자 놀기</button>
        <button disabled={busy} onClick={() => run({ type: "playTogether" })}>같이 놀기</button>
        <button disabled={busy} onClick={() => run({ type: "convenienceStore" })}>편의점</button>
        <button disabled={busy} onClick={() => run({ type: "feed", count: 1 })}>한정선 먹이기</button>
      </div>
      <button onClick={() => getSupabase().auth.signOut()}>로그아웃</button>
    </section>
  );
}
