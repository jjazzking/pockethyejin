import { describe, expect, it } from "vitest";
import {
  applyOffering,
  budgetPercents,
  incomeForRank,
  levelUpCost,
  maxUsefulOffering,
  rankForWorkCount,
  rejectPercent,
  rollStars,
} from "../rules";
import { fixed } from "./helpers";

describe("승진", () => {
  it("누적 일 횟수 기준으로 직급이 오른다", () => {
    expect(rankForWorkCount(0)).toBe(1);
    expect(rankForWorkCount(19)).toBe(1);
    expect(rankForWorkCount(20)).toBe(2);
    expect(rankForWorkCount(49)).toBe(2);
    expect(rankForWorkCount(50)).toBe(3);
    expect(rankForWorkCount(100)).toBe(4);
    expect(rankForWorkCount(170)).toBe(5);
    expect(rankForWorkCount(9999)).toBe(5);
  });

  it("직급별 일 1회 수입", () => {
    expect([1, 2, 3, 4, 5].map(incomeForRank)).toEqual([30_000, 45_000, 67_500, 100_000, 150_000]);
  });
});

describe("레벨업 비용", () => {
  it("10에서 시작해 직전 비용 ×1.4 반올림", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(levelUpCost)).toEqual([10, 14, 20, 28, 39, 55, 77]);
  });
});

describe("웨이팅 거절 확률", () => {
  it("50 이상이면 0%", () => {
    expect(rejectPercent(100)).toBe(0);
    expect(rejectPercent(50)).toBe(0);
  });
  it("50 미만은 1당 +2%p", () => {
    expect(rejectPercent(49)).toBe(2);
    expect(rejectPercent(30)).toBe(40);
    expect(rejectPercent(10)).toBe(80);
    expect(rejectPercent(0)).toBe(100);
  });
});

describe("데이트 확률", () => {
  it("예산은 정해진 세 가지만", () => {
    expect(budgetPercents(50_000)).toEqual({ 1: 60, 2: 30, 3: 10 });
    expect(budgetPercents(150_000)).toEqual({ 1: 20, 2: 40, 3: 40 });
    expect(budgetPercents(300_000)).toEqual({ 1: 0, 2: 20, 3: 80 });
    expect(budgetPercents(100_000)).toBeNull();
  });

  it("한정선 5개당 3성 +10%p, 1성에서 먼저 뺀다", () => {
    expect(applyOffering({ 1: 60, 2: 30, 3: 10 }, 5)).toEqual({ 1: 50, 2: 30, 3: 20 });
    expect(applyOffering({ 1: 20, 2: 40, 3: 40 }, 15)).toEqual({ 1: 0, 2: 30, 3: 70 });
  });

  it("1성이 0이면 2성에서 빼고, 3성은 최대 95%", () => {
    expect(applyOffering({ 1: 0, 2: 20, 3: 80 }, 5)).toEqual({ 1: 0, 2: 10, 3: 90 });
    expect(applyOffering({ 1: 0, 2: 20, 3: 80 }, 10)).toEqual({ 1: 0, 2: 5, 3: 95 });
  });

  it("95%에 닿는 데 필요한 최대 개수", () => {
    expect(maxUsefulOffering({ 1: 0, 2: 20, 3: 80 })).toBe(10);
    expect(maxUsefulOffering({ 1: 20, 2: 40, 3: 40 })).toBe(30);
    expect(maxUsefulOffering({ 1: 60, 2: 30, 3: 10 })).toBe(45);
  });

  it("난수 구간에 따라 별 개수가 정해진다", () => {
    const p = { 1: 60, 2: 30, 3: 10 } as const;
    expect(rollStars(fixed(0), p)).toBe(1);
    expect(rollStars(fixed(0.599), p)).toBe(1);
    expect(rollStars(fixed(0.6), p)).toBe(2);
    expect(rollStars(fixed(0.899), p)).toBe(2);
    expect(rollStars(fixed(0.9), p)).toBe(3);
    expect(rollStars(fixed(0), { 1: 0, 2: 20, 3: 80 })).toBe(2);
  });
});
