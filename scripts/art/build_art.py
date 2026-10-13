"""
잘라낸 그림(cut_sheets.py 결과) → 게임용 투명 그림 + 시드 SQL + 체험 모드 목록.

  python3 scripts/art/cut_sheets.py incoming /tmp/art-raw
  python3 scripts/art/build_art.py /tmp/art-raw

- 흰 배경을 투명하게 지운다. 팔과 몸 사이처럼 막힌 빈틈은 GAPS에 적은 위치만 지운다
  (눈 흰자·이빨·반사광은 색으로 구분이 안 돼서 자동으로 지우지 않는다).
- 전신은 1024x1536 캔버스에 같은 배율로 넣고 발끝을 바닥선에 맞춘다.
- 얼굴(팝업)은 1024x1024 캔버스에 같은 배율로 넣고 아래쪽에 붙인다.
  배율은 원본 크기가 같은 그림끼리(scale 그룹) 하나로 맞춘다.
- public/characters/ 에 WebP로 저장하고, 시드 SQL(묶음별)과 src/content/characterArt.ts 를 만든다.
"""
import os, sys
import numpy as np, cv2
from PIL import Image

RAW = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC = os.path.join(ROOT, "public")
MIGRATIONS = os.path.join(ROOT, "supabase", "migrations")
TS = os.path.join(ROOT, "src", "content", "characterArt.ts")

# 시드 SQL 묶음. 이미 배포한 묶음의 행은 바꾸지 말고, 새 그림은 새 묶음으로 추가한다.
BATCHES = {
    "hyejin": ("20261013000300_seed_hyejin_art.sql", "혜진 그림 시드", True),
    "jeongwoo": ("20261013000400_seed_jeongwoo_art.sql", "정우 그림 시드 (+ 혜진·정우 함께 있는 팝업 그림)", False),
}

HJ = dict(character="hyejin", batch="hyejin")
HJ_FULL = dict(HJ, kind="full", scale="hj-full", framed=False)
HJ_FACE = dict(HJ, kind="face", scale="hj-box", framed=True)
JW_FULL = dict(character="jeongwoo", batch="jeongwoo", kind="full", scale="jw-pose", framed=False)
JW_FACE = dict(character="jeongwoo", batch="jeongwoo", kind="face", scale="jw-face", framed=False)


def art(name, base, tags, desc, file=None):
    return dict(base, name=name, tags=tags, desc=desc, file=file)


