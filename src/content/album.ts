import { CHARACTER_ART } from "./characterArt";

/*
 * 사진첩: 그려둔 혜진·정우 그림을 전부 모아 보는 페이지(/album)의 내용.
 * 게임에 나오는 그림은 어디에 나오는지 태그로 자동 표시하고,
 * 게임에 안 쓰는 그림(옆·뒷모습 등)은 사진첩에서만 보인다.
 */

export interface AlbumPhoto {
  /** public 안의 그림 경로 */
  path: string;
  title: string;
  /** 한두 줄 설명 */
  caption: string;
}

export interface AlbumSection {
  id: string;
  title: string;
  photos: AlbumPhoto[];
  /** 전신(세로 2:3) 또는 얼굴·장면(정사각형) */
  shape: "full" | "square";
}

const hj = (file: string, title: string, caption: string): AlbumPhoto => ({ path: `/characters/hyejin/${file}`, title, caption });
const jw = (file: string, title: string, caption: string): AlbumPhoto => ({ path: `/characters/jeongwoo/${file}`, title, caption });

export const ALBUM: AlbumSection[] = [
  {
    id: "hyejin-basic",
    title: "혜진 · 기본 모습",
    shape: "full",
    photos: [
      hj("full-turn-front.webp", "정면", "\"나만 잘살면 돼\" 티셔츠가 포인트. 꿍진이의 기본 자세."),
      hj("album-side.webp", "옆모습", "옆에서 보면 포니테일이 이렇게 길어요."),
      hj("album-back.webp", "뒷모습", "뒤에서 봐도 혜진이인 걸 알 수 있는 포니테일."),
    ],
  },
  {
    id: "hyejin-poses",
    title: "혜진 · 전신 포즈",
    shape: "full",
    photos: [
      hj("full-cards.webp", "카드 쥔 음흉한 웃음", "이번 판은 이미 이긴 표정. 패는 절대 안 보여줌."),
      hj("full-dance.webp", "신나는 춤", "기분 좋을 때 나오는 한 발 들기 춤."),
      hj("full-sunglasses.webp", "선글라스", "오늘은 좀 멋있는 날."),
      hj("full-taco.webp", "타코 냠냠", "두 손으로 꼭 쥐고 먹는 행복한 한 입."),
      hj("full-hands-hips.webp", "허리에 손", "자신감 충전 완료. 무엇이든 덤벼라."),
      hj("full-bucket.webp", "양동이 쓰고 갸우뚱", "앞이 안 보이는데 일단 손은 흔들어 본다."),
      hj("full-awkward.webp", "머쓱한 웃음", "땀 한 방울과 함께 웃어 넘기는 중."),
      hj("full-bump-cry.webp", "혹 나서 울먹", "머리에 혹이 뿅. 울음 참는 중."),
    ],
  },
  {
    id: "hyejin-sad",
    title: "혜진 · 시무룩",
    shape: "full",
    photos: [
      hj("full-sad-rain.webp", "먹구름", "머리 위에만 비가 내린다. 무릎 끌어안고 웅크리기."),
      hj("full-sad-kick.webp", "바닥 콕콕", "고개 푹 숙이고 애꿎은 바닥만 발끝으로 콕콕."),
      hj("full-sad-snack.webp", "빈 과자 봉지", "마지막 한 조각까지 다 먹어버렸다… 눈물 그렁."),
      hj("full-sad-blanket.webp", "담요 동굴", "담요를 뒤집어쓰고 얼굴만 빼꼼. 아무도 말 걸지 마."),
      hj("full-sad-sofa.webp", "소파와 한 몸", "소파에 엎어져서 축 늘어진 채 움직일 생각이 없다."),
      hj("full-sad-window.webp", "창밖 한숨", "창밖을 보며 후우… 오늘따라 하늘도 흐리다."),
      hj("full-sad-pillow.webp", "베개 꼭", "베개를 꼭 끌어안고 입술 삐죽. 달래주길 기다리는 중."),
      hj("full-sad-wet.webp", "비 맞은 꿍진이", "우산도 없이 비 쫄딱 맞고 터덜터덜."),
    ],
  },
  {
    id: "hyejin-angry",
    title: "혜진 · 화남",
    shape: "full",
    photos: [
      hj("full-angry-huff.webp", "흥!", "팔짱 끼고 고개 홱. 콧김이 뿜어져 나온다."),
      hj("full-angry-stomp.webp", "쾅쾅", "발을 쾅쾅 구르며 씩씩. 바닥이 남아나질 않는다."),
      hj("full-angry-steam.webp", "부글부글", "얼굴이 새빨개지고 머리에서 김이 모락모락."),
      hj("full-angry-pillow.webp", "쿠션 투척 직전", "쿠션 두 개를 번쩍. 정우, 피할 준비 해."),
      hj("full-angry-point.webp", "따지기", "\"너 지금 뭐라고 했어?\" 손가락이 정우를 향한다."),
      hj("full-angry-glare.webp", "째려보기", "입 꾹 다물고 실눈으로 째릿. 말 안 해도 다 안다."),
    ],
  },
  {
    id: "hyejin-danger",
    title: "혜진 · 냉동실 위기",
    shape: "full",
    photos: [
      hj("full-danger-fridge.webp", "냉동실 습격", "냉동실 문을 열고 침 주르륵. 한정선이 위험하다."),
      hj("full-danger-spoon.webp", "숟가락 장전", "눈에 불을 켜고 숟가락을 번쩍. 이미 늦었을지도."),
      hj("full-danger-cry.webp", "폭포수 눈물", "눈물이 폭포처럼 쏟아진다. 바닥이 흥건."),
      hj("full-danger-flail.webp", "드러눕기", "바닥에 드러누워 팔다리 버둥버둥. 달래줄 때까지 안 일어남."),
    ],
  },
  {
    id: "hyejin-moments",
    title: "혜진 · 이런저런 순간",
    shape: "square",
    photos: [
      hj("face-mochi.webp", "찹쌀떡 받은 날", "한정선 찹쌀떡을 받으면 세상을 다 가진 얼굴이 된다."),
      hj("face-buldak.webp", "불닭 먹기", "눈에 별이 뜰 만큼 맵고 맛있다."),
      hj("face-full-belly.webp", "배부름", "배 통통. 오늘도 잘 먹었다."),
      hj("face-sleepy.webp", "졸려요", "하품하며 눈 비비는 아침."),
      hj("face-working.webp", "열공 중", "노트북 앞에서 집중 모드. 옆에는 고양이 머그."),
      hj("face-kiss.webp", "뽀뽀 직전", "볼이 빨개진 채 입술 쭉."),
      hj("face-accuse.webp", "손가락질", "범인은 바로 너, 정우!"),
      hj("face-kazoo.webp", "카주 불기", "삐리리~ 박자는 맞는지 모르겠지만 신남."),
      hj("face-singing.webp", "노래하기", "눈 감고 한 손은 가슴에. 혼자 콘서트 중."),
      hj("face-arms-up.webp", "벌서기", "두 손 번쩍. 억울하지만 일단 서 있는다."),
      hj("face-balloon.webp", "보라 풍선", "풍선 하나로 행복해지는 꿍진이."),
      hj("face-skating.webp", "스케이트", "헬멧 쓰고 빙판 위로! 두 팔로 균형 잡는 중."),
    ],
  },
  {
    id: "hyejin-faces",
    title: "혜진 · 표정 모음",
    shape: "square",
    photos: [
      hj("face-default.webp", "기본 얼굴", "눈 감고 방긋. 혜진이의 기본 표정."),
      hj("face-very-happy.webp", "아주 행복", "두 주먹 꼭 쥐고 활짝."),
      hj("face-playful.webp", "장난기", "무슨 꿍꿍이가 있는 얼굴."),
      hj("face-sulking.webp", "볼 빵빵", "삐지면 볼에 바람이 들어간다."),
      hj("face-angry.webp", "화남", "눈썹이 확 내려갔다. 지금은 건드리지 말 것."),
      hj("face-suspicious.webp", "의심의 눈초리", "실눈 뜨고 정우를 의심하는 중."),
      hj("face-surprise.webp", "깜짝 놀람", "두 손으로 볼을 감싸고 \"헉!\""),
      hj("face-clueless.webp", "멍", "머리 위에 물음표. 지금 무슨 일이야?"),
      hj("face-puppy.webp", "강아지 껴안기", "하얀 강아지를 꼭 안고 하트 뿅뿅."),
      hj("face-pleading.webp", "애원하는 눈빛", "두 손 모으고 그렁그렁. 이 눈빛엔 못 이긴다."),
      hj("face-wink.webp", "윙크 브이", "혀 쏙 내밀고 브이!"),
      hj("face-shy.webp", "수줍은 홍조", "볼이 새빨개져서 슬쩍 시선 피하기."),
    ],
  },
  {
    id: "jeongwoo-basic",
    title: "정우 · 기본 모습",
    shape: "full",
    photos: [
      jw("album-front.webp", "정면", "목에 헤드폰은 기본 장착. 정우의 기본 자세."),
      jw("album-side.webp", "옆모습", "옆에서 봐도 헤드폰은 빠지지 않는다."),
      jw("album-back.webp", "뒷모습", "뒤에서 보면 헤드폰 끈만 살짝 보인다."),
    ],
  },
  {
    id: "jeongwoo-day",
    title: "정우 · 하루 일과",
    shape: "full",
    photos: [
      jw("full-music.webp", "음악 감상", "주머니에 손 넣고 헤드폰으로 음악 듣는 평소 모습."),
      jw("full-laptop.webp", "일하기", "셔츠 입고 노트북 앞에서 돈 버는 중. (혜진이를 위해)"),
      jw("full-shopping.webp", "한정선 사 오기", "땡볕 웨이팅 끝에 봉지 들고 귀가."),
      jw("full-dj.webp", "디제잉", "혼자 방에서 턴테이블 돌리며 신났다."),
      jw("full-gaming.webp", "컴퓨터 게임", "게이밍 의자에 앉아 진지하게 한 판."),
      jw("full-poker.webp", "포커 대패", "넋이 나가서 영혼이 빠져나가는 중."),
      jw("full-running.webp", "다급하게 달려가기", "편의점이든 냉동실이든, 혜진이를 위해서라면 전력 질주."),
      jw("full-arms-crossed.webp", "팔짱 끼고 삐짐", "흥. 오늘은 더 이상 안 부려먹힘."),
    ],
  },
  {
    id: "jeongwoo-sulk",
    title: "정우 · 시무룩·삐짐",
    shape: "full",
    photos: [
      jw("full-sulk-corner.webp", "구석 삐짐", "방 구석에서 등 돌리고 체육 자세. 먹구름이 둥둥."),
      jw("full-sulk-blanket.webp", "이불 속 정우", "헤드폰 끼고 이불 속으로. 세상과 잠시 단절."),
      jw("full-sulk-door.webp", "문 뒤에서 빼꼼", "삐져서 들어갔지만 밖이 궁금해서 빼꼼."),
      jw("full-tired.webp", "녹초", "땡볕 웨이팅 끝에 혀까지 내밀고 축 처졌다."),
      jw("album-broke.webp", "텅 빈 지갑", "지갑을 열었더니 나방만 훨훨. 월급날은 언제?"),
    ],
  },
  {
    id: "jeongwoo-sorry",
    title: "정우 · 눈치 보기",
    shape: "full",
    photos: [
      jw("full-sorry-pray.webp", "싹싹 빌기", "두 손 모아 싹싹. 웃고는 있지만 식은땀이 난다."),
      jw("full-sorry-mochi.webp", "찹쌀떡 조공", "찹쌀떡을 접시에 담아 공손히. 이걸로 풀어주세요."),
      jw("full-sorry-kneel.webp", "무릎 꿇고 반성", "무릎 꿇고 고개 숙여 반성 중. 눈물 찔끔."),
    ],
  },
  {
    id: "jeongwoo-faces",
    title: "정우 · 표정 모음",
    shape: "square",
    photos: [
      jw("album-face-default.webp", "기본 얼굴", "잔잔한 미소. 정우의 기본 표정."),
      jw("face-happy.webp", "활짝 웃음", "이가 다 보일 만큼 신났다."),
      jw("face-mock-angry.webp", "팔짱 끼고 흥", "화난 척하지만 사실 별로 안 화남."),
      jw("face-sulking.webp", "볼 부풀리고 삐짐", "입술 삐죽, 볼 빵빵."),
      jw("album-face-flustered.webp", "당황", "안경에 소용돌이가 돌 만큼 머리가 하얘졌다."),
      jw("album-face-adoring.webp", "하트 눈", "혜진이를 볼 때의 눈."),
    ],
  },
  {
    id: "together",
    title: "둘이 함께",
    shape: "square",
    photos: [
      hj("face-with-jeongwoo.webp", "볼 맞대기", "정우가 볼을 꾹 맞대니 혜진이는 땀 삐질. 그래도 웃음은 못 참는다."),
      hj("face-massage.webp", "어깨 주물러 드릴게요", "팔짱 끼고 삐진 혜진이 뒤에서 정우가 열심히 어깨 안마. 효과는… 아직 모름."),
    ],
  },
];

