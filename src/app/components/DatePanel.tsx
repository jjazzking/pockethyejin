"use client";

import { buildMap } from "@/content/places";
import { BALANCE } from "@/game";
import { applyOffering, budgetPercents, maxUsefulOffering } from "@/game/rules";
import type { Action, Stars } from "@/game/types";
import { ERROR_TEXT, formatMoney } from "@/ui/copy";
import type { GameView } from "@/ui/useGame";
import { PlaceArt } from "./ArtSlots";
import { Button, Card, Hint, StarRow, Stepper } from "./controls";
import styles from "./date.module.css";

export interface DatePlan {
  placeId: string | null;
  budget: number;
  offering: number;
}

export const EMPTY_PLAN: DatePlan = { placeId: null, budget: BALANCE.DATE_BUDGETS[0].amount, offering: 0 };

const STAR_LABELS: Stars[] = [1, 2, 3];

export default function DatePanel({
  view,
  plan,
  setPlan,
}: {
  view: GameView;
  plan: DatePlan;
  setPlan: (plan: DatePlan) => void;
}) {
  const { game, content } = view;
  if (!game || !content) return null;
  const state = game.state;
  const spots = buildMap(content.places, state).flatMap((s) => (s.unlocked ? [s] : []));

  // 지금 데이트를 갈 수 있는지 엔진에 물어본다 (첫 장소·최저 예산 기준)
  const probe: Action | null = spots[0]
    ? { type: "date", placeId: spots[0].place.id, budget: BALANCE.DATE_BUDGETS[0].amount, offering: 0 }
    : null;
  const probeError = probe ? view.check(probe) : null;
  const closed = probeError === "NOT_WEEKEND" || probeError === "DATE_ALREADY_USED" || probeError === "NOT_ENOUGH_ACTIONS" || probeError === "NO_ACTIONS_LEFT";

  const selected = spots.find((s) => s.place.id === plan.placeId) ?? null;
  const canOffer = selected !== null && selected.bestStars !== 3;
  const base = budgetPercents(plan.budget)!;
  const maxOffering = canOffer
    ? Math.min(
        maxUsefulOffering(base),
        Math.floor(state.hyejin.hanjeongseon / BALANCE.DATE_OFFERING.BUNDLE_SIZE) * BALANCE.DATE_OFFERING.BUNDLE_SIZE,
      )
    : 0;
  const offering = Math.min(plan.offering, maxOffering);
  const action: Action | null = selected ? { type: "date", placeId: selected.place.id, budget: plan.budget, offering } : null;
  const error = action ? view.check(action) : null;

  return (
    <Card title="💑 주말 데이트">
      {closed && <p className={styles.closed}>{probeError === "NO_ACTIONS_LEFT" ? ERROR_TEXT.NO_ACTIONS_LEFT : ERROR_TEXT[probeError!]}</p>}
      {!closed && (
        <Hint>
          주말에 한 번, 정우 행동 {BALANCE.ACTIONS.DATE.ACTION_COST}번을 써요. 다녀오면 혜진 +{BALANCE.ACTIONS.DATE.HYEJIN_HAPPINESS} (별 3개면 +
          {BALANCE.ACTIONS.DATE.HYEJIN_HAPPINESS_THREE_STARS}), 정우 +{BALANCE.ACTIONS.DATE.JUNGWOO_HAPPINESS}
        </Hint>
      )}

      <fieldset className={styles.step} disabled={closed}>
        <legend>1. 어디로 갈까?</legend>
        <div className={styles.places}>
          {spots.map((s) => (
            <button
              key={s.place.id}
              type="button"
              className={styles.place}
              aria-pressed={plan.placeId === s.place.id}
              onClick={() => setPlan({ ...plan, placeId: s.place.id, offering: 0 })}
            >
              <PlaceArt url={s.place.image ? content.placeUrls.get(s.place.image) : undefined} label={s.place.name} />
              <span>{s.place.name}</span>
              <StarRow stars={s.bestStars} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.step} disabled={closed || !selected}>
        <legend>2. 예산은?</legend>
        <div className={styles.budgets}>
          {BALANCE.DATE_BUDGETS.map((b) => {
            const p = applyOffering(b.starPercents, b.amount === plan.budget ? offering : 0);
            const target = (selected ?? spots[0])?.place.id;
            const tooExpensive =
              target !== undefined && view.check({ type: "date", placeId: target, budget: b.amount, offering: 0 }) === "NOT_ENOUGH_MONEY";
            return (
              <button
                key={b.amount}
                type="button"
                className={styles.budget}
                aria-pressed={plan.budget === b.amount}
                disabled={tooExpensive}
                onClick={() => setPlan({ ...plan, budget: b.amount, offering: 0 })}
              >
                <strong>{formatMoney(b.amount)}</strong>
                <span className={styles.odds}>
                  {STAR_LABELS.map((n) => (
                    <span key={n}>
                      {"★".repeat(n)} {p[n]}%
                    </span>
                  ))}
                </span>
                {tooExpensive && <span className={styles.short}>돈 부족</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selected && canOffer && (
        <fieldset className={styles.step} disabled={closed}>
          <legend>3. 한정선을 바쳐서 별 3개 확률 올리기 (선택)</legend>
          <div className={styles.offerRow}>
            <Stepper
              label="바칠 한정선"
              value={offering}
              min={0}
              max={maxOffering}
              step={BALANCE.DATE_OFFERING.BUNDLE_SIZE}
              onChange={(v) => setPlan({ ...plan, offering: v })}
              unit="개"
            />
            <Hint>
              {BALANCE.DATE_OFFERING.BUNDLE_SIZE}개당 ★★★ +{BALANCE.DATE_OFFERING.PERCENT_PER_BUNDLE}%p (최대 {BALANCE.DATE_OFFERING.MAX_THREE_STAR_PERCENT}%) · 보유{" "}
              {state.hyejin.hanjeongseon}개
            </Hint>
          </div>
        </fieldset>
      )}
      {selected && !canOffer && <Hint>⭐ 이미 별 3개를 받은 장소예요. 추억 다시 쌓으러 가요!</Hint>}

      <Button
        variant="primary"
        disabled={closed || !action || error !== null || view.busy}
        onClick={() => {
          if (!action) return;
          view.run(action).then(() => setPlan(EMPTY_PLAN));
        }}
        sub={selected ? `${formatMoney(plan.budget)}${offering ? ` + 한정선 ${offering}개` : ""} · 행동 ${BALANCE.ACTIONS.DATE.ACTION_COST}번` : "장소를 골라주세요"}
      >
        💕 데이트 출발!
      </Button>
      {!closed && error && <Hint>{ERROR_TEXT[error]}</Hint>}
    </Card>
  );
}