# 순서가 곧 id 번호다 — 기존 항목 사이에 끼워 넣지 말고 끝에 붙일 것.
ART = [
    art("hj_turn_front",      HJ_FULL, ["normal"],          "정면 기본 자세"),
    art("hj_cards",           HJ_FULL, ["normal"],          "카드 들고 음흉한 웃음"),
    art("hj_dance",           HJ_FULL, ["normal"],          "신나는 춤"),
    art("hj_sunglasses",      HJ_FULL, ["normal"],          "선글라스"),
    art("hj_taco",            HJ_FULL, ["normal"],          "타코 냠냠"),
    art("hj_hands_hips",      HJ_FULL, ["normal"],          "허리에 손"),
    art("hj_bucket",          HJ_FULL, ["normal"],          "양동이 쓰고 갸우뚱"),
    art("hj_awkward",         HJ_FULL, ["sad"],             "머쓱한 웃음 (땀방울)"),
    art("hj_bump_cry",        HJ_FULL, ["sad", "danger"],   "혹 나서 울먹"),
    art("hj_face_default",    HJ_FACE, ["default"],         "기본 얼굴"),
    art("hj_mochi",           HJ_FACE, ["eat_mochi"],       "찹쌀떡 받고 신남"),
    art("hj_full_belly",      HJ_FACE, ["eat_half"],        "배 두드리며 배부름"),
    art("hj_face_pleading",   HJ_FACE, ["buldak_craving"],  "애원하는 눈빛"),
    art("hj_buldak",          HJ_FACE, ["buldak_eat"],      "불닭 먹기"),
    art("hj_face_very_happy", HJ_FACE, ["level_up"],        "아주 행복"),
    art("hj_balloon",         HJ_FACE, ["level_up"],        "보라 풍선"),
    art("hj_face_sulking",    HJ_FACE, ["warning"],         "볼 빵빵 삐짐"),
    art("hj_face_suspicious", HJ_FACE, ["warning"],         "의심의 눈초리"),
    art("hj_face_angry",      HJ_FACE, ["countdown"],       "화남"),
    art("hj_arms_up",         HJ_FACE, ["countdown"],       "벌서기"),
    art("hj_accuse",          HJ_FACE, ["jeongwoo_block"],  "손가락질"),
    art("hj_kazoo",           HJ_FACE, ["play_together"],   "카주 불기"),
    art("hj_singing",         HJ_FACE, ["play_together"],   "노래하기"),
    art("hj_face_puppy",      HJ_FACE, ["play_together"],   "강아지 껴안기"),
    art("hj_face_clueless",   HJ_FACE, ["date_1star"],      "멍한 얼굴"),
    art("hj_face_wink",       HJ_FACE, ["date_2star"],      "윙크 브이"),
    art("hj_face_playful",    HJ_FACE, ["date_2star"],      "장난스러운 얼굴"),
    art("hj_kiss",            HJ_FACE, ["date_3star"],      "뽀뽀 직전"),
    art("hj_face_shy",        HJ_FACE, ["date_3star"],      "수줍은 홍조"),
    art("hj_face_surprise",   HJ_FACE, ["new_place"],       "깜짝 놀람"),
    art("hj_skating",         HJ_FACE, ["new_place"],       "스케이트"),
    art("hj_sleepy",          HJ_FACE, ["away_summary"],    "졸려서 눈 비비기"),
    art("hj_working",         HJ_FACE, ["away_summary"],    "노트북으로 공부 중"),
    # --- 정우 (전신 포즈 태그: idle/work/waiting/play_dj/play_game/run/sulk, 얼굴: happy/sulk)
    art("jw_music",           JW_FULL, ["idle"],            "헤드폰 끼고 음악 감상"),
    art("jw_laptop",          JW_FULL, ["work"],            "노트북으로 일하기"),
    art("jw_shopping",        JW_FULL, ["waiting"],         "한정선 사서 돌아오기"),
    art("jw_dj",              JW_FULL, ["play_dj"],         "디제잉"),
    art("jw_gaming",          JW_FULL, ["play_game"],       "컴퓨터 게임"),
    art("jw_poker",           JW_FULL, ["play_game"],       "포커 지고 넋 나감"),
    art("jw_running",         JW_FULL, ["run"],             "다급하게 달려가기"),
    art("jw_arms_crossed",    JW_FULL, ["sulk"],            "팔짱 끼고 삐짐"),
    art("jw_face_happy",      JW_FACE, ["happy"],           "활짝 웃음"),
    art("jw_face_sulking",    JW_FACE, ["sulk"],            "볼 부풀리고 삐짐"),
    art("jw_face_mock_angry", JW_FACE, ["sulk"],            "팔짱 끼고 흥"),
    art("jw_hj_cheek", dict(HJ, kind="face", scale="duo", framed=False, batch="jeongwoo"),
        ["play_together"], "정우가 혜진 볼에 볼 맞대기", file="face-with-jeongwoo.webp"),
    # --- 사진첩에서만 보는 그림 (batch=None: 게임 데이터·시드에 넣지 않는다. 설명은 src/content/album.ts)
    art("hj_turn_side",       dict(HJ_FULL, batch=None), [], "옆모습", file="album-side.webp"),
    art("hj_turn_back",       dict(HJ_FULL, batch=None), [], "뒷모습", file="album-back.webp"),
    art("jw_turn_front",      dict(JW_FULL, batch=None, scale="jw-turn"), [], "정면", file="album-front.webp"),
    art("jw_turn_side",       dict(JW_FULL, batch=None, scale="jw-turn"), [], "옆모습", file="album-side.webp"),
    art("jw_turn_back",       dict(JW_FULL, batch=None, scale="jw-turn"), [], "뒷모습", file="album-back.webp"),
    art("jw_face_default",    dict(JW_FACE, batch=None), [], "기본 얼굴", file="album-face-default.webp"),
    art("jw_face_flustered",  dict(JW_FACE, batch=None), [], "당황", file="album-face-flustered.webp"),
    art("jw_face_adoring",    dict(JW_FACE, batch=None), [], "하트 눈", file="album-face-adoring.webp"),
]

