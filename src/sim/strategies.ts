import { ACTIONS, DATE_BUDGETS } from "@/game/balance";
import { dayOfWeek, isWeekend } from "@/game/date";
import { isDanger } from "@/game/hyejin";
import { applyAction } from "@/game/engine";
import { levelUpCost } from "@/game/rules";
import type { Action, ActionContext, GameDate, GameEvent, GameState } from "@/game/types";

/** 하루 동안 행동을 실행하는 도우미. 실패한 행동은 건너뛴다(엔진이 판정). */
export class DayRunner {
  readonly events: GameEvent[] = [];
  constructor(
    public state: GameState,
    private readonly ctx: ActionContext,
  ) {}

  act(action: Action): boolean {
    const result = applyAction(this.state, action, this.ctx);
    if (!result.ok) return false;
    this.state = result.state;
    this.events.push(...result.events);
    return true;
  }

  get places() {
    return this.ctx.places;
  }
}

export interface Strategy {
  name: string;
  description: string;
  /** 그날 접속하는지 */
  present(date: GameDate): boolean;
  /** 접속한 날의 플레이 */
  playDay(day: DayRunner, date: GameDate): void;
}

type Step = "work" | "waiting" | "playAlone" | "playTogether";

interface Plan {
  name: string;
  description: string;
  /** 평일(그리고 데이트 없는 주말) 행동 순서 */
  routine: Step[];
  /** 수입 중 데이트용으로 떼어 두는 비율 */
  dateRatio: number;
  /** 데이트 예산 고르기: 모아둔 데이트 자금 → 예산 (못 가면 null) */
  pickBudget: (dateFund: number) => number | null;
  /** 하루에 먹이는 한정선 수 */
  feedPerDay: number;
  /** 접속하지 않는 요일 (0=일 … 6=토) */
  skipDays?: number[];
  /** 카운트다운이 뜨면 한정선을 먹여 위기를 넘기는지 (기본 true) */
  rescue?: boolean;
}

const budgetsDesc = [...DATE_BUDGETS].map((b) => b.amount).sort((a, b) => b - a);
const biggestAffordable = (fund: number) => budgetsDesc.find((b) => b <= fund) ?? null;

/** 3성 못 받은 장소 중 가장 최근에 열린 곳, 없으면 가장 최근 장소 */
function pickDatePlace(state: GameState, places: readonly { id: string }[]): string | null {
  const unlocked = places.slice(0, state.hyejin.level);
  const notThree = unlocked.filter((p) => state.bestStars[p.id] !== 3);
  return (notThree.at(-1) ?? unlocked.at(-1))?.id ?? null;
}

