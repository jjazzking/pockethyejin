import { RANKS } from "@/game/balance";
import type { RunResult } from "./simulate";

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (n: number, d = 1) => (Number.isNaN(n) ? "-" : n.toFixed(d));

export interface Aggregate {
  name: string;
  runs: number;
  levelByWeek: number[];
  levelMinByWeek: number[];
  levelMaxByWeek: number[];
  hyejinByWeek: number[];
  /** 단계 → { 도달 비율, 평균 도달일 } */
  promotions: { rank: number; reachedRatio: number; meanDay: number }[];
  rejections: number;
  warnings: number;
  countdowns: number;
  blocks: number;
  halfEats: number;
  firstWarningDayMedian: number;
  firstHalfEatDayMedian: number;
  halfEatRunRatio: number;
  dates: number;
  threeStarRatio: number;
  bulldakMissed: number;
  finalHyejin: number;
}

export function aggregate(name: string, results: RunResult[]): Aggregate {
  const weeks = results[0]?.levelByWeek.length ?? 0;
  const col = (pick: (r: RunResult) => number[]) => Array.from({ length: weeks }, (_, w) => results.map((r) => pick(r)[w]));
  const levels = col((r) => r.levelByWeek);
  const totalDates = results.reduce((a, r) => a + r.dates, 0);
  const firstWarn = results.flatMap((r) => (r.firstWarningDay === null ? [] : [r.firstWarningDay]));
  const firstHalf = results.flatMap((r) => (r.firstHalfEatDay === null ? [] : [r.firstHalfEatDay]));
  return {
    name,
    runs: results.length,
    levelByWeek: levels.map(mean),
    levelMinByWeek: levels.map((l) => Math.min(...l)),
    levelMaxByWeek: levels.map((l) => Math.max(...l)),
    hyejinByWeek: col((r) => r.hyejinByWeek).map(mean),
    promotions: RANKS.slice(1).map((_, i) => {
      const rank = i + 2;
      const days = results.flatMap((r) => (r.promotionDay[rank] ? [r.promotionDay[rank]] : []));
      return { rank, reachedRatio: days.length / results.length, meanDay: mean(days) };
    }),
    rejections: mean(results.map((r) => r.rejections)),
    warnings: mean(results.map((r) => r.warnings)),
    countdowns: mean(results.map((r) => r.countdowns)),
    blocks: mean(results.map((r) => r.blocks)),
    halfEats: mean(results.map((r) => r.halfEats)),
    firstWarningDayMedian: median(firstWarn),
    firstHalfEatDayMedian: median(firstHalf),
    halfEatRunRatio: firstHalf.length / results.length,
    dates: mean(results.map((r) => r.dates)),
    threeStarRatio: totalDates ? results.reduce((a, r) => a + r.threeStarDates, 0) / totalDates : NaN,
    bulldakMissed: mean(results.map((r) => r.bulldakMissed)),
    finalHyejin: mean(results.map((r) => r.finalHyejin)),
  };
}

export function formatReport(aggs: Aggregate[]): string {
  const lines: string[] = [];
  const weeks = aggs[0]?.levelByWeek.length ?? 0;
  const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - [...s].length * (/[가-힣]/.test(s) ? 1.6 : 1)));
  const nameW = 14;

  lines.push(`## 주차별 평균 레벨 (주말 마감 기준, ${aggs[0]?.runs ?? 0}회 평균)`);
  lines.push(pad("주차", nameW) + Array.from({ length: weeks }, (_, w) => String(w + 1).padStart(6)).join(""));
  for (const a of aggs) lines.push(pad(a.name, nameW) + a.levelByWeek.map((v) => fmt(v).padStart(6)).join(""));
  lines.push("");
  lines.push("## 주간 해금 수 (평균 레벨 증가량)");
  for (const a of aggs) {
    const inc = a.levelByWeek.map((v, i) => v - (i === 0 ? 1 : a.levelByWeek[i - 1]));
    lines.push(pad(a.name, nameW) + inc.map((v) => fmt(v).padStart(6)).join(""));
  }
  lines.push("");
  lines.push("## 주차별 평균 혜진 행복도");
  for (const a of aggs) lines.push(pad(a.name, nameW) + a.hyejinByWeek.map((v) => fmt(v, 0).padStart(6)).join(""));
  lines.push("");
  lines.push("## 승진 시점 (평균 도달일 · 도달 비율)");
  for (const a of aggs) {
    lines.push(pad(a.name, nameW) + a.promotions.map((p) => `${p.rank}단계 ${fmt(p.meanDay, 0)}일(${Math.round(p.reachedRatio * 100)}%)`.padStart(18)).join(""));
  }
  lines.push("");
  lines.push("## 사건 (12주 동안 1회 실행당 평균)");
  lines.push(
    pad("", nameW) +
      ["거절", "경고", "카운트다운", "정우막기", "절반섭취", "첫경고(일)", "첫절반(일)", "절반 겪은 비율", "데이트", "3성 비율", "놓친 불닭", "최종 혜진"]
        .map((h) => h.padStart(9))
        .join(""),
  );
  for (const a of aggs) {
    lines.push(
      pad(a.name, nameW) +
        [
          fmt(a.rejections),
          fmt(a.warnings),
          fmt(a.countdowns),
          fmt(a.blocks, 2),
          fmt(a.halfEats),
          fmt(a.firstWarningDayMedian, 0),
          fmt(a.firstHalfEatDayMedian, 0),
          `${Math.round(a.halfEatRunRatio * 100)}%`,
          fmt(a.dates),
          Number.isNaN(a.threeStarRatio) ? "-" : `${Math.round(a.threeStarRatio * 100)}%`,
          fmt(a.bulldakMissed),
          fmt(a.finalHyejin, 0),
        ]
          .map((v) => v.padStart(11))
          .join(""),
    );
  }
  return lines.join("\n");
}
