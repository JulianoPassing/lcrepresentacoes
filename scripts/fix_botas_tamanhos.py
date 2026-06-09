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

OLD_BOTAS = 'const tamanhosBotas = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];'
NEW_BOTAS = 'const tamanhosBotas = ["35/36", "37/38", "39/40", "41/42", "43/44", "45/46"];'

HELPER = """
      const TAMANHOS_BOTAS_PARES = ["35/36", "37/38", "39/40", "41/42", "43/44", "45/46"];
      function produtoTemBotas(produto) {
        if (!produto) return false;
        if (["201", "203", "204"].includes(String(produto.REFERENCIA))) return true;
        const tamanhos = Array.isArray(produto.TAMANHOS) ? produto.TAMANHOS : [produto.TAMANHOS];
        return tamanhos.some((t) => /^\\d+\\/\\d+$/.test(String(t || "").trim()));
      }
      function getTamanhosBotas(produto) {
        const tamanhos = Array.isArray(produto.TAMANHOS) ? produto.TAMANHOS : [produto.TAMANHOS];
        const pares = tamanhos.filter((t) => /^\\d+\\/\\d+$/.test(String(t || "").trim()));
        return pares.length ? pares : TAMANHOS_BOTAS_PARES;
      }
"""

MARKER = "// ========== FIM DA LISTA DE PRODUTOS ATUALIZADA =========="


