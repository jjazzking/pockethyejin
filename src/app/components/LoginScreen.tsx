"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { LOGIN_ART } from "@/ui/loginArt";
import styles from "./login.module.css";

/**
 * 타이틀 화면: 그림 한 장 위에 "로그인"과 "로그인 없이 해보기" 버튼.
 * 그림은 세로 화면이면 핸드폰용, 가로 화면이면 컴퓨터용을 쓴다 (LOGIN_ART).
 * 로그인을 누르면 아래에서 입력 창이 올라온다.
 */
export default function LoginScreen({ onTrial }: { onTrial: () => void }) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className={styles.screen}>
      <picture className={styles.art}>
        <source media="(min-aspect-ratio: 1/1)" srcSet={LOGIN_ART.desktop} />
        <img src={LOGIN_ART.mobile} alt="숲길을 신나게 걸어가는 혜진이와 정우, 하얀 강아지" draggable={false} />
      </picture>
      <h1 className={styles.srOnly}>꿍진이 키우기</h1>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => setFormOpen(true)}>
          로그인
        </button>
        <button type="button" className={styles.secondary} onClick={onTrial}>
          로그인 없이 해보기
        </button>
      </div>

      {formOpen && <LoginSheet onClose={() => setFormOpen(false)} />}
    </div>
  );
}

function LoginSheet({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) setError("이메일이나 비밀번호가 맞지 않아요.");
    setBusy(false);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <form
        onSubmit={submit}
        className={styles.sheet}
        role="dialog"
        aria-modal
        aria-labelledby="login-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="login-title" className={styles.sheetTitle}>
          혜진이 로그인
        </h2>
        <label className={styles.field}>
          <span>이메일</span>
          <input
            ref={emailRef}
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <button type="button" className={styles.cancel} onClick={onClose}>
          취소
        </button>
      </form>
    </div>
  );
}
