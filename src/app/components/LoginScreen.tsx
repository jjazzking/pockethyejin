"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import styles from "./login.module.css";

export default function LoginScreen({ onTrial }: { onTrial: () => void }) {
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
    <div className={styles.wrap}>
      <form onSubmit={submit} className={styles.card}>
        <div className={styles.hero} aria-hidden>
          🍡<span>🙂</span>🧑‍💼
        </div>
        <h1 className={styles.title}>꿍진이 키우기</h1>
        <p className={styles.tagline}>정우를 부려먹어서 혜진이를 키우는 게임</p>

        <label className={styles.field}>
          <span>이메일</span>
          <input type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>비밀번호</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <button type="button" className={styles.secondary} onClick={onTrial}>
          로그인 없이 해보기
        </button>
      </form>
    </div>
  );
}
