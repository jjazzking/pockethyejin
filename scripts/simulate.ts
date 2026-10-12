/**
 * 밸런스 시뮬레이터. 규칙 엔진(src/game)과 balance.ts를 그대로 쓴다.
 *
 *   npm run simulate                       # 전략 4개 × 12주 × 100회
 *   npm run simulate -- --weeks 8 --runs 300 --seed 42
 *   npm run simulate -- --strategy greedy --json
 */
import { aggregate, formatReport } from "@/sim/report";
import { DEFAULT_SIM, simulateMany } from "@/sim/simulate";
import { STRATEGIES, type StrategyId } from "@/sim/strategies";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const weeks = Number(arg("weeks", "12"));
const runs = Number(arg("runs", "100"));
const seed = Number(arg("seed", "1"));
const only = arg("strategy", "");
const ids = (only ? only.split(",") : Object.keys(STRATEGIES)) as StrategyId[];

const aggs = ids.map((id) => {
  const make = STRATEGIES[id];
  if (!make) throw new Error(`알 수 없는 전략: ${id} (가능: ${Object.keys(STRATEGIES).join(", ")})`);
  return aggregate(make().name, simulateMany(make, runs, seed, { ...DEFAULT_SIM, weeks }));
});

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(aggs, null, 2));
} else {
  console.log(`# 밸런스 시뮬레이션: ${weeks}주 × ${runs}회 (시드 ${seed}부터), 장소 ${DEFAULT_SIM.placeCount}개 가정\n`);
  for (const id of ids) {
    const s = STRATEGIES[id]();
    console.log(`- ${s.name}: ${s.description}`);
  }
  console.log("");
  console.log(formatReport(aggs));
}
