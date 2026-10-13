#!/usr/bin/env python3
"""Composite real Givy UI onto phone screens + fix end card for Ad1.mov."""

from __future__ import annotations

import os
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

WORK = Path("/Users/wejdan/Givy/assets/social/ad1_work")
SRC = Path("/Users/wejdan/Desktop/Givy Ads & Media/untitled folder/Ad1.mov")
FRAMES = WORK / "all_frames"
OUT_FRAMES = WORK / "edited_frames"
UI_PATH = WORK / "givy_ui_real.png"
UI_ALT = WORK / "givy_real_ui_screen.jpg"
ENDCARD = WORK / "endcard_correct.png"

# Approximate timing at 30fps (15.03s => ~451 frames)
PHONE_START = int(3.6 * 30)   # close-up phone begins
PHONE_END = int(8.4 * 30)     # phone leaves
END_START = int(13.2 * 30)    # wrong endcard begins


def load_ui() -> np.ndarray:
    path = UI_PATH if UI_PATH.exists() else UI_ALT
    ui = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if ui is None:
        raise SystemExit(f"Missing UI asset: {path}")
    return ui


def find_screen_quad(frame: np.ndarray):
    """Detect bright phone-screen region and return 4 corner points (tl,tr,br,bl)."""
    h, w = frame.shape[:2]
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # bright near-white screen
    mask = cv2.inRange(hsv, (0, 0, 170), (180, 70, 255))
    # focus on center where phone usually is
    focus = np.zeros_like(mask)
    focus[int(h * 0.08) : int(h * 0.92), int(w * 0.15) : int(w * 0.85)] = 255
    mask = cv2.bitwise_and(mask, focus)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8), iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8), iterations=1)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    for cnt in contours[:5]:
        area = cv2.contourArea(cnt)
        if area < (w * h) * 0.08:
            continue
        rect = cv2.minAreaRect(cnt)
        box = cv2.boxPoints(rect)
        box = order_points(box)
        bw = np.linalg.norm(box[1] - box[0])
        bh = np.linalg.norm(box[3] - box[0])
        if bw < 1 or bh < 1:
            continue
        aspect = max(bw, bh) / min(bw, bh)
        # phone screen is tall
        if 1.4 <= aspect <= 2.6 and area > (w * h) * 0.10:
            return box
    return None


def order_points(pts: np.ndarray) -> np.ndarray:
    pts = np.array(pts, dtype=np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).reshape(-1)
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(diff)]
    bl = pts[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def warp_ui_onto(frame: np.ndarray, ui: np.ndarray, quad: np.ndarray) -> np.ndarray:
    uh, uw = ui.shape[:2]
    src = np.array([[0, 0], [uw - 1, 0], [uw - 1, uh - 1], [0, uh - 1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(src, quad)
    warped = cv2.warpPerspective(ui, M, (frame.shape[1], frame.shape[0]))
    # mask from convex fill of quad
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    cv2.fillConvexPoly(mask, np.int32(quad), 255)
    # shrink slightly to keep phone bezel
    kernel = np.ones((7, 7), np.uint8)
    mask = cv2.erode(mask, kernel, iterations=1)
    mask3 = cv2.merge([mask, mask, mask])
    out = np.where(mask3 > 0, warped, frame)
    return out.astype(np.uint8)


def make_endcard_bgr() -> np.ndarray:
    if ENDCARD.exists():
        img = cv2.imread(str(ENDCARD), cv2.IMREAD_COLOR)
        if img is not None:
            return cv2.resize(img, (1080, 1080), interpolation=cv2.INTER_AREA)

    # fallback render
    pil = Image.new("RGB", (1080, 1080), "#FEF6EE")
    d = ImageDraw.Draw(pil)
    mark = Image.open("/Users/wejdan/Givy/public/givy-mark.png").convert("RGBA").resize((260, 260))
    pil.paste(mark, (410, 280), mark)
    try:
        f1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia.ttf", 96)
        f2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia.ttf", 34)
    except Exception:
        f1 = f2 = ImageFont.load_default()
    d.text((540, 600), "Givy", fill="#1A120E", font=f1, anchor="mm")
    d.text((540, 690), "One list. Zero awkward duplicates.", fill="#6B5748", font=f2, anchor="mm")
    d.rounded_rectangle([340, 760, 740, 840], radius=30, fill="#E8391E")
    d.text((540, 800), "givy.gifts", fill="white", font=f2, anchor="mm")
    arr = np.array(pil)[:, :, ::-1].copy()
    return arr


def extract_frames() -> int:
    FRAMES.mkdir(parents=True, exist_ok=True)
    # clear old
    for p in FRAMES.glob("*.jpg"):
        p.unlink()
    cap = cv2.VideoCapture(str(SRC))
    if not cap.isOpened():
        raise SystemExit("Cannot open source video")
    n = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        cv2.imwrite(str(FRAMES / f"f_{n:04d}.jpg"), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        n += 1
    cap.release()
    return n


def process(n_frames: int) -> None:
    OUT_FRAMES.mkdir(parents=True, exist_ok=True)
    for p in OUT_FRAMES.glob("*.jpg"):
        p.unlink()

    ui = load_ui()
    # Prefer the cleaner generated lifestyle UI if present and larger
    if UI_ALT.exists():
        alt = cv2.imread(str(UI_ALT), cv2.IMREAD_COLOR)
        if alt is not None and alt.shape[0] > ui.shape[0]:
            ui = alt

    end = make_endcard_bgr()
    last_quad = None
    phone_hits = 0

    for i in range(n_frames):
        frame = cv2.imread(str(FRAMES / f"f_{i:04d}.jpg"))
        if frame is None:
            continue

        # End card replacement with fade-in
        if i >= END_START:
            t = (i - END_START) / max(1, n_frames - 1 - END_START)
            alpha = min(1.0, max(0.0, t * 1.8))
            # first hold a soft dissolve from last real frame into brand card
            blended = cv2.addWeighted(frame, 1 - alpha, end, alpha, 0)
            # after mostly faded, show pure endcard
            if alpha > 0.85:
                blended = end
            frame = blended
        elif PHONE_START <= i <= PHONE_END:
            quad = find_screen_quad(frame)
            if quad is None and last_quad is not None:
                quad = last_quad
            if quad is not None:
                # mild temporal smoothing
                if last_quad is not None:
                    quad = 0.7 * quad + 0.3 * last_quad
                    quad = quad.astype(np.float32)
                last_quad = quad
                frame = warp_ui_onto(frame, ui, quad)
                phone_hits += 1
        else:
            last_quad = None

        cv2.imwrite(str(OUT_FRAMES / f"f_{i:04d}.jpg"), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        if i % 60 == 0:
            print(f"processed {i}/{n_frames}")

    print(f"phone overlays applied on ~{phone_hits} frames")


def main() -> None:
    print("Extracting frames...")
    n = extract_frames()
    print(f"{n} frames")
    print("Compositing...")
    process(n)
    print("Done compositing")


if __name__ == "__main__":
    main()
