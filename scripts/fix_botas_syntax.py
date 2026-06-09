#!/usr/bin/env python3
"""Corrige sintaxe quebrada e labels de botas nos HTMLs Pantaneiro."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"
FILES = [
    "pantaneiro5.html",
    "pantaneiro7.html",
    "b2b-pantaneiro5.html",
    "b2b-pantaneiro7.html",
]


def fix_content(c: str) -> str:
    c = c.replace("});} else {", "});\n        } else {")
    c = c.replace("</div>';} else {", "</div>';\n        } else {")
    c = c.replace("tamanhosHTML += '</div>';} else {", "tamanhosHTML += '</div>';\n        } else {")

    # handleItem nas botas (produtoTemBotas) usa label "Bota 35/36"
    c = re.sub(
        r"(getTamanhosBotas\(produto\)\.forEach\(\(tamanho\) => \{.*?)handleItem\(tamanho, quantidade\);",
        r"\1handleItem(`Bota ${tamanho}`, quantidade);",
        c,
        flags=re.DOTALL,
    )
    return c


def main():
    for name in FILES:
        p = ROOT / name
        original = p.read_text(encoding="utf-8")
        fixed = fix_content(original)
        if fixed != original:
            p.write_text(fixed, encoding="utf-8")
            print(f"fixed: {name}")
        else:
            print(f"ok: {name}")


if __name__ == "__main__":
    main()