/** 게임 태그 → 화면에 보여줄 말 */
const TAG_TEXT: Record<"hyejin" | "jeongwoo", Record<string, string>> = {
  hyejin: {
    normal: "평소 메인 화면",
    sad: "기분이 안 좋을 때 메인 화면",
    danger: "냉동실 위기 때 메인 화면",
    default: "기본 얼굴",
    eat_mochi: "한정선 먹을 때",
    level_up: "레벨업",
    warning: "냉동실 경고",
    countdown: "냉동실 카운트다운",
    jeongwoo_block: "정우 막기",
    eat_half: "한정선 절반 먹어치울 때",
    buldak_craving: "불닭 땡길 때",
    buldak_eat: "불닭 먹을 때",
    play_together: "같이 놀 때",
    date_1star: "데이트 별 1개",
    date_2star: "데이트 별 2개",
    date_3star: "데이트 별 3개",
    new_place: "새 추억 알림",
    away_summary: "밤사이 있었던 일",
  },
  jeongwoo: {
    idle: "평소 정우 카드",
    work: "일 시킨 뒤",
    waiting: "웨이팅 다녀온 뒤",
    play_dj: "혼자 디제잉 뒤",
    play_game: "혼자 게임 뒤",
    run: "편의점 심부름 · 정우 막기",
    sulk: "삐졌을 때",
    apologize: "혜진 기분이 안 좋을 때",
    happy: "정우 승진",
  },
};

/** 그림이 게임 어디에 나오는지. 사진첩에만 있는 그림이면 빈 배열. */
export function albumUsage(path: string): string[] {
  const art = CHARACTER_ART.find((a) => a.path === path);
  if (!art) return [];
  return art.tags.map((t) => TAG_TEXT[art.character][t] ?? t);
}

export const ALBUM_PHOTO_COUNT = ALBUM.reduce((n, s) => n + s.photos.length, 0);
