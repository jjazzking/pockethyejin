"""
잘라낸 그림(cut_sheets.py 결과) → 게임용 투명 그림 + 시드 SQL + 체험 모드 목록.

  python3 scripts/art/cut_sheets.py incoming /tmp/art-raw
  python3 scripts/art/build_art.py /tmp/art-raw

- 흰 배경을 투명하게 지운다. 팔과 몸 사이처럼 막힌 빈틈은 GAPS에 적은 위치만 지운다
  (눈 흰자·이빨·반사광은 색으로 구분이 안 돼서 자동으로 지우지 않는다).
- 전신은 1024x1536 캔버스에 같은 배율로 넣고 발끝을 바닥선에 맞춘다.
- 얼굴(팝업)은 1024x1024 캔버스에 같은 배율로 넣고 아래쪽에 붙인다.
- public/characters/ 에 WebP로 저장하고, 시드 SQL과 src/content/characterArt.ts 를 만든다.
"""
import os, sys
import numpy as np, cv2
from PIL import Image

RAW = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "public", "characters", "hyejin")
SQL = os.path.join(ROOT, "supabase", "migrations", "20261013000300_seed_hyejin_art.sql")
TS = os.path.join(ROOT, "src", "content", "characterArt.ts")

# (잘라낸 이름, 종류, 태그, 설명). 순서가 곧 id 번호다 — 기존 항목 사이에 끼워 넣지 말고 끝에 붙일 것.
ART = [
    ("hj_turn_front",      "full", ["normal"],          "정면 기본 자세"),
    ("hj_cards",           "full", ["normal"],          "카드 들고 음흉한 웃음"),
    ("hj_dance",           "full", ["normal"],          "신나는 춤"),
    ("hj_sunglasses",      "full", ["normal"],          "선글라스"),
    ("hj_taco",            "full", ["normal"],          "타코 냠냠"),
    ("hj_hands_hips",      "full", ["normal"],          "허리에 손"),
    ("hj_bucket",          "full", ["normal"],          "양동이 쓰고 갸우뚱"),
    ("hj_awkward",         "full", ["sad"],             "머쓱한 웃음 (땀방울)"),
    ("hj_bump_cry",        "full", ["sad", "danger"],   "혹 나서 울먹"),
    ("hj_face_default",    "face", ["default"],         "기본 얼굴"),
    ("hj_mochi",           "face", ["eat_mochi"],       "찹쌀떡 받고 신남"),
    ("hj_full_belly",      "face", ["eat_half"],        "배 두드리며 배부름"),
    ("hj_face_pleading",   "face", ["buldak_craving"],  "애원하는 눈빛"),
    ("hj_buldak",          "face", ["buldak_eat"],      "불닭 먹기"),
    ("hj_face_very_happy", "face", ["level_up"],        "아주 행복"),
    ("hj_balloon",         "face", ["level_up"],        "보라 풍선"),
    ("hj_face_sulking",    "face", ["warning"],         "볼 빵빵 삐짐"),
    ("hj_face_suspicious", "face", ["warning"],         "의심의 눈초리"),
    ("hj_face_angry",      "face", ["countdown"],       "화남"),
    ("hj_arms_up",         "face", ["countdown"],       "벌서기"),
    ("hj_accuse",          "face", ["jeongwoo_block"],  "손가락질"),
    ("hj_kazoo",           "face", ["play_together"],   "카주 불기"),
    ("hj_singing",         "face", ["play_together"],   "노래하기"),
    ("hj_face_puppy",      "face", ["play_together"],   "강아지 껴안기"),
    ("hj_face_clueless",   "face", ["date_1star"],      "멍한 얼굴"),
    ("hj_face_wink",       "face", ["date_2star"],      "윙크 브이"),
    ("hj_face_playful",    "face", ["date_2star"],      "장난스러운 얼굴"),
    ("hj_kiss",            "face", ["date_3star"],      "뽀뽀 직전"),
    ("hj_face_shy",        "face", ["date_3star"],      "수줍은 홍조"),
    ("hj_face_surprise",   "face", ["new_place"],       "깜짝 놀람"),
    ("hj_skating",         "face", ["new_place"],       "스케이트"),
    ("hj_sleepy",          "face", ["away_summary"],    "졸려서 눈 비비기"),
    ("hj_working",         "face", ["away_summary"],    "노트북으로 공부 중"),
]

