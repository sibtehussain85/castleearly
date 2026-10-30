"""Make 1200x630 share images for the new pages, matching the existing CastleEarly style.
Uses an existing share image as the base (background, logo, URL), wipes the text and board,
then draws the new eyebrow, title and board position. Input: og-jobs.json from og-jobs.js."""
import json, sys
from PIL import Image, ImageDraw, ImageFont

SITE = '/home/claude/castleearly'
BASE = SITE + '/assets/og/openings-petrov-defense.jpg'
SPR = '/home/claude/gen/sprites/'
LIGHT, DARK = (239, 236, 219), (94, 141, 109)
HL_LIGHT, HL_DARK = (238, 214, 144), (170, 168, 93)
BX, BY, SQ = 680, 87, 57
EYEBROW = (226, 176, 98)
F_TITLE = ImageFont.truetype('/mnt/skills/examples/canvas-design/canvas-fonts/Lora-Bold.ttf', 50)
F_EYE = ImageFont.truetype('/mnt/skills/examples/canvas-design/canvas-fonts/InstrumentSans-Bold.ttf', 23)

sprites = {}
def sprite(code):
    if code not in sprites:
        sprites[code] = Image.open(SPR + code + '.png').resize((SQ - 4, SQ - 4), Image.LANCZOS)
    return sprites[code]

def wipe_text(im):
    """Repaint the eyebrow/title area by blending the clean pixels on all four edges
    (a Coons patch), so the background gradient continues with no visible seams."""
    import numpy as np
    arr = np.asarray(im).astype(float)
    x0, x1, y0, y1 = 30, 655, 199, 451
    top = arr[y0, x0:x1 + 1]
    # The bottom edge can touch old descenders, so use a straight blend of its clean end points.
    tt = (np.arange(x1 - x0 + 1) / (x1 - x0))[:, None]
    bot = arr[y1, x0] * (1 - tt) + arr[y1, x1] * tt
    arr[y1, x0:x1 + 1] = bot
    left, right = arr[y0:y1 + 1, x0], arr[y0:y1 + 1, x1]
    H, W = y1 - y0, x1 - x0
    v = (np.arange(H + 1) / H)[:, None, None]
    u = (np.arange(W + 1) / W)[None, :, None]
    patch = ((1 - v) * top[None] + v * bot[None] + (1 - u) * left[:, None] + u * right[:, None]
             - ((1 - u) * (1 - v) * arr[y0, x0] + u * (1 - v) * arr[y0, x1] + (1 - u) * v * arr[y1, x0] + u * v * arr[y1, x1]))
    arr[y0:y1 + 1, x0:x1 + 1] = patch
    im.paste(Image.fromarray(np.clip(arr, 0, 255).astype('uint8')))

def draw_board(im, fen, hl, flip):
    d = ImageDraw.Draw(im)
    rows = fen.split(' ')[0].split('/')
    board = {}
    for r, row in enumerate(rows):  # r=0 is rank 8
        f = 0
        for ch in row:
            if ch.isdigit(): f += int(ch)
            else:
                board[(f, 7 - r)] = ('w' if ch.isupper() else 'b') + ch.upper(); f += 1
    for f in range(8):
        for rank in range(8):
            light = (f + rank) % 2 == 1
            name = 'abcdefgh'[f] + str(rank + 1)
            col = (HL_LIGHT if light else HL_DARK) if name in hl else (LIGHT if light else DARK)
            vx, vy = (7 - f, rank) if flip else (f, 7 - rank)
            x, y = BX + vx * SQ, BY + vy * SQ
            d.rectangle([x, y, x + SQ - 1, y + SQ - 1], fill=col)
            if (f, rank) in board:
                s = sprite(board[(f, rank)]); im.paste(s, (x + 2, y + 2), s)

def make(job):
    im = Image.open(BASE).convert('RGB')
    wipe_text(im)
    draw_board(im, job['fen'], job['hl'], job['flip'])
    d = ImageDraw.Draw(im)
    d.text((64, 214), job['eyebrow'].upper(), font=F_EYE, fill=EYEBROW)
    lines = job['lines']
    y = 262 if len(lines) == 2 else 248
    for ln in lines:
        d.text((62, y), ln, font=F_TITLE, fill=(255, 255, 253)); y += 60
    im.save(f"{SITE}/assets/og/{job.get('out', 'openings-' + job['slug'])}.jpg", quality=88, optimize=True, progressive=True)
    print('wrote', job['slug'])

for job in json.load(open(sys.argv[1])):
    make(job)
