"use client";

import { useState } from "react";
import { fullBodyPoolOrder } from "@/content/images";
import { BALANCE } from "@/game";
import { daysTogether, dayOfWeek, isWeekend } from "@/game/date";
import { isDanger, isWarning } from "@/game/hyejin";
import { isMaxLevel } from "@/game/places";
import { incomeForRank, levelUpCost, rejectPercent } from "@/game/rules";
import type { Action, GameState } from "@/game/types";
import {
  ERROR_TEXT,
  MOOD_TEXT,
  SOCIAL_TEXT,
  PLAY_ALONE_FLAVORS,
  SULKING_TEXT,
  WAITING_FOR_UPDATE_TEXT,
  WEEKDAY_NAMES,
  formatMoney,
  rankName,
  type PlayFlavor,
} from "@/ui/copy";
import type { GameView } from "@/ui/useGame";
import { JungwooArt } from "./ArtSlots";
import CharacterFrame from "./CharacterFrame";
import { Badge, Button, Card, Hint, Meter, Pips, Stepper, controlStyles as c } from "./controls";
import styles from "./main.module.css";

function happinessLevel(h: number) {
  return isDanger(h) ? "danger" : isWarning(h) ? "warning" : "ok";
}

export function DateHeader({ state }: { state: GameState }) {
  const date = state.lastSettledDate;
  const [, m, d] = date.split("-").map(Number);
  const weekend = isWeekend(date);
  return (
    <div className={styles.dateHeader}>
      <span className={styles.dateBlock}>
        <span className={styles.date}>
          {m}월 {d}일 ({WEEKDAY_NAMES[dayOfWeek(date)]})
        </span>
        <span className={c.hint}>💕 사귄 지 {daysTogether(date)}일째</span>
      </span>
      {state.mood && (
        <span className={c.hint} title={MOOD_TEXT[state.mood].detail}>
          {MOOD_TEXT[state.mood].badge}
        </span>
      )}
      <Badge accent={weekend}>{weekend ? "주말 · 데이트 가능 💑" : "평일 · 혜진 출근 🏢"}</Badge>
    </div>
  );
}

function WarningBanner({ state }: { state: GameState }) {
  const { happiness, countdownTurnsLeft, jungwooBlockUsed } = state.hyejin;
  if (!isWarning(happiness)) return null;

  if (countdownTurnsLeft !== null) {
    return (
      <div className={`${styles.warning} ${styles.danger}`} role="alert">
        <div className={styles.warningTitle}>🚨 냉동실 카운트다운</div>
        <div className={styles.countdown}>
          <Pips on={countdownTurnsLeft} total={BALANCE.WARNING.COUNTDOWN_TURNS} label="남은 턴" />
          <strong>{countdownTurnsLeft}턴 남음</strong>
        </div>
        <p>
          정우 행동 {countdownTurnsLeft}번 안에 혜진 행복도를 {BALANCE.WARNING.DANGER_HAPPINESS}보다 높여야 해요.
        </p>
        <p className={styles.warningSub}>
          {jungwooBlockUsed ? "⚠️ 정우 막기는 이미 썼어요. 이번엔 진짜 한정선 절반을 먹어요!" : "🛡️ 한 번은 정우가 막아줄 거예요."}
        </p>
        <p className={styles.warningSub}>⛔ 카운트다운 중에는 레벨업도 못 해요.</p>
      </div>
    );
  }
  return (
    <div className={styles.warning} role="status">
      <div className={styles.warningTitle}>🧊 혜진이가 냉동실을 힐끔거린다</div>
      <p>
        행복도가 {BALANCE.WARNING.DANGER_HAPPINESS} 이하로 떨어지면 카운트다운이 시작돼요.
      </p>
    </div>
  );
}

function HyejinStatus({ state, maxLevel }: { state: GameState; maxLevel: boolean }) {
  const h = state.hyejin;
  return (
    <div className={styles.status}>
      <Meter label="💗 혜진 행복도" value={h.happiness} level={happinessLevel(h.happiness)} />
      <div className={c.row}>
        <Badge>레벨 {h.level}{maxLevel ? " (MAX)" : ""}</Badge>
        <Badge>🍡 한정선 {h.hanjeongseon}개</Badge>
      </div>
    </div>
  );
}