# 막힌 빈틈(배경) 위치. 잘라낸 그림 안의 비율 좌표 (x, y)
GAPS = {
    "hj_hands_hips": [(0.214, 0.600), (0.762, 0.600)],
    "hj_sunglasses": [(0.247, 0.429)],
    "hj_accuse":     [(0.364, 0.623), (0.409, 0.637)],
    "hj_balloon":    [(0.742, 0.670)],
    "hj_skating":    [(0.730, 0.802), (0.592, 0.818)],
    "hj_sleepy":     [(0.668, 0.660)],
    "jw_laptop":     [(0.896, 0.699), (0.552, 0.880)],
    "jw_dj":         [(0.649, 0.469), (0.352, 0.716)],
    "jw_gaming":     [(0.160, 0.425), (0.519, 0.662), (0.356, 0.910), (0.391, 0.952), (0.189, 0.956)],
    "jw_poker":      [(0.599, 0.613)],
    "jw_face_flustered": [(0.242, 0.650), (0.751, 0.651)],
}

FULL_W, FULL_H, FACE = 1024, 1536, 1024
MARGIN = 24


def background(rgb, name, framed):
    a = rgb.astype(np.float32)
    mn, mx = a.min(2), a.max(2)
    nw = ((mn >= 245) & (mx - mn <= 8)).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(nw, 4)
    H, W = nw.shape
    x, y, w, h = st[:, 0], st[:, 1], st[:, 2], st[:, 3]
    if framed:
        # 칸 테두리에 잘린 그림은 아래쪽에서 옷이 테두리에 닿는다 → 위쪽·옆 위쪽에 닿은 흰 영역만 배경
        is_bg = (y == 0) | (((x == 0) | (x + w == W)) & (y < H * 0.7))
    else:
        is_bg = (x == 0) | (y == 0) | (x + w == W) | (y + h == H)
    is_bg[0] = False
    for gx, gy in GAPS.get(name, []):
        best = 1 + int(np.argmin((cen[1:, 0] / W - gx) ** 2 + (cen[1:, 1] / H - gy) ** 2))
        is_bg[best] = True
    bg = is_bg[lab]
    # 배경 위의 아주 흐린 얼룩(잡티)도 배경
    k, flab, fst, _ = cv2.connectedComponentsWithStats((~bg).astype(np.uint8), 8)
    dark = np.bincount(flab[mn < 200], minlength=k)
    speck = (fst[:, cv2.CC_STAT_AREA] < 400) & (dark == 0)
    speck[0] = False
    return a, mn, bg | speck[flab]


def cutout(rgb, name, framed):
    a, mn, bg = background(rgb, name, framed)
    near = cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~bg
    alpha = np.ones(bg.shape, np.float32)
    alpha[bg] = 0
    alpha[near] = np.clip((255 - mn) / 70.0, 0, 1)[near]
    al = np.maximum(alpha, 1e-3)[..., None]
    col = np.clip((a - 255 * (1 - al)) / al, 0, 255)  # 흰 테두리 번짐 제거
    col[alpha == 0] = 0
    return Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), "RGBA")


def trim(im):
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())


def place(im, scale, cw, ch, anchor_x):
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = round(cw / 2 - anchor_x * scale)
    x = max(0, min(cw - im.width, x))
    y = ch - im.height - (MARGIN if ch == FULL_H else 0)
    canvas.alpha_composite(im, (x, max(0, y)))
    return canvas


