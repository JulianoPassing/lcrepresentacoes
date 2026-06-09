#!/usr/bin/env python3
"""Ajusta lógica de botas: pares 35/36 só em produtos com BOTAS integradas (201/203/204)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"
FILES = [
    "pantaneiro5.html",
    "pantaneiro7.html",
    "b2b-pantaneiro5.html",
    "b2b-pantaneiro7.html",
]

OLD_PRODUTO_TEM_BOTAS = """      function produtoTemBotas(produto) {
        if (!produto) return false;
        const tamanhos = Array.isArray(produto.TAMANHOS) ? produto.TAMANHOS : [produto.TAMANHOS];
        if (tamanhos.some((t) => /^\\d+\\/\\d+$/.test(String(t || "").trim()))) return true;
        return tamanhos.join(" ").toUpperCase().includes("BOTAS");
      }"""

NEW_PRODUTO_TEM_BOTAS = """      function produtoTemBotas(produto) {
        if (!produto) return false;
        const tamanhos = Array.isArray(produto.TAMANHOS) ? produto.TAMANHOS : [produto.TAMANHOS];
        return tamanhos.join(" ").toUpperCase().includes("BOTAS");
      }"""


def fix_handle_item_boot_blocks(c: str) -> str:
    """Dentro de blocos produtoTemBotas, usa label Bota 35/36 no pedido."""
    parts = c.split("if (produtoTemBotas(produto)) {")
    if len(parts) == 1:
        return c
    out = [parts[0]]
    for block in parts[1:]:
        end = block.find("} else {")
        if end == -1:
            out.append("if (produtoTemBotas(produto)) {" + block)
            continue
        boot_part = block[:end]
        rest = block[end:]
        boot_part = boot_part.replace(
            "handleItem(tamanho, quantidade);",
            "handleItem(`Bota ${tamanho}`, quantidade);",
        )
        out.append("if (produtoTemBotas(produto)) {" + boot_part + rest)
    return "".join(out)


def fix_indent_else(c: str) -> str:
    return c.replace(
        "                });\n        } else {",
        "                });\n              } else {",
    )


def main():
    for name in FILES:
        p = ROOT / name
        c = p.read_text(encoding="utf-8")
        original = c
        c = c.replace(OLD_PRODUTO_TEM_BOTAS, NEW_PRODUTO_TEM_BOTAS)
        c = fix_handle_item_boot_blocks(c)
        c = fix_indent_else(c)
        if c != original:
            p.write_text(c, encoding="utf-8")
            print(f"updated: {name}")
        else:
            print(f"unchanged: {name}")


if __name__ == "__main__":
    main()
