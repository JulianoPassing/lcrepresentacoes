#!/usr/bin/env python3
"""Integra g8-resumo-unidades-pdf.js nos HTMLs com geração de PDF."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"

SCRIPT_TAG = '    <script src="g8-resumo-unidades-pdf.js"></script>\n'

FILES_SCRIPT = [
    "pantaneiro5.html",
    "pantaneiro7.html",
    "b2b-pantaneiro5.html",
    "b2b-pantaneiro7.html",
    "pedidos.html",
    "b2b-painel.html",
]

PANTANEIRO_PATCH = (
    "        const finalY = doc.autoTable.previous.finalY;\n\n        const obsText =",
    "        let finalY = doc.autoTable.previous.finalY;\n"
    "        if (typeof g8PdfDesenharResumoQuantidades === 'function') {\n"
    "          finalY = g8PdfDesenharResumoQuantidades(doc, margin, pageWidth, finalY + 6, window.pedidoItens || []);\n"
    "        }\n\n        const obsText =",
)

B2B_PATCH = (
    "          const finalY = doc.autoTable.previous.finalY + 8;\n          const obsText =",
    "          let finalY = doc.autoTable.previous.finalY;\n"
    "          if (typeof g8PdfDesenharResumoQuantidades === 'function') {\n"
    "            finalY = g8PdfDesenharResumoQuantidades(doc, margin, pageWidth, finalY + 6, window.pedidoItens || []);\n"
    "          }\n"
    "          finalY += 2;\n"
    "          const obsText =",
)

PEDIDOS_PATCH = (
    "      const finalY = doc.autoTable.previous.finalY + 8;\n      const transporte =",
    "      let finalY = doc.autoTable.previous.finalY;\n"
    "      if (typeof g8PdfDesenharResumoQuantidades === 'function') {\n"
    "        finalY = g8PdfDesenharResumoQuantidades(doc, margin, pageWidth, finalY + 6, itens || []);\n"
    "      }\n"
    "      finalY += 2;\n"
    "      const transporte =",
)

AUTOTABLE_MARKER = "jspdf.plugin.autotable.min.js\"></script>"


def add_script_tag(content: str) -> str:
    if "g8-resumo-unidades-pdf.js" in content:
        return content
    marker = AUTOTABLE_MARKER
    if marker not in content:
        return content
    return content.replace(marker + "\n", marker + "\n" + SCRIPT_TAG, 1)


def main():
    for name in FILES_SCRIPT:
        p = ROOT / name
        c = p.read_text(encoding="utf-8")
        original = c
        c = add_script_tag(c)
        if name in ("pantaneiro5.html", "pantaneiro7.html"):
            c = c.replace(*PANTANEIRO_PATCH)
        elif name.startswith("b2b-pantaneiro"):
            c = c.replace(*B2B_PATCH)
        elif name in ("pedidos.html", "b2b-painel.html"):
            c = c.replace(*PEDIDOS_PATCH)
        if c != original:
            p.write_text(c, encoding="utf-8")
            print(f"patched: {name}")
        else:
            print(f"skip: {name}")


if __name__ == "__main__":
    main()