# 막힌 빈틈(배경) 위치. 잘라낸 그림 안의 비율 좌표 (x, y)
GAPS = {
    "hj_hands_hips": [(0.214, 0.600), (0.762, 0.600)],
    "hj_sunglasses": [(0.247, 0.429)],
    "hj_accuse":     [(0.364, 0.623), (0.409, 0.637)],
    "hj_balloon":    [(0.742, 0.670)],
    "hj_skating":    [(0.730, 0.802), (0.592, 0.818)],
    "hj_sleepy":     [(0.668, 0.660)],
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


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    framed = {}
    cut = {}
    for name, kind, _, _ in ART:
        rgb = np.asarray(Image.open(os.path.join(RAW, name + ".png")).convert("RGB"))
        is_framed = kind == "face"
        im = cutout(rgb, name, is_framed)
        cut[name] = im if is_framed else trim(im)
        framed[name] = is_framed

    fulls = [cut[n] for n, k, _, _ in ART if k == "full"]
    s_full = min((FULL_H - 2 * MARGIN) / max(i.height for i in fulls), (FULL_W - 2 * MARGIN) / max(i.width for i in fulls))
    faces = [cut[n] for n, k, _, _ in ART if k == "face"]
    s_face = min(FACE / max(i.width for i in faces), FACE / max(i.height for i in faces))

    rows = []
    for idx, (name, kind, tags, desc) in enumerate(ART, start=1):
        im = cut[name]
        if kind == "full":
            out = place(im, s_full, FULL_W, FULL_H, feet_center(im))
        else:
            out = place(trim(im), s_face, FACE, FACE, trim(im).width / 2)
        file = f"{kind}-{name.removeprefix('hj_').removeprefix('face_').replace('_', '-')}.webp"
        out.save(os.path.join(OUT_DIR, file), "WEBP", quality=88, method=6)
        rows.append((f"00000000-0000-4000-8000-{idx + 100:012d}", kind, tags, f"/characters/hyejin/{file}", desc))
        print(f"{file:34s} {kind:4s} {','.join(tags):22s} {os.path.getsize(os.path.join(OUT_DIR, file)) // 1024}KB")
    print(f"scale full={s_full:.3f} face={s_face:.3f}")

    with open(SQL, "w") as f:
        f.write("-- 혜진 그림 시드 (scripts/art/build_art.py 로 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것)\n")
        f.write("-- 그림 파일은 앱에 들어 있다 (public/characters/hyejin). 임시 혜진 그림 행은 지운다.\n")
        f.write("-- 여러 번 실행해도 중복으로 들어가지 않는다.\n\n")
        f.write("delete from public.character_images where path like '/placeholders/%';\n\n")
        f.write("insert into public.character_images (id, character, kind, tags, path, description) values\n")
        f.write(",\n".join(
            f"  ('{i}', 'hyejin', '{k}', '{{{','.join(t)}}}', '{p}', '{d}')" for i, k, t, p, d in rows))
        f.write("\non conflict (id) do nothing;\n")

    with open(TS, "w") as f:
        f.write('import type { CharacterImage } from "./types";\n\n')
        f.write("/*\n * 앱에 들어 있는 혜진 그림 (public/characters/hyejin).\n")
        f.write(" * scripts/art/build_art.py 가 만든 파일 — 직접 고치지 말고 스크립트를 고칠 것.\n")
        f.write(" * supabase/migrations/20261013000300_seed_hyejin_art.sql 의 시드와 같은 내용이다.\n */\n")
        f.write("export const HYEJIN_ART: CharacterImage[] = [\n")
        for i, k, t, p, d in rows:
            tags = ", ".join(f'"{x}"' for x in t)
            f.write(f'  {{ id: "{i}", character: "hyejin", kind: "{k}", tags: [{tags}], path: "{p}", description: "{d}" }},\n')
        f.write("];\n")


if __name__ == "__main__":
    main()
