"""Generate skeuomorphic 字 seal icon — clean mask-based approach."""

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = "/Users/ninonino/Documents/GitHub/Open-Zi/frontend/src-tauri/icons"
FONT_PATH = "/Users/ninonino/Documents/GitHub/Open-Zi/frontend/src-tauri/MaShanZheng.ttf"

SIZE = 1024
CORAL = (196, 30, 58)
DARK = (120, 16, 32)
HIGHLIGHT = (235, 100, 115)
WHITE = (255, 255, 255)
SHADOW_COLOR = (0, 0, 0, 120)

MARGIN = 80
RADIUS = 140
DEPTH = 24
SHADOW_OFFSET = 28


# --- Rounded rect mask ---
def rounded_rect_mask(w, h, x0, y0, x1, y1, r):
    """Create an alpha mask for a rounded rectangle."""
    mask = Image.new("L", (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=255)
    return mask


seal_mask = rounded_rect_mask(
    SIZE, SIZE, MARGIN, MARGIN, SIZE - MARGIN, SIZE - MARGIN, RADIUS
)

# --- Drop shadow ---
shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow)
sdraw.rounded_rectangle(
    [
        MARGIN + SHADOW_OFFSET,
        MARGIN + SHADOW_OFFSET,
        SIZE - MARGIN + SHADOW_OFFSET,
        SIZE - MARGIN + SHADOW_OFFSET,
    ],
    radius=RADIUS,
    fill=SHADOW_COLOR,
)
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=18))

# --- Build the icon ---
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

# Paste shadow
img.paste(shadow, (0, 0), shadow)

# --- 3D depth layers (bottom extrusion) ---
for i in range(DEPTH, 0, -1):
    alpha = int(200 + (i / DEPTH) * 55)
    shade = (
        int(DARK[0] + (30 - DARK[0]) * (1 - i / DEPTH)),
        int(DARK[1] + (8 - DARK[1]) * (1 - i / DEPTH)),
        int(DARK[2] + (15 - DARK[2]) * (1 - i / DEPTH)),
    )
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    ldraw.rounded_rectangle(
        [MARGIN, MARGIN + i, SIZE - MARGIN, SIZE - MARGIN + i],
        radius=RADIUS,
        fill=(*shade, alpha),
    )
    img.paste(layer, (0, 0), layer)

# --- Main face with subtle vertical gradient ---
grad = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
for y in range(SIZE):
    t = max(0, min(1, (y - MARGIN) / (SIZE - 2 * MARGIN)))
    r = int(CORAL[0] + (DARK[0] - CORAL[0]) * t * 0.5)
    g = int(CORAL[1] + (DARK[1] - CORAL[1]) * t * 0.5)
    b = int(CORAL[2] + (DARK[2] - CORAL[2]) * t * 0.5)
    for x in range(SIZE):
        if seal_mask.getpixel((x, y)) > 0:
            grad.putpixel((x, y), (r, g, b, 255))

img.paste(grad, (0, 0), grad)

# --- Inner highlight (top + left edge glow) ---
hl = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
hdraw = ImageDraw.Draw(hl)
hdraw.rounded_rectangle(
    [MARGIN + 6, MARGIN + 6, SIZE - MARGIN - 6, SIZE - MARGIN - 6],
    radius=RADIUS - 3,
    outline=HIGHLIGHT,
    width=8,
)
# Mask to only keep top-left quadrant
hl_mask = Image.new("L", (SIZE, SIZE), 0)
for x in range(SIZE):
    for y in range(SIZE):
        if hl.getpixel((x, y))[3] > 0:
            cx, cy = SIZE // 2, SIZE // 2
            # Keep pixels on the top-left side of the diagonal
            if (x - cx) + (y - cy) < 50:
                hl_mask.putpixel((x, y), 180)
hl.putalpha(hl_mask)
img.paste(hl, (0, 0), hl)

# --- Subtle specular shine (top-left corner) ---
shine = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
sdraw2 = ImageDraw.Draw(shine)
sdraw2.rounded_rectangle(
    [MARGIN + 20, MARGIN + 20, SIZE // 2 + 80, SIZE // 2 + 80],
    radius=RADIUS - 10,
    fill=(255, 255, 255, 30),
)
shine = shine.filter(ImageFilter.GaussianBlur(radius=30))
img.paste(shine, (0, 0), shine)

# --- Draw 字 ---
font_size = 580
font = ImageFont.truetype(FONT_PATH, font_size)

# Text shadow
text_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
tdraw = ImageDraw.Draw(text_layer)
bbox = tdraw.textbbox((0, 0), "字", font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
tx = (SIZE - tw) // 2 - bbox[0]
ty = (SIZE - th) // 2 - bbox[1] - 12

tdraw.text((tx + 4, ty + 6), "字", font=font, fill=(0, 0, 0, 70))
tdraw.text((tx, ty), "字", font=font, fill=WHITE)
img.paste(text_layer, (0, 0), text_layer)

# --- Export all sizes ---
sizes = {
    "32x32.png": 32,
    "128x128.png": 128,
    "128x128@2x.png": 256,
    "icon.png": 512,
    "Square30x30Logo.png": 30,
    "Square44x44Logo.png": 44,
    "Square71x71Logo.png": 71,
    "Square89x89Logo.png": 89,
    "Square107x107Logo.png": 107,
    "Square142x142Logo.png": 142,
    "Square150x150Logo.png": 150,
    "Square284x284Logo.png": 284,
    "Square310x310Logo.png": 310,
    "StoreLogo.png": 50,
}

for name, sz in sizes.items():
    path = os.path.join(OUT, name)
    resized = img.resize((sz, sz), Image.LANCZOS)
    resized.save(path, "PNG")

# --- ICO (Windows) ---
ico_sizes = [16, 24, 32, 48, 64, 128, 256]
ico_imgs = [img.resize((s, s), Image.LANCZOS) for s in ico_sizes]
ico_imgs[0].save(
    os.path.join(OUT, "icon.ico"),
    format="ICO",
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_imgs[1:],
)

# --- ICNS (macOS) ---
import shutil

shutil.copy(os.path.join(OUT, "icon.png"), os.path.join(OUT, "icon.icns"))

print("All icons generated.")
