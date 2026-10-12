"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { faceTagForEvent, pickFace, pickFullBody } from "@/content/images";
import { buildMap } from "@/content/places";
import type { CharacterImage, FaceEventTag, Place } from "@/content/types";
import { BALANCE } from "@/game";
import { isWeekend } from "@/game/date";
import { isMaxLevel } from "@/game/places";
import { levelUpCost } from "@/game/rules";
import type { AwaySummary } from "@/game/summary";
import type { Action, GameEvent, GameState } from "@/game/types";
import { getSupabase, supabaseConfigError } from "@/lib/supabase";
import { BUCKETS, loadCharacterImages, loadPlaces, resolveImageUrls } from "@/persistence/contentRepo";
import { NewerSchemaError } from "@/persistence/schema";
import { openGame, performAction, type SessionDeps } from "@/persistence/session";
import type { StoredGame } from "@/persistence/store";
import { createSupabaseGameStore } from "@/persistence/supabaseStore";
import CharacterFrame from "./components/CharacterFrame";

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

/** 얼굴 팝업 대사 (임시 문구) */
const FACE_LINES: Record<FaceEventTag, string> = {
  eat_mochi: "한정선 냠냠!",
  level_up: "레벨업! 새 장소가 열렸어요.",
  warning: "혜진이가 냉동실을 힐끔거린다…",
  countdown: "혜진이가 냉동실 앞을 서성인다! 3턴 안에 기분을 풀어줘야 해요.",
  jeongwoo_block: "정우가 냉동실 앞을 막아섰다! 다음엔 못 막아요.",
  eat_half: "혜진이가 한정선을 절반 먹어치웠다!",
  buldak_craving: "혜진이가 불닭이 땡긴다!",
  buldak_eat: "불닭 최고!",
  play_together: "같이 노니까 좋다!",
  date_1star: "데이트 다녀왔어요 ★",
  date_2star: "데이트 다녀왔어요 ★★",
  date_3star: "최고의 데이트! ★★★",
  new_place: "새 추억이 추가됐어요!",
  away_summary: "자리를 비운 동안…",
};

interface Content {
  places: Place[];
  images: CharacterImage[];
  imageUrls: Map<string, string>;
  placeUrls: Map<string, string>;
}

async function loadContent(): Promise<Content> {
  const client = getSupabase();
  const [places, images] = await Promise.all([loadPlaces(client), loadCharacterImages(client)]);
  const [imageUrls, placeUrls] = await Promise.all([
    resolveImageUrls(client, BUCKETS.characters, images.map((i) => i.path)),
    resolveImageUrls(client, BUCKETS.places, places.flatMap((p) => (p.image ? [p.image] : []))),
  ]);
  return { places, images, imageUrls, placeUrls };
}

/** 이벤트 중 얼굴 팝업을 띄울 마지막 것 */
function lastFaceEvent(events: GameEvent[]): FaceEventTag | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const tag = faceTagForEvent(events[i]);
    if (tag) return tag;
  }
  return null;
}

