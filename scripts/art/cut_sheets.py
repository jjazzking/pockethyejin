"""원본 시트(흰 배경) → 포즈별 조각. 사용법: cut_sheets.py SRC_DIR OUT_DIR  (SRC_DIR 보통 incoming/)"""
import sys, os, json
import numpy as np, cv2
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

import unicodedata
FILES = {unicodedata.normalize("NFC", f): f for f in os.listdir(src)}
def load(name):
    return np.asarray(Image.open(os.path.join(src, FILES[name])).convert("RGB"))

def ink_mask(a, t=225):
    return a.min(axis=2) < t

def runs(v, thr, mingap=15):
    on = v > thr; res=[]; s=None
    for i,x in enumerate(on):
        if x and s is None: s=i
        if not x and s is not None: res.append([s,i]); s=None
    if s is not None: res.append([s,len(on)])
    m=[]
    for a,b in res:
        if m and a-m[-1][1] < mingap: m[-1][1]=b
        else: m.append([a,b])
    return m

def clean_lines(m):
    """Remove long, thin (<=5px) horizontal guide lines only."""
    H,W = m.shape
    u = m.astype(np.uint8)
    hl = cv2.morphologyEx(u, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT,(W//4,1))) > 0
    up = np.zeros_like(m); up[6:] = m[:-6]
    dn = np.zeros_like(m); dn[:-6] = m[6:]
    thin = hl & ~up & ~dn
    thin = cv2.dilate(thin.astype(np.uint8), np.ones((5,1),np.uint8)) > 0
    out = m.copy(); out[thin & m] = False
    return out

def figure_bbox(m, keep_frac=0.002, dil=15):
    d = cv2.dilate(m.astype(np.uint8), np.ones((dil,dil),np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(d, 8)
    if n<=1: return None
    areas = [(st[i,cv2.CC_STAT_AREA], i) for i in range(1,n)]
    big, bi = max(areas)
    W = m.shape[1]
    xs=[];ys=[]; keep=np.zeros(m.shape,bool)
    for a,i in areas:
        x,y,w,h = st[i,:4]
        if a < big*keep_frac: continue
        if i != bi and (x <= 2 or x+w >= W-2 or y <= 2 or y+h >= m.shape[0]-2): continue
        xs += [x, x+w]; ys += [y, y+h]; keep |= (lab==i)
    pad = dil//2
    return [min(xs)+pad, min(ys)+pad, max(xs)-pad, max(ys)-pad], keep

def frames(a):
    """Find rectangular frame interiors (box sheets)."""
    dark = a.max(axis=2) < 110
    H,W = dark.shape
    hl = cv2.morphologyEx(dark.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT,(400,1)))
    vl = cv2.morphologyEx(dark.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT,(1,300)))
    grid = cv2.bitwise_or(hl, vl)
    inv = (grid==0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    boxes=[]
    for i in range(1,n):
        x,y,w,h,ar = st[i]
        if w>300 and h>300 and x>0 and y>0 and x+w<W and y+h<H:
            boxes.append([int(x)+6,int(y)+6,int(x+w)-6,int(y+h)-6])
    boxes.sort(key=lambda b:(b[1]//200, b[0]))
    return boxes


def grid(cols, rows):
    return [[c0,r0,c1,r1] for r0,r1 in rows for c0,c1 in cols]
Q = grid([(0,.5),(.5,1)],[(0,.5),(.5,1)])
TURN = grid([(.035,.31),(.31,.66),(.66,1)],[(0,1)])
JWF = grid([(0,.34),(.34,.67),(.67,1)],[(0,.462),(.514,.945)])
# name -> (mode, ids, fractional cells for free mode)
SHEETS = {
  "기본_전신샷.png":      ("free", ["hj_turn_front","hj_turn_side","hj_turn_back"], TURN),
  "액션 4개.png":        ("free", ["hj_bump_cry","hj_cards","hj_awkward","hj_dance"], grid([(0,.29),(.29,.49),(.49,.735),(.735,1)],[(0,1)])),
  "액션 4개_2탄.png":     ("free", ["hj_sunglasses","hj_taco","hj_hands_hips","hj_bucket"], grid([(0,.27),(.27,.51),(.51,.705),(.705,1)],[(0,1)])),
  "액션 6개_2탄.png":     ("box",  ["hj_mochi","hj_buldak","hj_sleepy","hj_working","hj_full_belly","hj_kiss"], None),
  "액션 6개_3탄.png":     ("box",  ["hj_accuse","hj_kazoo","hj_singing","hj_arms_up","hj_balloon","hj_skating"], None),
  "표정 6개.png":        ("box",  ["hj_face_default","hj_face_very_happy","hj_face_playful","hj_face_sulking","hj_face_angry","hj_face_suspicious"], None),
  "표정 6개_2탄.png":     ("box",  ["hj_face_surprise","hj_face_clueless","hj_face_puppy","hj_face_pleading","hj_face_wink","hj_face_shy"], None),
  "정우_듀가나디.png":     ("free", ["jw_hj_cheek"], [[0,0,1,1]]),
  "정우_액션 4개_1탄.png": ("free", ["jw_music","jw_laptop","jw_dj","jw_gaming"], Q),
  "정우_액션 4개_2탄.png": ("free", ["jw_shopping","jw_arms_crossed","jw_running","jw_poker"], Q),
  "정우_전신 샷.png":     ("free", ["jw_turn_front","jw_turn_side","jw_turn_back"], TURN),
  "정우_표정 6개.png":     ("free", ["jw_face_default","jw_face_happy","jw_face_mock_angry","jw_face_sulking","jw_face_flustered","jw_face_adoring"], JWF),
}

manifest={}
for name,(mode,ids,fr) in SHEETS.items():
    a = load(name); H,W,_ = a.shape
    a = a.copy()
    if mode=="box":
        crops = frames(a)
    else:
        raw = ink_mask(a)
        m = clean_lines(raw)
        if "전신" in name:
            a = a.copy()
            a[raw & ~m] = 255
            a[:int(.08*H), :int(.2*W)] = 255
            a[:, :int(.035*W)] = 255
            m[:int(.08*H), :int(.2*W)] = False
        crops=[]
        for f0,g0,f1,g1 in fr:
            x0,y0,x1,y1 = int(f0*W),int(g0*H),int(f1*W),int(g1*H)
            sub = m[y0:y1,x0:x1].copy()
            bb, keep = figure_bbox(sub)
            # neighbour fragments inside the cell -> paint white
            region = a[y0:y1,x0:x1]
            drop = cv2.dilate((sub & ~keep).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0  # 흐린 가장자리까지
            region[drop & ~keep] = 255
            P=12  # pad, but never past the cell (keeps neighbours out)
            crops.append([max(x0,x0+bb[0]-P), max(y0,y0+bb[1]-P), min(x1,x0+bb[2]+P), min(y1,y0+bb[3]+P)])
    print(name, mode, len(crops), "expected", len(ids))
    for cid,(x0,y0,x1,y1) in zip(ids,crops):
        Image.fromarray(a[y0:y1,x0:x1]).save(os.path.join(out,cid+".png"))
        manifest[cid]={"src":name,"box":[int(x0),int(y0),int(x1),int(y1)],"mode":mode}
json.dump(manifest, open(os.path.join(out,"manifest.json"),"w"), ensure_ascii=False, indent=1)