function JungwooStatus({ view, state }: { view: GameView; state: GameState }) {
  const j = state.jungwoo;
  const art = view.jungwoo;
  return (
    <Card>
      <div className={styles.jungwooHead}>
        <JungwooArt url={art ? view.content?.imageUrls.get(art.path) : undefined} label={art?.description ?? undefined} sulking={j.sulking} />
        <div className={styles.jungwooInfo}>
          <strong>정우</strong>
          <span className={c.hint}>
            {rankName(j.rank)} · {formatMoney(j.money)}
          </span>
        </div>
      </div>
      <Meter label="😎 정우 행복도" value={j.happiness} level={j.happiness < BALANCE.SULK.SAFE_HAPPINESS ? "warning" : "ok"} />
      <div className={styles.actionsLeft}>
        <span className={c.hint}>오늘 남은 행동</span>
        <Pips on={j.actionsLeft} total={BALANCE.TIME.ACTIONS_PER_DAY} label="남은 행동" />
      </div>
    </Card>
  );
}

function JungwooActions({ view, state }: { view: GameView; state: GameState }) {
  const j = state.jungwoo;
  const maxQty = Math.max(1, Math.floor(j.money / BALANCE.ACTIONS.WAITING.PRICE_PER_HANJEONGSEON));
  const [qtyRaw, setQty] = useState(1);
  const qty = Math.min(qtyRaw, maxQty);
  const busy = view.busy;
  const go = (action: Action, playFlavor?: PlayFlavor) => view.run(action, { playFlavor });
  const blocked = (action: Action) => busy || view.check(action) !== null;
  const reject = rejectPercent(j.happiness);
  const waiting: Action = { type: "waiting", quantity: qty };
  const waitingError = view.check(waiting);
  const outOfActions = view.check({ type: "playAlone" });

  return (
    <Card title="정우 부려먹기">
      {outOfActions && <p className={styles.notice}>{j.sulking ? SULKING_TEXT : ERROR_TEXT[outOfActions]}</p>}

      <div className={c.grid2}>
        <Button
          disabled={blocked({ type: "work" })}
          onClick={() => go({ type: "work" })}
          sub={`+${formatMoney(incomeForRank(j.rank))} · 정우 ${BALANCE.ACTIONS.WORK.JUNGWOO_HAPPINESS}`}
        >
          💼 일 시키기
        </Button>
        <Button
          disabled={blocked({ type: "playTogether" })}
          onClick={() => go({ type: "playTogether" })}
          sub={`혜진 +${BALANCE.ACTIONS.PLAY_TOGETHER.HYEJIN_HAPPINESS} · 정우 +${BALANCE.ACTIONS.PLAY_TOGETHER.JUNGWOO_HAPPINESS}`}
        >
          💞 같이 놀기
        </Button>
        {(Object.keys(PLAY_ALONE_FLAVORS) as PlayFlavor[]).map((flavor) => (
          <Button
            key={flavor}
            disabled={blocked({ type: "playAlone" })}
            onClick={() => go({ type: "playAlone" }, flavor)}
            sub={`정우 +${BALANCE.ACTIONS.PLAY_ALONE.JUNGWOO_HAPPINESS}`}
          >
            {PLAY_ALONE_FLAVORS[flavor].emoji} 혼자 {PLAY_ALONE_FLAVORS[flavor].label}
          </Button>
        ))}
      </div>

      {view.check({ type: "work" }) === "JUNGWOO_EXHAUSTED" && <Hint>{ERROR_TEXT.JUNGWOO_EXHAUSTED}</Hint>}

      <div className={styles.waiting}>
        <div className={styles.waitingHead}>
          <strong>🍡 한정선 웨이팅</strong>
          <span className={c.hint}>
            1개 {formatMoney(BALANCE.ACTIONS.WAITING.PRICE_PER_HANJEONGSEON)} · 정우 {BALANCE.ACTIONS.WAITING.JUNGWOO_HAPPINESS}
          </span>
        </div>
        <div className={c.row}>
          <Stepper label="웨이팅 수량" value={qty} min={1} max={maxQty} onChange={setQty} unit="개" editable />
          <Button variant="primary" disabled={busy || waitingError !== null} onClick={() => go(waiting)} sub={formatMoney(qty * BALANCE.ACTIONS.WAITING.PRICE_PER_HANJEONGSEON)}>
            웨이팅 보내기
          </Button>
        </div>
        {reject > 0 && !outOfActions && <Hint>😤 정우가 삐질 확률 {reject}% — 혼자 놀게 해주면 낮아져요.</Hint>}
        {waitingError === "NOT_ENOUGH_MONEY" && <Hint>{ERROR_TEXT.NOT_ENOUGH_MONEY}</Hint>}
      </div>
    </Card>
  );
}

