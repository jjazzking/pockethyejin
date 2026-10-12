import { describe, expect, it } from "vitest";
import { aggregate } from "../report";
import { seededRng, simulateRun } from "../simulate";
import { STRATEGIES } from "../strategies";

const short = { weeks: 2, startDate: "2026-01-05", placeCount: 20 };

describe("시뮬레이터", () => {
  it("같은 시드면 같은 결과", () => {
    expect(simulateRun(STRATEGIES.normal, 7, short)).toEqual(simulateRun(STRATEGIES.normal, 7, short));
  });

  it("시드 난수는 [0, 1) 범위", () => {
    const rng = seededRng(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("모든 전략이 끝까지 돈다", () => {
    for (const make of Object.values(STRATEGIES)) {
      const r = simulateRun(make, 1, short);
      expect(r.levelByWeek).toHaveLength(2);
      expect(r.levelByWeek[1]).toBeGreaterThanOrEqual(1);
    }
  });

  it("욕심형은 일을 많이 시켜서 사흘 안에 경고가 뜬다", () => {
    const r = simulateRun(STRATEGIES.greedy, 1, short);
    expect(r.firstWarningDay).not.toBeNull();
    expect(r.firstWarningDay!).toBeLessThanOrEqual(3);
  });

  it("방치형은 접속 안 한 날 불닭을 놓친다", () => {
    const runs = Array.from({ length: 20 }, (_, i) => simulateRun(STRATEGIES.neglect, i + 1, short));
    expect(aggregate("방치형", runs).bulldakMissed).toBeGreaterThan(0);
  });
});
