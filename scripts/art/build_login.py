"""
로그인(타이틀) 화면 그림 → public/login/{mobile,desktop}.webp

  python3 scripts/art/build_login.py incoming

- 핸드폰(세로): incoming/기본화면_핸드폰.png → mobile.webp (가로 1170px)
- 컴퓨터(가로): incoming/기본화면_컴퓨터.png 가 있으면 → desktop.webp (가로 1920px).
  없으면 핸드폰 그림을 가운데 두고 흐리게 늘린 배경을 깐 임시 그림을 만든다.
컴퓨터용 그림이 생기면 incoming에 올리고 이 스크립트를 다시 돌리거나, public/login/desktop.webp 파일만 바꾸면 된다.
"""
import os, sys, unicodedata
from PIL import Image, ImageFilter

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "login")
FILES = {unicodedata.normalize("NFC", f): os.path.join(SRC, f) for f in os.listdir(SRC)}


def fit_width(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    mobile = Image.open(FILES["기본화면_핸드폰.png"]).convert("RGB")
    fit_width(mobile, 1170).save(os.path.join(OUT, "mobile.webp"), "WEBP", quality=86, method=6)

    if "기본화면_컴퓨터.png" in FILES:
        desktop = fit_width(Image.open(FILES["기본화면_컴퓨터.png"]).convert("RGB"), 1920)
        print("desktop: 컴퓨터용 그림 사용")
    else:
        # 임시: 1920x1080 위에 핸드폰 그림을 흐리게 깔고, 가운데에 원본 비율 그대로
        W, H = 1920, 1080
        back = mobile.resize((W, round(mobile.height * W / mobile.width)), Image.LANCZOS)
        top = (back.height - H) // 3
        desktop = back.crop((0, top, W, top + H)).filter(ImageFilter.GaussianBlur(28))
        desktop = Image.blend(desktop, Image.new("RGB", (W, H), (255, 248, 242)), 0.25)
        front = mobile.resize((round(mobile.width * H / mobile.height), H), Image.LANCZOS)
        desktop.paste(front, ((W - front.width) // 2, 0))
        print("desktop: 임시 그림 (핸드폰 그림 + 흐린 배경)")
    desktop.save(os.path.join(OUT, "desktop.webp"), "WEBP", quality=86, method=6)
    for f in ("mobile.webp", "desktop.webp"):
        im = Image.open(os.path.join(OUT, f))
        print(f, im.size, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB")


if __name__ == "__main__":
    main()
