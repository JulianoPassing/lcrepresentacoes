#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"
FILES = [
    "pantaneiro5.html",
    "pantaneiro7.html",
    "b2b-pantaneiro5.html",
    "b2b-pantaneiro7.html",
]

NEW_HELPER = """
      const TAMANHOS_BOTAS_PARES = ["35/36", "37/38", "39/40", "41/42", "43/44", "45/46"];
      function produtoTemBotas(produto) {
        if (!produto) return false;
        const tamanhos = Array.isArray(produto.TAMANHOS) ? produto.TAMANHOS : [produto.TAMANHOS];
        if (tamanhos.some((t) => /^\\d+\\/\\d+$/.test(String(t || "").trim()))) return true;
        return tamanhos.join(" ").toUpperCase().includes("BOTAS");
      }
      function getTamanhosBotas(produto) {
        const tamanhos = Array.isArray(produto.TAMANHOS) ? produto.TAMANHOS : [produto.TAMANHOS];
        const pares = tamanhos.filter((t) => /^\\d+\\/\\d+$/.test(String(t || "").trim()));
        return pares.length ? pares : TAMANHOS_BOTAS_PARES;
      }
"""

HELPER_PATTERN = re.compile(
    r"\s*const TAMANHOS_BOTAS_PARES = \[.*?\n\s*function getTamanhosBotas\(produto\) \{.*?\n\s*\}\n",
    re.DOTALL,
)

# Remove unreachable else-if 203/204 blocks (several variants)
BLOCKS_TO_REMOVE = [
    re.compile(
        r'\s*\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'getTamanhosBotas\(produto\)\.forEach\(\(tamanho\) => \{.*?\}\);\s*',
        re.DOTALL,
    ),
    re.compile(
        r'\s*\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'// Outras referências com tamanho manual\s*'
        r'tamanhosHTML = `<input type="text"[^`]*`;\s*',
        re.DOTALL,
    ),
    re.compile(
        r'\s*\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'const tamanhosBotas = getTamanhosBotas\(produto\);\s*'
        r'tamanhosBotas\.forEach\(\(tamanho\) => \{.*?\}\);\s*',
        re.DOTALL,
    ),
]


def patch(path: Path) -> None:
    content = path.read_text(encoding="utf-8")
    m = HELPER_PATTERN.search(content)
    if m:
        content = content[: m.start()] + NEW_HELPER + content[m.end() :]

    for pattern in BLOCKS_TO_REMOVE:
        content = pattern.sub("", content)

    # normal products must keep plain tamanho label
    content = content.replace(
        "handleItem(produtoTemBotas(produto) ? `Bota ${tamanho}` : tamanho, quantidade);",
        "handleItem(tamanho, quantidade);",
    )

    # b2b mobile card label
    content = content.replace(
        'tamanhosHTML += `<div><label for="quantidade-${produto.REFERENCIA}-${tamanho}">${tamanho}</label>',
        'tamanhosHTML += `<div><label for="quantidade-${produto.REFERENCIA}-${tamanho.replace(/[^a-zA-Z0-9]/g, "")}">Bota ${tamanho}</label>',
    )

    path.write_text(content, encoding="utf-8")
    print(f"Limpo: {path.name}")


def main():
    for name in FILES:
        patch(ROOT / name)


if __name__ == "__main__":
    main()
