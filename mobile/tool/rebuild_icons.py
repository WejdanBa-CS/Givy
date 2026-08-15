from PIL import Image

src = Image.open(r"mobile/assets/icon/givy-mark-source.png").convert("RGBA")
user = (
    r"C:\Users\Admin\.cursor\projects\c-Users-Admin-Desktop-Givy\assets\\"
    r"c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"99d15ddf88f4d80a485a65252fb5b2c8_images_givy-mark-bc971bf5-1a52-4a71-b79d-26af5942fc1f.png"
)
try:
    src = Image.open(user).convert("RGBA")
except OSError:
    pass


def fit_on(canvas_size: int, bg: tuple[int, int, int, int], scale: float = 0.72) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), bg)
    bbox = src.getbbox()
    gift = src.crop(bbox) if bbox else src
    target = int(canvas_size * scale)
    gw, gh = gift.size
    ratio = min(target / gw, target / gh)
    nw, nh = max(1, int(gw * ratio)), max(1, int(gh * ratio))
    gift = gift.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (canvas_size - nw) // 2
    y = (canvas_size - nh) // 2
    canvas.alpha_composite(gift, (x, y))
    return canvas


icon = fit_on(1024, (255, 255, 255, 255), scale=0.78)
icon.convert("RGB").save(r"mobile/assets/icon/app_icon.png", "PNG")

fg = fit_on(1024, (0, 0, 0, 0), scale=0.66)
fg.save(r"mobile/assets/icon/app_icon_foreground.png", "PNG")

play = fit_on(512, (255, 255, 255, 255), scale=0.78)
play.convert("RGB").save(r"mobile/docs/play-store/app-icon-512.png", "PNG")

web = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
bbox = src.getbbox()
gift = src.crop(bbox) if bbox else src
target = int(256 * 0.85)
gw, gh = gift.size
ratio = min(target / gw, target / gh)
nw, nh = max(1, int(gw * ratio)), max(1, int(gh * ratio))
gift = gift.resize((nw, nh), Image.Resampling.LANCZOS)
web.alpha_composite(gift, ((256 - nw) // 2, (256 - nh) // 2))
web.save(r"public/givy-mark.png", "PNG")
web.save(r"mobile/assets/icon/givy-mark-source.png", "PNG")

print("ok", icon.getpixel((0, 0)))
