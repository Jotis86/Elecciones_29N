#!/usr/bin/env python3
"""Extrae el texto de los programas electorales, página a página.

Uso:
    python3 scripts/extraer_texto.py            # extrae solo lo que falta o cambió
    python3 scripts/extraer_texto.py --forzar   # re-extrae todo
    python3 scripts/extraer_texto.py --solo pp

El resultado va a data/texto/<slug>.json. El script guarda el sha256 del PDF:
si el partido cambia el documento, la próxima ejecución lo detecta y avisa.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PROGRAMAS = RAIZ / "programas"
DATOS = RAIZ / "data"


def sha256(ruta: Path) -> str:
    h = hashlib.sha256()
    with ruta.open("rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def limpiar(texto: str) -> str:
    """Normaliza el texto de una página para que sea legible y citable.

    - une las líneas en un solo párrafo
    - colapsa espacios múltiples
    - elimina guiones de partición al final de línea
    """
    texto = texto.replace("\u00ad", "")          # guion blando
    texto = re.sub(r"(\w)-\n(\w)", r"\1\2", texto)  # palabra par-
    texto = texto.replace("\n", " ")
    texto = re.sub(r"[ \t\u00a0]+", " ", texto)
    return texto.strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--forzar", action="store_true")
    ap.add_argument("--solo", default=None)
    args = ap.parse_args()

    try:
        from pypdf import PdfReader
    except ImportError:
        print("Falta pypdf. Instálalo con:", file=sys.stderr)
        print("  python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt", file=sys.stderr)
        return 1

    partidos = json.loads((DATOS / "partidos.json").read_text(encoding="utf-8"))
    salida = DATOS / "texto"
    salida.mkdir(parents=True, exist_ok=True)

    extraidos = 0
    saltados = 0
    importados = 0

    for partido in partidos:
        slug = partido["slug"]
        if args.solo and slug != args.solo:
            continue
        pdf = partido.get("pdf")
        if not pdf:
            continue

        ruta = PROGRAMAS / pdf
        if not ruta.exists():
            print(f"  ! {slug}: no existe programas/{pdf}", file=sys.stderr)
            importados += 1
            continue

        destino = salida / f"{slug}.json"
        huella = sha256(ruta)

        if destino.exists() and not args.forzar:
            anterior = json.loads(destino.read_text(encoding="utf-8"))
            if anterior.get("sha256") == huella:
                saltados += 1
                continue
            if anterior.get("sha256"):
                print(f"  ~ {slug}: el PDF cambió desde la última extracción. Revisa las citas.")

        reader = PdfReader(str(ruta))
        paginas = []
        for i, pagina in enumerate(reader.pages, start=1):
            try:
                texto = limpiar(pagina.extract_text() or "")
            except Exception as exc:  # noqa: BLE001 - un PDF roto no debe tumbar el resto
                print(f"  ! {slug} pág. {i}: {exc}", file=sys.stderr)
                texto = ""
            paginas.append({"pagina": i, "texto": texto})

        documento = {
            "slug": slug,
            "pdf": pdf,
            "sha256": huella,
            "paginas": len(paginas),
            "caracteres": sum(len(p["texto"]) for p in paginas),
            "extraido": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "texto": paginas,
        }
        destino.write_text(
            json.dumps(documento, ensure_ascii=False, indent=1) + "\n",
            encoding="utf-8",
        )
        vacias = sum(1 for p in paginas if len(p["texto"]) < 40)
        nota = f" ({vacias} páginas sin texto: ¿escaneadas?)" if vacias else ""
        print(f"  + {slug}: {len(paginas)} páginas{nota}")
        extraidos += 1

    print(f"\n{extraidos} extraídos, {saltados} sin cambios, {importados} sin PDF.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
