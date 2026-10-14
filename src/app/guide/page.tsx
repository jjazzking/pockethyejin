import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BALANCE } from "@/game";
import { daysTogether } from "@/game/date";
import { levelUpCost } from "@/game/rules";
import { formatMoney } from "@/ui/copy";
import album from "../album/album.module.css";
import styles from "./guide.module.css";

export const metadata: Metadata = {
  title: "꿍진이 키우기 · 게임 방법",
  description: "꿍진이 키우기 게임 방법",
};

const { TIME, ACTIONS: A, FEED, DAY_END, SULK, WARNING, BULLDAK, DATE_BUDGETS, DATE_OFFERING, RANKS, SOCIAL } = BALANCE;
const plus = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** public/guide 의 실제 게임 화면 캡처 (체험 모드) */
const SHOTS = {
  main: { w: 585, h: 1266, caption: "메인 화면" },
  night: { w: 540, h: 562, caption: "자고 일어나면" },
  map: { w: 585, h: 1266, caption: "추억 지도" },
  bulldak: { w: 585, h: 1266, caption: "불닭 땡기는 날" },
  social: { w: 585, h: 1266, caption: "번개 약속" },
  countdown: { w: 585, h: 1266, caption: "카운트다운" },
  block: { w: 525, h: 832, caption: "정우가 막아줄 때" },
  "date-plan": { w: 585, h: 1266, caption: "데이트 고르기" },
  "date-result": { w: 562, h: 592, caption: "다녀오면" },
  events: { w: 585, h: 1266, caption: "이벤트 도감" },
} as const;