function BulldakCallout({ view, state }: { view: GameView; state: GameState }) {
  if (state.bulldak !== "active") return null;
  const action: Action = { type: "convenienceStore" };
  const error = view.check(action);
  return (
    <div className={styles.bulldak} role="status">
      <div>
        <strong>🌶️ 혜진이가 불닭이 땡긴다!</strong>
        <p className={c.hint}>자기 전에 안 사다주면 혜진 행복도 {BALANCE.DAY_END.BULLDAK_IGNORED_PENALTY}</p>
      </div>
      <Button
        variant="primary"
        disabled={view.busy || error !== null}
        onClick={() => view.run(action)}
        sub={`${formatMoney(BALANCE.ACTIONS.CONVENIENCE_STORE.COST_MONEY)} · 혜진 +${BALANCE.ACTIONS.CONVENIENCE_STORE.HYEJIN_HAPPINESS}`}
      >
        🏪 편의점 보내기
      </Button>
      {error && error !== "NO_ACTIONS_LEFT" && <Hint>{ERROR_TEXT[error]}</Hint>}
    </div>
  );
}

function SickCallout({ view, state }: { view: GameView; state: GameState }) {
  if (!state.hyejin.sick) return null;
  const action: Action = { type: "porridge" };
  const error = view.check(action);
  const P = BALANCE.ACTIONS.PORRIDGE;
  return (
    <div className={styles.bulldak} role="status">
      <div>
        <strong>🤒 혜진이가 감기에 걸렸다</strong>
        <p className={c.hint}>오늘은 같이 못 놀고, 행복도가 반만 올라요.</p>
      </div>
      <Button variant="primary" disabled={view.busy || error !== null} onClick={() => view.run(action)} sub={`${formatMoney(P.COST_MONEY)} · 혜진 +${P.HYEJIN_HAPPINESS} · 감기 뚝`}>
        🥣 죽 사다 주기
      </Button>
      {error && error !== "NO_ACTIONS_LEFT" && <Hint>{ERROR_TEXT[error]}</Hint>}
    </div>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
/** 날짜로 정해지는 이벤트는 패스 버튼 없이 고르게 한다 */
const NO_SKIP: readonly string[] = ["payday", "anniversary"];

/** 오늘 생긴 랜덤 이벤트. 행동은 안 쓰고, 선택지마다 효과와 비용을 보여준다 */
function SocialCallout({ view, state }: { view: GameView; state: GameState }) {
  if (!state.social) return null;
  const text = SOCIAL_TEXT[state.social];
  const effects = BALANCE.SOCIAL.EVENTS[state.social] as Record<string, { hyejin: number; jungwoo: number; money: number; hanjeongseon: number; tired: number }>;
  return (
    <div className={styles.social} role="status">
      <div>
        <strong>
          {text.emoji} {text.title}
        </strong>
        <p className={c.hint}>{text.body}</p>
      </div>
      <div className={c.grid2}>
        {Object.entries(effects).map(([choice, e]) => {
          const action: Action = { type: "social", choice };
          const sub = [
            e.hyejin !== 0 && `혜진 ${signed(e.hyejin)}`,
            e.jungwoo !== 0 && `정우 ${signed(e.jungwoo)}`,
            e.money > 0 && formatMoney(e.money),
            e.hanjeongseon !== 0 && `한정선 ${signed(e.hanjeongseon)}`,
            e.tired > 0 && `내일 행동 -${e.tired}`,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <Button key={choice} variant="primary" disabled={view.busy || view.check(action) !== null} onClick={() => view.run(action)} sub={sub}>
              {text.choices[choice].label}
            </Button>
          );
        })}
        {!NO_SKIP.includes(state.social) && (
          <Button variant="ghost" disabled={view.busy} onClick={() => view.run({ type: "social", choice: "skip" })}>
            이번엔 패스
          </Button>
        )}
      </div>
    </div>
  );
}

function HyejinActions({ view, state, maxLevel }: { view: GameView; state: GameState; maxLevel: boolean }) {
  const h = state.hyejin;
  const [countRaw, setCount] = useState(1);
  const count = Math.max(1, Math.min(countRaw, h.hanjeongseon));
  const feed: Action = { type: "feed", count };
  const cost = levelUpCost(h.level);
  const levelUpError = view.check({ type: "levelUp" });

  return (
    <Card title="혜진이 챙기기">
      <div className={styles.waitingHead}>
        <strong>🍡 한정선 먹이기</strong>
        <span className={c.hint}>
          1개당 행복도 +{BALANCE.FEED.HYEJIN_HAPPINESS_PER_HANJEONGSEON} · 행동 안 씀
        </span>
      </div>
      <div className={c.row}>
        <Stepper label="먹일 개수" value={count} min={1} max={Math.max(1, h.hanjeongseon)} onChange={setCount} unit="개" />
        <Button variant="primary" disabled={view.busy || view.check(feed) !== null} onClick={() => view.run(feed)}>
          먹이기
        </Button>
      </div>
      {h.hanjeongseon === 0 && <Hint>냉동실이 텅 비었어요. 정우를 웨이팅 보내자!</Hint>}

      <div className={styles.levelUp}>
        {maxLevel ? (
          <p className={styles.maxLevel}>🗺️ {WAITING_FOR_UPDATE_TEXT}</p>
        ) : (
          <>
            <Button
              disabled={view.busy || levelUpError !== null}
              onClick={() => view.run({ type: "levelUp" })}
              sub={`한정선 ${cost}개 (보유 ${h.hanjeongseon}개)`}
            >
              ⭐ 레벨업 → 새 장소 열기
            </Button>
            {levelUpError === "HYEJIN_UPSET" && <Hint>🧊 {ERROR_TEXT.HYEJIN_UPSET}</Hint>}
          </>
        )}
      </div>
    </Card>
  );
}

/** 잠자기: 하루 마감 → 다음 날 아침. 현실 하루에 잘 수 있는 밤은 정해져 있다. */
function SleepCard({ view, state }: { view: GameView; state: GameState }) {
  const [confirming, setConfirming] = useState(false);
  const actionsLeft = state.jungwoo.actionsLeft;
  const total = BALANCE.TIME.NIGHTS_PER_REAL_DAY;
  const noNights = view.nightsLeft <= 0;
  const sleep = () => {
    setConfirming(false);
    view.run({ type: "sleep" });
  };

  return (
    <Card>
      <div className={styles.sleepHead}>
        <strong>🌙 하루 마무리</strong>
        <span className={c.hint}>
          {view.unlimitedNights ? "🔓 밤 제한 풀림 (임시)" : `오늘 남은 밤 ${Math.max(0, view.nightsLeft)}/${total}`}
        </span>
      </div>
      {/* 임시: 밤 제한 풀기/잠그기 버튼. 테스트 끝나면 지운다 */}
      <Button variant="ghost" disabled={view.busy} onClick={view.toggleUnlimitedNights}>
        {view.unlimitedNights ? "🔒 밤 제한 다시 걸기" : "🔓 밤 제한 풀기 (임시)"}
      </Button>
      {noNights ? (
        <Hint>{ERROR_TEXT.NO_NIGHTS_LEFT}</Hint>
      ) : confirming ? (
        <>
          <Hint>정우 행동이 {actionsLeft}번 남았어요. 자면 사라져요. 그래도 잘까요?</Hint>
          <div className={c.grid2}>
            <Button variant="primary" disabled={view.busy} onClick={sleep}>
              😴 잘래요
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              더 놀래요
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant={actionsLeft === 0 ? "primary" : "default"}
          disabled={view.busy}
          onClick={() => (actionsLeft > 0 ? setConfirming(true) : sleep())}
          sub="하루를 마감하고 다음 날 아침으로"
        >
          😴 잠자기
        </Button>
      )}
    </Card>
  );
}

export default function MainPanel({ view }: { view: GameView }) {
  const { game, content } = view;
  if (!game || !content) return null;
  const state = game.state;
  const maxLevel = isMaxLevel(state, content.places.length);
  const mood = fullBodyPoolOrder(state.hyejin.happiness)[0];
  // 행동을 다 쓰면 잠자기를 정우 카드 바로 아래로 올린다
  const outOfActions = state.jungwoo.actionsLeft === 0;

  return (
    <div className={styles.panel}>
      <DateHeader state={state} />
      <div className={styles.stage}>
        <div className={styles.stageFrame}>
          <CharacterFrame kind="full" image={view.fullBody} urls={content.imageUrls} mood={mood} onTap={view.tapHyejin} tapLabel="혜진이 쓰다듬기 (그림 바꾸기)" />
        </div>
        <HyejinStatus state={state} maxLevel={maxLevel} />
      </div>
      <WarningBanner state={state} />
      <SickCallout view={view} state={state} />
      <BulldakCallout view={view} state={state} />
      <SocialCallout view={view} state={state} />
      <JungwooStatus view={view} state={state} />
      {outOfActions && <SleepCard view={view} state={state} />}
      <JungwooActions view={view} state={state} />
      <HyejinActions view={view} state={state} maxLevel={maxLevel} />
      {!outOfActions && <SleepCard view={view} state={state} />}
    </div>
  );
}