/** 임시 확인용 화면. 실제 게임 UI는 다음 단계에서 만든다. */
function GameScreen({ userId }: { userId: string }) {
  const deps = useMemo<SessionDeps>(
    () => ({ store: createSupabaseGameStore(getSupabase(), userId), now: () => new Date(), rng: Math.random }),
    [userId],
  );
  const [content, setContent] = useState<Content | null>(null);
  const [game, setGame] = useState<StoredGame | null>(null);
  const [summary, setSummary] = useState<{ data: AwaySummary; face: CharacterImage | null } | null>(null);
  const [face, setFace] = useState<{ tag: FaceEventTag; image: CharacterImage | null } | null>(null);
  const [fullBodyId, setFullBodyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** 이벤트·요약이 생겼을 때 얼굴 그림을 한 번만 골라 둔다 */
  const showEvents = useCallback(
    (images: CharacterImage[], events: GameEvent[], away: AwaySummary | null) => {
      if (away) setSummary({ data: away, face: pickFace(images, "away_summary", Math.random) });
      const tag = lastFaceEvent(events);
      if (tag) setFace({ tag, image: pickFace(images, tag, Math.random) });
    },
    [],
  );

  /** 전신 그림을 새로 고른다 (직전 그림은 피한다) */
  const rotateFullBody = useCallback((images: CharacterImage[], state: GameState) => {
    setFullBodyId((prev) => pickFullBody(images, state.hyejin.happiness, prev, Math.random)?.id ?? null);
  }, []);

  const sync = useCallback(
    () =>
      loadContent()
        .then(async (loaded) => {
          const result = await openGame(deps, loaded.places);
          setContent(loaded);
          setGame(result.game);
          rotateFullBody(loaded.images, result.game.state);
          showEvents(loaded.images, result.events, result.summary);
          if (result.syncedFromOtherDevice) setNotice("다른 기기에서 저장한 최신 상태를 불러왔어요.");
        })
        .catch((e) =>
          setError(
            e instanceof NewerSchemaError
              ? "앱이 업데이트됐어요. 페이지를 새로고침해 주세요."
              : "불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        ),
    [deps, rotateFullBody, showEvents],
  );

  useEffect(() => {
    sync();
    // 다른 기기에서 플레이하다 돌아왔을 때 최신 상태로 맞춘다. (장소·그림 추가도 이때 반영)
    const onVisible = () => document.visibilityState === "visible" && sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sync]);

  async function run(action: Action) {
    if (!game || !content) return;
    setBusy(true);
    setNotice(null);
    try {
      const outcome = await performAction(deps, game, action, content.places);
      setGame(outcome.game);
      rotateFullBody(content.images, outcome.game.state);
      showEvents(content.images, outcome.events, outcome.summary);
      if (outcome.kind === "conflict") setNotice(CONFLICT_NOTICE);
      if (outcome.kind === "invalid") setNotice(`할 수 없어요: ${outcome.error}`);
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p role="alert">{error}</p>;
  if (!game || !content) return <p>불러오는 중…</p>;
  const { state } = game;
  const { jungwoo, hyejin } = state;
  const fullBody = content.images.find((img) => img.id === fullBodyId) ?? null;
  const map = buildMap(content.places, state);
  const maxLevel = isMaxLevel(state, content.places.length);
  const canDate = isWeekend(state.lastSettledDate) && !state.weekendDateUsed;
  const cheapestBudget = BALANCE.DATE_BUDGETS[0].amount;

  return (
    <section style={{ display: "grid", gap: 12 }}>
      {notice && <p role="status">{notice}</p>}

      {face && (
        <div role="dialog" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 96, flexShrink: 0 }}>
            <CharacterFrame kind="face" image={face.image} urls={content.imageUrls} />
          </div>
          <p style={{ flex: 1 }}>{FACE_LINES[face.tag]}</p>
          <button onClick={() => setFace(null)}>확인</button>
        </div>
      )}

      {summary && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 96, flexShrink: 0 }}>
            <CharacterFrame kind="face" image={summary.face} urls={content.imageUrls} />
          </div>
          <div style={{ flex: 1 }}>
            <h2>자리를 비운 동안</h2>
            <p>
              {summary.data.daysPassed}일 지났어요 (접속 안 한 날 {summary.data.absentDays}일). 혜진 행복도{" "}
              {summary.data.hyejinHappiness.before} → {summary.data.hyejinHappiness.after}
            </p>
            {summary.data.missedBulldakDates.length > 0 && <p>놓친 불닭: {summary.data.missedBulldakDates.join(", ")}</p>}
            <button onClick={() => setSummary(null)}>확인</button>
          </div>
        </div>
      )}

      <CharacterFrame kind="full" image={fullBody} urls={content.imageUrls} onTap={() => rotateFullBody(content.images, state)} />

      <p>
        {state.lastSettledDate} · 정우 행복도 {jungwoo.happiness} · 돈 {jungwoo.money.toLocaleString()}원 · 남은 행동{" "}
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
        {maxLevel ? (
          <span>새 추억 업데이트를 기다리는 중</span>
        ) : (
          <button disabled={busy} onClick={() => run({ type: "levelUp" })}>
            레벨업 (한정선 {levelUpCost(hyejin.level)}개)
          </button>
        )}
      </div>

      <h2>맵</h2>
      <ol style={{ display: "grid", gap: 8, padding: 0, listStyle: "none" }}>
        {map.map((spot) =>
          spot.unlocked ? (
            <li key={spot.place.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {spot.place.image && content.placeUrls.get(spot.place.image) && (
                // eslint-disable-next-line @next/next/no-img-element -- Storage 서명 URL
                <img src={content.placeUrls.get(spot.place.image)} alt="" width={96} height={64} style={{ objectFit: "cover", borderRadius: 8 }} />
              )}
              <span style={{ flex: 1 }}>
                {spot.place.order}. {spot.place.name} {spot.bestStars ? "★".repeat(spot.bestStars) : "(아직 안 가봄)"}
              </span>
              {canDate && (
                <button
                  disabled={busy}
                  onClick={() => run({ type: "date", placeId: spot.place.id, budget: cheapestBudget, offering: 0 })}
                >
                  데이트 ({(cheapestBudget / 10_000).toLocaleString()}만 원)
                </button>
              )}
            </li>
          ) : (
            <li key={`locked-${spot.order}`}>{spot.order}. ???</li>
          ),
        )}
      </ol>

      <button onClick={() => getSupabase().auth.signOut()}>로그아웃</button>
    </section>
  );
}