def patch_file(path: Path) -> None:
    content = path.read_text(encoding="utf-8")

    if OLD_BOTAS not in content:
        raise RuntimeError(f"Array antigo de botas não encontrado em {path.name}")

    content = content.replace(OLD_BOTAS, NEW_BOTAS)

    if "function produtoTemBotas" not in content:
        content = content.replace(MARKER, MARKER + HELPER, 1)

    # 201 only -> produtoTemBotas
    content = content.replace('if (produto.REFERENCIA === "201") {', "if (produtoTemBotas(produto)) {", content.count('if (produto.REFERENCIA === "201") {'))

    # tamanhosBotas constant -> getTamanhosBotas(produto) in loops
    content = content.replace(
        'const tamanhosBotas = ["35/36", "37/38", "39/40", "41/42", "43/44", "45/46"];',
        "const tamanhosBotas = getTamanhosBotas(produto);",
    )

    # Mobile/desktop manual input for 203/204 -> boot pairs
    manual_mobile = re.compile(
        r'\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'//[^\n]*\n\s*'
        r'tamanhosMobileHTML = `<input type="text" placeholder="Digite Tamanho/Bota" class="manual-tamanho-input" id="tamanho-mobile-\$\{produto\.REFERENCIA\}">`;\s*',
        re.MULTILINE,
    )
    manual_desktop = re.compile(
        r'\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'//[^\n]*\n\s*'
        r'tamanhosInputHTML \+= `<input type="text" placeholder="Digite Tamanho/Bota" class="manual-tamanho-input" id="tamanho-\$\{produto\.REFERENCIA\}">`;\s*',
        re.MULTILINE,
    )

    boot_pair_block_mobile = """} else if (produto.REFERENCIA === "203" || produto.REFERENCIA === "204") {
              const tamanhosBotas = getTamanhosBotas(produto);
              tamanhosBotas.forEach((tamanho) => {
                const tamanhoId = tamanho.replace(/[^a-zA-Z0-9]/g, "");
                tamanhosMobileHTML += `<div><label for="quantidade-mobile-${produto.REFERENCIA}-${tamanhoId}">Bota ${tamanho}</label><input type="number" min="0" value="0" id="quantidade-mobile-${produto.REFERENCIA}-${tamanhoId}"></div>`;
              });
            """

    boot_pair_block_desktop = """} else if (produto.REFERENCIA === "203" || produto.REFERENCIA === "204") {
              const tamanhosBotas = getTamanhosBotas(produto);
              tamanhosBotas.forEach((tamanho) => {
                const tamanhoId = tamanho.replace(/[^a-zA-Z0-9]/g, "");
                tamanhosInputHTML += `<div><label for="quantidade-${produto.REFERENCIA}-${tamanhoId}">Bota ${tamanho}</label><input type="number" min="0" value="0" id="quantidade-${produto.REFERENCIA}-${tamanhoId}"></div>`;
              });
            """

    content, n1 = manual_mobile.subn(boot_pair_block_mobile, content)
    content, n2 = manual_desktop.subn(boot_pair_block_desktop, content)

    # adicionarAoPedido mobile/desktop: 203/204 manual -> pairs
    content = re.sub(
        r'\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'// Referências 203 e 204: Tamanho manual\s*'
        r'const tamanhoInput = document\.getElementById\(`tamanho-mobile-\$\{produto\.REFERENCIA\}`\);\s*'
        r'const tamanho = tamanhoInput\.value\.trim\(\);\s*'
        r'const quantidade = 1;\s*'
        r'if \(tamanho\) \{\s*'
        r'handleItem\(tamanho, quantidade\);\s*'
        r'\}\s*',
        """} else if (produto.REFERENCIA === "203" || produto.REFERENCIA === "204") {
          getTamanhosBotas(produto).forEach((tamanho) => {
            const tamanhoId = tamanho.replace(/[^a-zA-Z0-9]/g, "");
            const quantidade = parseInt(
              document.getElementById(`quantidade-mobile-${produto.REFERENCIA}-${tamanhoId}`).value
            ) || 0;
            handleItem(`Bota ${tamanho}`, quantidade);
          });
        """,
        content,
        flags=re.MULTILINE,
    )

    content = re.sub(
        r'\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'// Referências 203 e 204: Tamanho manual\s*'
        r'const tamanhoManual = document\s*'
        r'\.getElementById\(`tamanho-\$\{produto\.REFERENCIA\}`\)\s*'
        r'\.value\.trim\(\);\s*'
        r'if \(tamanhoManual\) \{\s*'
        r'handleItem\(tamanhoManual, 1\);\s*'
        r'\} else \{\s*'
        r'alert\(\s*'
        r'`Por favor, digite o tamanho para o produto \$\{produto\.DESCRIÇÃO\}\.`\s*'
        r'\);\s*'
        r'\}\s*',
        """} else if (produto.REFERENCIA === "203" || produto.REFERENCIA === "204") {
          getTamanhosBotas(produto).forEach((tamanho) => {
            const tamanhoId = tamanho.replace(/[^a-zA-Z0-9]/g, "");
            const quantidadeInput = document.getElementById(`quantidade-${produto.REFERENCIA}-${tamanhoId}`);
            const quantidade = quantidadeInput ? parseInt(quantidadeInput.value) || 0 : 0;
            handleItem(`Bota ${tamanho}`, quantidade);
          });
        """,
        content,
        flags=re.MULTILINE,
    )

    # clear fields after add - 203/204
    content = re.sub(
        r'\} else if \(produto\.REFERENCIA === "203" \|\| produto\.REFERENCIA === "204"\) \{\s*'
        r'document\.getElementById\(`tamanho-mobile-\$\{produto\.REFERENCIA\}`\)\.value = "";\s*',
        """} else if (produto.REFERENCIA === "203" || produto.REFERENCIA === "204") {
            getTamanhosBotas(produto).forEach((tamanho) => {
              const tamanhoId = tamanho.replace(/[^a-zA-Z0-9]/g, "");
              document.getElementById(`quantidade-mobile-${produto.REFERENCIA}-${tamanhoId}`).value = 0;
            });
          """,
        content,
        flags=re.MULTILINE,
    )

    # skip normal loop for 203/204
    content = content.replace(
        '} else if (produto.REFERENCIA !== "203" && produto.REFERENCIA !== "204") {',
        '} else if (!produtoTemBotas(produto)) {',
    )

    # Labels for 201 boot inputs - add "Bota " prefix in rendering
    content = content.replace(
        'tamanhosMobileHTML += `<div><label for="quantidade-mobile-${produto.REFERENCIA}-${tamanho}">${tamanho}</label>',
        'tamanhosMobileHTML += `<div><label for="quantidade-mobile-${produto.REFERENCIA}-${tamanho.replace(/[^a-zA-Z0-9]/g, "")}">Bota ${tamanho}</label>',
    )
    content = content.replace(
        'id="quantidade-mobile-${produto.REFERENCIA}-${tamanho}">',
        'id="quantidade-mobile-${produto.REFERENCIA}-${tamanho.replace(/[^a-zA-Z0-9]/g, "")}">',
    )
    content = content.replace(
        'tamanhosInputHTML += `<div><label for="quantidade-${produto.REFERENCIA}-${tamanho}">${tamanho}</label>',
        'tamanhosInputHTML += `<div><label for="quantidade-${produto.REFERENCIA}-${tamanho.replace(/[^a-zA-Z0-9]/g, "")}">Bota ${tamanho}</label>',
    )
    content = content.replace(
        'id="quantidade-${produto.REFERENCIA}-${tamanho}">',
        'id="quantidade-${produto.REFERENCIA}-${tamanho.replace(/[^a-zA-Z0-9]/g, "")}">',
    )

    # adicionar handlers use tamanhoId for botas
    content = content.replace(
        'document.getElementById(`quantidade-mobile-${produto.REFERENCIA}-${tamanho}`).value',
        'document.getElementById(`quantidade-mobile-${produto.REFERENCIA}-${tamanho.replace(/[^a-zA-Z0-9]/g, "")}`).value',
    )
    content = content.replace(
        'document.getElementById(`quantidade-${produto.REFERENCIA}-${tamanho}`)',
        'document.getElementById(`quantidade-${produto.REFERENCIA}-${tamanho.replace(/[^a-zA-Z0-9]/g, "")}`)',
    )
    content = content.replace(
        'handleItem(tamanho, quantidade);',
        'handleItem(produtoTemBotas(produto) ? `Bota ${tamanho}` : tamanho, quantidade);',
    )

    path.write_text(content, encoding="utf-8")
    print(f"OK {path.name} (manual mobile={n1}, desktop={n2})")


def main():
    for name in FILES:
        patch_file(ROOT / name)


if __name__ == "__main__":
    main()