def feet_center(im):
    """다리 쪽(아래 20%) 불투명 픽셀의 가로 중심 — 포즈가 달라도 서 있는 자리가 같게"""
    a = np.asarray(im.getchannel("A"))[int(im.height * 0.8):] > 128
    xs = np.nonzero(a)[1]
    return xs.mean() if len(xs) else im.width / 2


def out_name(a):
    if a["file"]:
        return a["file"]
    short = a["name"].split("_", 1)[1].removeprefix("face_").replace("_", "-")
    return f"{a['kind']}-{short}.webp"


def main():
    cut = {}
    for a in ART:
        rgb = np.asarray(Image.open(os.path.join(RAW, a["name"] + ".png")).convert("RGB"))
        cut[a["name"]] = trim(cutout(rgb, a["name"], a["framed"]))

    scales = {}
    for group in {a["scale"] for a in ART}:
        ims = [cut[a["name"]] for a in ART if a["scale"] == group]
        kind = next(a["kind"] for a in ART if a["scale"] == group)
        w, h, m = (FULL_W, FULL_H, MARGIN) if kind == "full" else (FACE, FACE, 0)
        scales[group] = min((h - 2 * m) / max(i.height for i in ims), (w - 2 * m) / max(i.width for i in ims))

    rows = []
    for idx, a in enumerate(ART, start=1):
        im = cut[a["name"]]
        s = scales[a["scale"]]
        if a["kind"] == "full":
            out = place(im, s, FULL_W, FULL_H, feet_center(im))
        else:
            out = place(im, s, FACE, FACE, im.width / 2)
        folder = os.path.join(PUBLIC, "characters", a["character"])
        os.makedirs(folder, exist_ok=True)
        file = out_name(a)
        out.save(os.path.join(folder, file), "WEBP", quality=88, method=6)
        path = f"/characters/{a['character']}/{file}"
        rows.append(dict(a, id=f"00000000-0000-4000-8000-{idx + 100:012d}", path=path))
        print(f"{path:44s} {','.join(a['tags']):22s} {os.path.getsize(os.path.join(folder, file)) // 1024}KB")
    print("scales", {k: round(v, 3) for k, v in sorted(scales.items())})

    for batch, (file, title, drop_placeholders) in BATCHES.items():
        mine = [r for r in rows if r["batch"] == batch]
        with open(os.path.join(MIGRATIONS, file), "w") as f:
            f.write(f"-- {title} (scripts/art/build_art.py 로 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것)\n")
            f.write("-- 그림 파일은 앱에 들어 있다 (public/characters).")
            f.write(" 임시 혜진 그림 행은 지운다.\n" if drop_placeholders else "\n")
            f.write("-- 여러 번 실행해도 중복으로 들어가지 않는다.\n\n")
            if drop_placeholders:
                f.write("delete from public.character_images where path like '/placeholders/%';\n\n")
            f.write("insert into public.character_images (id, character, kind, tags, path, description) values\n")
            f.write(",\n".join(
                f"  ('{r['id']}', '{r['character']}', '{r['kind']}', '{{{','.join(r['tags'])}}}', '{r['path']}', '{r['desc']}')"
                for r in mine))
            f.write("\non conflict (id) do nothing;\n")

    with open(TS, "w") as f:
        f.write('import type { CharacterImage } from "./types";\n\n')
        f.write("/*\n * 앱에 들어 있는 캐릭터 그림 (public/characters).\n")
        f.write(" * scripts/art/build_art.py 가 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것.\n")
        f.write(" * supabase/migrations 의 " + ", ".join(b[0] for b in BATCHES.values()) + " 시드와 같은 내용이다.\n */\n")
        f.write("export const CHARACTER_ART: CharacterImage[] = [\n")
        for r in rows:
            if r["batch"] is None:
                continue
            tags = ", ".join(f'"{x}"' for x in r["tags"])
            f.write(f'  {{ id: "{r["id"]}", character: "{r["character"]}", kind: "{r["kind"]}", tags: [{tags}], path: "{r["path"]}", description: "{r["desc"]}" }},\n')
        f.write("];\n")


if __name__ == "__main__":
    main()
