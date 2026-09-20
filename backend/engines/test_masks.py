# backend/engines/test_masks.py
from pathlib import Path
from ai_detection import run_detection

for img_name in ["image1.jpg", "image2.png"]:
    p = Path(img_name)
    if not p.exists():
        p = Path("../") / img_name
    if p.exists():
        with open(p, "rb") as f:
            mask_bytes = run_detection(f.read())
        out_name = f"verified_mask_{p.stem}.png"
        with open(out_name, "wb") as f:
            f.write(mask_bytes)
        print(f"Generated: {out_name}")
    else:
        print(f"Not found: {img_name}")