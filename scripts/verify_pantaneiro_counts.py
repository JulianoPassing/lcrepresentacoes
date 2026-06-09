import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"
files = [
    "pantaneiro5.html",
    "pantaneiro7.html",
    "b2b-pantaneiro5.html",
    "b2b-pantaneiro7.html",
]

for name in files:
    txt = (ROOT / name).read_text(encoding="utf-8")
    m = re.search(r"window\.produtosData = \[(.*?)\];", txt, re.S)
    block = m.group(1) if m else ""
    refs = re.findall(r'REFERENCIA: "([^"]+)"', block)
    print(f"{name}: {len(refs)} produtos")