function Shots({ names }: { names: (keyof typeof SHOTS)[] }) {
  return (
    <div className={styles.shots}>
      {names.map((n) => (
        <figure key={n} className={styles.shot}>
          <Image src={`/guide/${n}.webp`} width={SHOTS[n].w} height={SHOTS[n].h} alt={`${SHOTS[n].caption} 화면`} />
          <figcaption>{SHOTS[n].caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** 게임 방법. 숫자는 전부 balance.ts에서 가져와서 밸런스를 바꾸면 설명도 같이 바뀐다. */
export default function GuidePage() {
  return (
    <div className={album.page}>
      <header className={album.header}>
        <Link href="/" className={album.back}>
          ← 게임으로
        </Link>
        <h1 className={album.title}>❓ 게임 방법</h1>
        <p className={album.lead}>정우를 부려먹어서 혜진이를 키우는 게임. 레벨업할 때마다 우리가 실제로 다녀온 장소가 하나씩 열려요.</p>
      </header>

      <section className={styles.card}>
        <h2>🌙 하루 흐름</h2>
        <ul>
          <li>
            게임은 사귄 첫날 <b>2026년 3월 30일</b>({daysTogether(TIME.START_DATE)}일째)부터 시작해요.
          </li>
          <li>
            하루에 <b>정우 행동 {TIME.ACTIONS_PER_DAY}번</b>. 다 쓰면 <b>잠자기</b>로 다음 날 아침으로 넘어가요. 남은 행동은 사라져요.
          </li>
          <li>
            잠은 <b>현실 하루에 {TIME.NIGHTS_PER_REAL_DAY}번</b>까지 잘 수 있어요. 아침 {TIME.REAL_DAY_RESET_HOUR}시에 다시 차요.
          </li>
          <li>자고 일어나면 밤사이 있었던 일(출근, 불닭, 삐짐 풀림)을 알려줘요.</li>
        </ul>
        <Shots names={["main", "night"]} />
      </section>

      <section className={styles.card}>
        <h2>💼 정우 부려먹기 (행동 1번씩)</h2>
        <ul>
          <li>
            <b>일 시키기</b>: 돈 +{formatMoney(RANKS[0].incomePerWork)}(승진하면 더 많이), 정우 행복도 {plus(A.WORK.JUNGWOO_HAPPINESS)}. 일을 많이 하면 승진해요.
          </li>
          <li>
            <b>한정선 웨이팅</b>: 1개 {formatMoney(A.WAITING.PRICE_PER_HANJEONGSEON)}, 정우 {plus(A.WAITING.JUNGWOO_HAPPINESS)}. 정우 행복도가 {SULK.SAFE_HAPPINESS} 밑이면{" "}
            <b>삐져서 거절</b>할 수 있고, 삐지면 그날 행동이 끝나요.
          </li>
          <li>
            <b>혼자 놀기</b>(디제잉·게임): 정우 {plus(A.PLAY_ALONE.JUNGWOO_HAPPINESS)}. 정우 기분 회복용.
          </li>
          <li>
            <b>같이 놀기</b>: 혜진 {plus(A.PLAY_TOGETHER.HYEJIN_HAPPINESS)}, 정우 {plus(A.PLAY_TOGETHER.JUNGWOO_HAPPINESS)}.
          </li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2>🍡 혜진이 챙기기 (행동 안 씀)</h2>
        <ul>
          <li>
            <b>한정선 먹이기</b>: 1개당 혜진 행복도 {plus(FEED.HYEJIN_HAPPINESS_PER_HANJEONGSEON)}.
          </li>
          <li>
            <b>레벨업</b>: 한정선을 써서 레벨을 올리면 <b>추억 지도에 새 장소</b>가 열려요. 첫 레벨업은 {levelUpCost(1)}개, 그다음부터 점점 비싸져요(
            {levelUpCost(2)} → {levelUpCost(3)} → {levelUpCost(4)} …).
          </li>
        </ul>
        <Shots names={["map"]} />
      </section>

      <section className={styles.card}>
        <h2>😢 혜진 기분이 떨어지는 때</h2>
        <ul>
          <li>
            평일 하루가 끝나면 출근 피로로 {plus(DAY_END.WEEKDAY_COMMUTE)}.
          </li>
          <li>
            정우가 하루에 일을 {DAY_END.OVERWORK_THRESHOLD}번 이상 하면 {plus(DAY_END.OVERWORK_PENALTY)} (일만 하면 서운해요).
          </li>
          <li>
            평일에 가끔({BULLDAK.WEEKDAY_CHANCE_PERCENT}%) 혜진이가 <b>오늘 밤 불닭이 땡긴대요</b>. 아침에 미리 알려주니, 자기 전까지 정우를 편의점에 보내면{" "}
            {plus(A.CONVENIENCE_STORE.HYEJIN_HAPPINESS)}, 안 보내면 {plus(DAY_END.BULLDAK_IGNORED_PENALTY)}.
          </li>
        </ul>
        <Shots names={["bulldak"]} />
      </section>

      <section className={styles.card}>
        <h2>🎲 번개 약속 (랜덤 이벤트)</h2>
        <p>
          아침에 {SOCIAL.CHANCE_PERCENT}% 확률로 번개 약속이 생겨요. <b>정우 행동은 안 써요</b>. 대신 돈이나 다음 날 피로가 들어요. 안 고르면 그냥 지나가요.
        </p>
        <ul>
          <li>
            🃏 <b>번개 포커</b>: 혜진 +{SOCIAL.EVENTS.poker.go.hyejin}, 정우 +{SOCIAL.EVENTS.poker.go.jungwoo}. 밤새 쳐서 다음 날 정우 행동 -{SOCIAL.EVENTS.poker.go.tired}.
          </li>
          <li>
            👯 <b>민정·다은과 놀기</b>: 혜진만 보내면 혜진 +{SOCIAL.EVENTS.friends.solo.hyejin}. 정우도 합류하면 혜진 +{SOCIAL.EVENTS.friends.join.hyejin}, 정우 +
            {SOCIAL.EVENTS.friends.join.jungwoo}, {formatMoney(SOCIAL.EVENTS.friends.join.money)}.
          </li>
          <li>
            🍗 <b>야식 번개</b>: 혜진 +{SOCIAL.EVENTS.snack.order.hyejin}, 정우 +{SOCIAL.EVENTS.snack.order.jungwoo}, {formatMoney(SOCIAL.EVENTS.snack.order.money)}.
          </li>
        </ul>
        <Shots names={["social"]} />
      </section>

      <section className={`${styles.card} ${styles.danger}`}>
        <h2>🧊 냉동실 위기</h2>
        <ol>
          <li>
            혜진 행복도가 <b>{WARNING.WARNING_HAPPINESS} 이하</b>면 냉동실을 힐끔거리기 시작해요(경고).
          </li>
          <li>
            <b>{WARNING.DANGER_HAPPINESS} 이하</b>가 되면 <b>{WARNING.COUNTDOWN_TURNS}턴 카운트다운</b>. 이 동안엔 레벨업도 못 해요.
          </li>
          <li>
            그래도 못 올리면 처음 한 번은 <b>정우가 막아줘요</b>. 그다음부터는 혜진이가 냉동실 한정선의 <b>절반을 먹어치워요</b>.
          </li>
        </ol>
        <p className={styles.tip}>💡 한정선을 몇 개 남겨두면 위기 때 바로 먹여서 넘길 수 있어요.</p>
        <Shots names={["countdown", "block"]} />
      </section>

      <section className={styles.card}>
        <h2>💑 주말 데이트</h2>
        <ul>
          <li>
            주말에 한 번, 열린 장소 중 하나로 데이트(정우 행동 {A.DATE.ACTION_COST}번). 혜진 {plus(A.DATE.HYEJIN_HAPPINESS)}(별 3개면{" "}
            {plus(A.DATE.HYEJIN_HAPPINESS_THREE_STARS)}), 정우 {plus(A.DATE.JUNGWOO_HAPPINESS)}.
          </li>
          <li>예산이 클수록 별이 잘 나와요. 별 개수마다 그날의 에피소드가 달라요.</li>
        </ul>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>예산</th>
              <th>★</th>
              <th>★★</th>
              <th>★★★</th>
            </tr>
          </thead>
          <tbody>
            {DATE_BUDGETS.map((b) => (
              <tr key={b.amount}>
                <td>{formatMoney(b.amount)}</td>
                <td>{b.starPercents[1]}%</td>
                <td>{b.starPercents[2]}%</td>
                <td>{b.starPercents[3]}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.tip}>
          💡 별 3개를 아직 못 받은 장소는 한정선을 {DATE_OFFERING.BUNDLE_SIZE}개씩 바쳐서 3성 확률을 {DATE_OFFERING.PERCENT_PER_BUNDLE}%p씩 올릴 수 있어요(최대{" "}
          {DATE_OFFERING.MAX_THREE_STAR_PERCENT}%).
        </p>
        <Shots names={["date-plan", "date-result"]} />
      </section>

      <section className={styles.card}>
        <h2>✨ 그 밖에</h2>
        <ul>
          <li>
            <b>🎬 이벤트</b> 탭에는 지금까지 만난 이벤트(불닭, 번개 약속, 승진, 냉동실 사수 등)가 모여요. 아직 못 만난 건 ???로 보여요.
          </li>
          <li>정우가 새 장소를 추가하면 다음 접속 때 &quot;새 추억이 추가됐어요!&quot; 알림이 떠요.</li>
          <li>메인 화면의 혜진이를 누르면 다른 포즈로 바뀌어요.</li>
          <li>
            위쪽 <b>📸 사진첩</b>에서 그동안 그린 혜진이와 정우를 전부 볼 수 있어요.
          </li>
        </ul>
        <Shots names={["events"]} />
      </section>
    </div>
  );
}
