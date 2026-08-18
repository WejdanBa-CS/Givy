from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
pub = root / "mobile" / "pubspec.yaml"
t = pub.read_text(encoding="utf-8")
t = re.sub(
    r'adaptive_icon_background:\s*"#[^"]+"',
    'adaptive_icon_background: "#FFFFFF"',
    t,
)
t = t.replace("version: 1.3.3+6", "version: 1.3.4+7")
pub.write_text(t, encoding="utf-8")
print("pubspec updated")
for line in pub.read_text(encoding="utf-8").splitlines():
    if "version:" in line or "adaptive" in line or "image_path" in line:
        print(line)