function makeStrategy(plan: Plan): () => Strategy {
  // 전략마다 실행(run)별로 새 인스턴스를 만든다 (데이트 자금은 전략의 기억)
  return () => {
    let dateFund = 0;
    const freeMoney = (s: GameState) => Math.max(0, s.jungwoo.money - dateFund);

    function step(day: DayRunner, kind: Step) {
      const s = day.state;
      switch (kind) {
        case "work": {
          const before = s.jungwoo.money;
          if (day.act({ type: "work" })) dateFund += Math.floor((day.state.jungwoo.money - before) * plan.dateRatio);
          return;
        }
        case "waiting": {
          const qty = Math.floor(freeMoney(s) / ACTIONS.WAITING.PRICE_PER_HANJEONGSEON);
          if (qty > 0) day.act({ type: "waiting", quantity: qty });
          else day.act({ type: "playAlone" }); // 살 돈이 없으면 쉬게 한다
          return;
        }
        case "playAlone":
        case "playTogether":
          day.act({ type: kind });
          return;
      }
    }

    /** 위기 대응: 카운트다운 중이면 20을 넘길 때까지 먹인다 (한정선이 있는 만큼) */
    function rescue(day: DayRunner) {
      if (plan.rescue === false) return;
      while (day.state.hyejin.countdownTurnsLeft !== null && isDanger(day.state.hyejin.happiness) && day.state.hyejin.hanjeongseon > 0) {
        day.act({ type: "feed", count: 1 });
      }
    }

    function levelUps(day: DayRunner) {
      while (day.state.hyejin.hanjeongseon >= levelUpCost(day.state.hyejin.level) && day.act({ type: "levelUp" })) {
        // 가능한 만큼 레벨업
      }
    }

    return {
      name: plan.name,
      description: plan.description,
      present: (date) => !(plan.skipDays ?? []).includes(dayOfWeek(date)),
      playDay(day, date) {
        // 아침에 하루치 한정선 먹이기
        const feed = Math.min(plan.feedPerDay, day.state.hyejin.hanjeongseon);
        if (feed > 0) day.act({ type: "feed", count: feed });

        // 불닭이 땡기면 같이 놀기 대신 편의점 (같이 놀기가 없는 루틴이면 혼자 놀기 대신)
        let routine = [...plan.routine];
        if (day.state.bulldak === "active") {
          const swap = routine.includes("playTogether") ? "playTogether" : "playAlone";
          const i = routine.indexOf(swap);
          if (i >= 0 && day.act({ type: "convenienceStore" })) routine.splice(i, 1);
        }

        // 토요일: 데이트 (행동 3회) 후 남은 행동은 루틴 앞부분
        if (isWeekend(date) && dayOfWeek(date) === 6) {
          const budget = plan.pickBudget(dateFund);
          const placeId = pickDatePlace(day.state, day.places);
          if (budget !== null && placeId && day.act({ type: "date", placeId, budget, offering: 0 })) {
            dateFund -= budget;
            routine = routine.slice(0, day.state.jungwoo.actionsLeft);
          }
        }

        for (const kind of routine) {
          if (day.state.jungwoo.actionsLeft <= 0) break;
          step(day, kind);
          rescue(day);
        }
        rescue(day);
        levelUps(day);
      },
    };
  };
}

const NORMAL_ROUTINE: Step[] = ["work", "playAlone", "waiting", "work", "playTogether"];

export const STRATEGIES = {
  normal: makeStrategy({
    name: "평범형",
    description: "일 2 · 웨이팅 1 · 혼자 놀기 1 · 같이 놀기 1, 하루 1개 먹임, 돈 반은 한정선 반은 데이트",
    routine: NORMAL_ROUTINE,
    dateRatio: 0.5,
    pickBudget: biggestAffordable,
    feedPerDay: 1,
  }),
  greedy: makeStrategy({
    name: "욕심형",
    description: "일 3 · 웨이팅 1 · 혼자 놀기 1, 먹이기 최소(카운트다운 때만), 데이트 없음",
    routine: ["work", "playAlone", "waiting", "work", "work"],
    dateRatio: 0,
    pickBudget: () => null,
    feedPerDay: 0,
  }),
  greedyNoRescue: makeStrategy({
    name: "욕심형(위기 무시)",
    description: "욕심형인데 카운트다운이 떠도 한정선을 먹이지 않음",
    routine: ["work", "playAlone", "waiting", "work", "work"],
    dateRatio: 0,
    pickBudget: () => null,
    feedPerDay: 0,
    rescue: false,
  }),
  dateAllIn: makeStrategy({
    name: "데이트 몰빵형",
    description: "평범형 루틴, 수입의 90%를 모아 30만 원 데이트만",
    routine: NORMAL_ROUTINE,
    dateRatio: 0.9,
    pickBudget: (fund) => {
      const top = budgetsDesc[0];
      return fund >= top ? top : null;
    },
    feedPerDay: 1,
  }),
  neglect: makeStrategy({
    name: "방치형",
    description: "평범형인데 평일 중 이틀(화·목)은 접속 안 함",
    routine: NORMAL_ROUTINE,
    dateRatio: 0.5,
    pickBudget: biggestAffordable,
    feedPerDay: 1,
    skipDays: [2, 4],
  }),
} satisfies Record<string, () => Strategy>;

export type StrategyId = keyof typeof STRATEGIES;
