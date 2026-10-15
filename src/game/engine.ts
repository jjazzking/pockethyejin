import { ACTIONS, DATE_OFFERING, FEED, LUCK, SOCIAL } from "./balance";
import { isAnniversary, isWeekend } from "./date";
import { sleep } from "./day";
import { markSeen } from "./seen";
import { addHyejinHappiness, emitWarningChange, updateCountdown } from "./hyejin";
import {
  applyOffering,
  budgetPercents,
  clampHappiness,
  incomeForRank,
  levelUpCost,
  maxUsefulOffering,
  rankForWorkCount,
  rejectPercent,
  rollLuck,
  rollPercent,
  rollStars,
} from "./rules";
import type {
  Action,
  ActionContext,
  ActionError,
  ActionResult,
  GameEvent,
  GameState,
  Stars,
} from "./types";

function addJungwooHappiness(s: GameState, delta: number): void {
  s.jungwoo.happiness = clampHappiness(s.jungwoo.happiness + delta);
}

function isPositiveInteger(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

/** 정우 행동을 쓸 수 있는지. 성공 시 null. */
function checkActions(s: GameState, cost: number): ActionError | null {
  if (s.jungwoo.actionsLeft <= 0) return "NO_ACTIONS_LEFT";
  if (s.jungwoo.actionsLeft < cost) return "NOT_ENOUGH_ACTIONS";
  return null;
}

type SocialChoice = { hyejin: number; jungwoo: number; money: number; hanjeongseon: number; tired: number };

/** 오늘 이벤트의 선택지 효과. 없는 선택지면 undefined */
function socialChoice(s: GameState, choice: string): SocialChoice | undefined {
  return s.social ? (SOCIAL.EVENTS[s.social] as Record<string, SocialChoice>)[choice] : undefined;
}

/** 턴을 쓰는 행동 (잠자기 제외) */
type TurnAction = Exclude<Action, { type: "sleep" }>;

/** 검증만 하고 상태는 바꾸지 않는다. 성공 시 null. */
function validate(s: GameState, action: TurnAction, ctx: ActionContext): ActionError | null {
  switch (action.type) {
    case "work":
      if (s.jungwoo.happiness + ACTIONS.WORK.JUNGWOO_HAPPINESS < 0) return "JUNGWOO_EXHAUSTED";
      return checkActions(s, ACTIONS.WORK.ACTION_COST);
    case "waiting": {
      if (!isPositiveInteger(action.quantity)) return "INVALID_QUANTITY";
      const err = checkActions(s, ACTIONS.WAITING.ACTION_COST);
      if (err) return err;
      if (s.jungwoo.money < action.quantity * ACTIONS.WAITING.PRICE_PER_HANJEONGSEON) {
        return "NOT_ENOUGH_MONEY";
      }
      return null;
    }
    case "playAlone":
      return checkActions(s, ACTIONS.PLAY_ALONE.ACTION_COST);
    case "playTogether":
      if (s.hyejin.sick) return "HYEJIN_SICK";
      return checkActions(s, ACTIONS.PLAY_TOGETHER.ACTION_COST);
    case "porridge": {
      if (!s.hyejin.sick) return "NOT_SICK";
      const err = checkActions(s, ACTIONS.PORRIDGE.ACTION_COST);
      if (err) return err;
      if (s.jungwoo.money < ACTIONS.PORRIDGE.COST_MONEY) return "NOT_ENOUGH_MONEY";
      return null;
    }
    case "convenienceStore": {
      if (s.bulldak !== "active") return "NO_BULLDAK_EVENT";
      const err = checkActions(s, ACTIONS.CONVENIENCE_STORE.ACTION_COST);
      if (err) return err;
      if (s.jungwoo.money < ACTIONS.CONVENIENCE_STORE.COST_MONEY) return "NOT_ENOUGH_MONEY";
      return null;
    }
    case "social": {
      if (!s.social) return "NO_SOCIAL_EVENT";
      if (action.choice === "skip") return null;
      const c = socialChoice(s, action.choice);
      if (!c) return "INVALID_CHOICE";
      if (s.jungwoo.money < c.money) return "NOT_ENOUGH_MONEY";
      if (s.hyejin.hanjeongseon + c.hanjeongseon < 0) return "NOT_ENOUGH_HANJEONGSEON";
      return null;
    }
    case "pet":
      return s.lastPetDate === s.lastSettledDate ? "ALREADY_PETTED" : null;
    case "feed":
      if (!isPositiveInteger(action.count)) return "INVALID_QUANTITY";
      if (s.hyejin.hanjeongseon < action.count) return "NOT_ENOUGH_HANJEONGSEON";
      return null;
    case "levelUp":
      if (s.hyejin.level >= ctx.places.length) return "MAX_LEVEL";
      // 카운트다운 중(행복도 20 이하)에는 레벨업할 수 없다. 먼저 기분을 풀어줘야 한다.
      if (s.hyejin.countdownTurnsLeft !== null) return "HYEJIN_UPSET";
      if (s.hyejin.hanjeongseon < levelUpCost(s.hyejin.level)) return "NOT_ENOUGH_HANJEONGSEON";
      return null;
    case "date": {
      if (!isWeekend(s.lastSettledDate)) return "NOT_WEEKEND";
      if (s.weekendDateUsed) return "DATE_ALREADY_USED";
      const index = ctx.places.findIndex((p) => p.id === action.placeId);
      if (index < 0 || index >= s.hyejin.level) return "PLACE_LOCKED";
      const percents = budgetPercents(action.budget);
      if (!percents) return "INVALID_BUDGET";
      const { offering } = action;
      if (!Number.isInteger(offering) || offering < 0 || offering % DATE_OFFERING.BUNDLE_SIZE !== 0) {
        return "INVALID_OFFERING";
      }
      if (offering > 0) {
        if (s.bestStars[action.placeId] === 3) return "OFFERING_NOT_ALLOWED";
        if (offering > maxUsefulOffering(percents)) return "INVALID_OFFERING";
        if (s.hyejin.hanjeongseon < offering) return "NOT_ENOUGH_HANJEONGSEON";
      }
      const err = checkActions(s, ACTIONS.DATE.ACTION_COST);
      if (err) return err;
      if (s.jungwoo.money < action.budget) return "NOT_ENOUGH_MONEY";
      return null;
    }
  }
}

/** 행동 효과를 적용하고 소모한 정우 행동(턴) 수를 반환한다. */
function perform(s: GameState, action: TurnAction, ctx: ActionContext, events: GameEvent[]): number {
  const j = s.jungwoo;
  const h = s.hyejin;
  switch (action.type) {
    case "work": {
      const luck = rollLuck(ctx.luck, LUCK.WORK);
      const income = Math.round(incomeForRank(j.rank) * (luck === "bonus" ? LUCK.WORK_BONUS_MULTIPLIER : 1));
      j.money += income;
      j.totalWorkCount += 1;
      j.workCountToday += 1;
      addJungwooHappiness(s, ACTIONS.WORK.JUNGWOO_HAPPINESS + (luck === "overtime" ? LUCK.WORK_OVERTIME_JUNGWOO : 0));
      events.push({ type: "worked", income, ...(luck && { luck }) });
      const rank = rankForWorkCount(j.totalWorkCount);
      if (rank > j.rank) {
        j.rank = rank;
        events.push({ type: "promoted", rank });
      }
      j.actionsLeft -= ACTIONS.WORK.ACTION_COST;
      return ACTIONS.WORK.ACTION_COST;
    }
    case "waiting": {
      j.actionsLeft -= ACTIONS.WAITING.ACTION_COST;
      if (rollPercent(ctx.rng, rejectPercent(j.happiness))) {
        // 삐짐: 이 행동은 소모되고 남은 행동 전부 소멸. 돈·한정선·행복도는 변하지 않는다.
        j.actionsLeft = 0;
        j.sulking = true;
        events.push({ type: "waitingRejected" });
        return ACTIONS.WAITING.ACTION_COST;
      }
      // 1+1이면 하나 더(공짜), 앞에서 품절이면 하나 덜(그만큼 돈 안 냄)
      const luck = rollLuck(ctx.luck, LUCK.WAITING);
      const got = action.quantity + (luck === "extra" ? 1 : luck === "short" ? -1 : 0);
      const cost = Math.min(got, action.quantity) * ACTIONS.WAITING.PRICE_PER_HANJEONGSEON;
      j.money -= cost;
      h.hanjeongseon += got;
      addJungwooHappiness(s, ACTIONS.WAITING.JUNGWOO_HAPPINESS);
      events.push({ type: "waitingDone", quantity: got, cost, ...(luck && { luck }) });
      return ACTIONS.WAITING.ACTION_COST;
    }
    case "playAlone":
      addJungwooHappiness(s, ACTIONS.PLAY_ALONE.JUNGWOO_HAPPINESS);
      j.actionsLeft -= ACTIONS.PLAY_ALONE.ACTION_COST;
      events.push({ type: "playedAlone" });
      return ACTIONS.PLAY_ALONE.ACTION_COST;
    case "playTogether": {
      const luck = rollLuck(ctx.luck, LUCK.PLAY_TOGETHER);
      const effect =
        luck === "fight"
          ? LUCK.PLAY_TOGETHER_FIGHT
          : luck === "great"
            ? LUCK.PLAY_TOGETHER_GREAT
            : { HYEJIN: ACTIONS.PLAY_TOGETHER.HYEJIN_HAPPINESS, JUNGWOO: ACTIONS.PLAY_TOGETHER.JUNGWOO_HAPPINESS };
      // 맑은 날은 기분 좋게 놀면 조금 더 (투닥거리면 소용없음)
      const sunny = s.mood === "sunny" && luck !== "fight" ? LUCK.SUNNY_TOGETHER_BONUS : 0;
      addJungwooHappiness(s, effect.JUNGWOO);
      addHyejinHappiness(s, effect.HYEJIN + sunny);
      j.actionsLeft -= ACTIONS.PLAY_TOGETHER.ACTION_COST;
      events.push({ type: "playedTogether", ...(luck && { luck }) });
      return ACTIONS.PLAY_TOGETHER.ACTION_COST;
    }
    case "pet":
      s.lastPetDate = s.lastSettledDate;
      if (rollLuck(ctx.luck, { kiss: LUCK.KISS_PERCENT })) {
        addJungwooHappiness(s, LUCK.KISS_JUNGWOO);
        events.push({ type: "kissed" });
      }
      return 0;
    case "convenienceStore":
      j.money -= ACTIONS.CONVENIENCE_STORE.COST_MONEY;
      addJungwooHappiness(s, ACTIONS.CONVENIENCE_STORE.JUNGWOO_HAPPINESS);
      addHyejinHappiness(s, ACTIONS.CONVENIENCE_STORE.HYEJIN_HAPPINESS);
      s.bulldak = "resolved";
      j.actionsLeft -= ACTIONS.CONVENIENCE_STORE.ACTION_COST;
      events.push({ type: "bulldakResolved" });
      return ACTIONS.CONVENIENCE_STORE.ACTION_COST;
    case "porridge":
      j.money -= ACTIONS.PORRIDGE.COST_MONEY;
      h.sick = false;
      addHyejinHappiness(s, ACTIONS.PORRIDGE.HYEJIN_HAPPINESS);
      j.actionsLeft -= ACTIONS.PORRIDGE.ACTION_COST;
      events.push({ type: "porridgeDelivered" });
      return ACTIONS.PORRIDGE.ACTION_COST;
    case "social": {
      // 이벤트는 정우 행동을 쓰지 않는다 (턴 0)
      const event = s.social!;
      const c = socialChoice(s, action.choice);
      s.social = null;
      if (!c) {
        events.push({ type: "socialSkipped", event });
        return 0;
      }
      j.money -= c.money;
      h.hanjeongseon += c.hanjeongseon;
      addHyejinHappiness(s, c.hyejin);
      addJungwooHappiness(s, c.jungwoo);
      s.jungwooTiredActions += c.tired;
      events.push({ type: "socialDone", event, choice: action.choice });
      return 0;
    }
    case "feed":
      h.hanjeongseon -= action.count;
      addHyejinHappiness(s, action.count * FEED.HYEJIN_HAPPINESS_PER_HANJEONGSEON);
      events.push({ type: "fed", count: action.count });
      return 0;
    case "levelUp": {
      const cost = levelUpCost(h.level);
      h.hanjeongseon -= cost;
      h.level += 1;
      events.push({ type: "leveledUp", level: h.level, cost });
      return 0;
    }
    case "date": {
      const percents = applyOffering(budgetPercents(action.budget)!, action.offering);
      const rolled = rollStars(ctx.rng, percents);
      // 기념일 데이트는 별 하나 더
      const stars = isAnniversary(s.lastSettledDate) ? (Math.min(3, rolled + 1) as Stars) : rolled;
      const prevBest = s.bestStars[action.placeId];
      j.money -= action.budget;
      h.hanjeongseon -= action.offering;
      addJungwooHappiness(s, ACTIONS.DATE.JUNGWOO_HAPPINESS);
      addHyejinHappiness(
        s,
        stars === 3 ? ACTIONS.DATE.HYEJIN_HAPPINESS_THREE_STARS : ACTIONS.DATE.HYEJIN_HAPPINESS,
      );
      const newBest = prevBest === undefined || stars > prevBest;
      if (newBest) s.bestStars = { ...s.bestStars, [action.placeId]: stars };
      s.weekendDateUsed = true;
      j.actionsLeft -= ACTIONS.DATE.ACTION_COST;
      events.push({
        type: "dated",
        placeId: action.placeId,
        stars,
        newBest,
        firstVisit: prevBest === undefined,
      });
      return ACTIONS.DATE.ACTION_COST;
    }
  }
}

/**
 * (상태, 행동) → 새 상태 + 이벤트 로그. 입력 상태는 바꾸지 않는다.
 * 잠자기는 턴이 아니라 하루 마감이므로 따로 처리한다 (day.ts).
 */
export function applyAction(state: GameState, action: Action, ctx: ActionContext): ActionResult {
  if (action.type === "sleep") return sleep(state, ctx);
  const error = validate(state, action, ctx);
  if (error) return { ok: false, error };

  const s = structuredClone(state);
  const events: GameEvent[] = [];
  const hyejinBefore = s.hyejin.happiness;
  const turns = perform(s, action, ctx, events);
  updateCountdown(s, turns, events);
  emitWarningChange(hyejinBefore, s.hyejin.happiness, events);
  markSeen(s, events);
  return { ok: true, state: s, events };
}
