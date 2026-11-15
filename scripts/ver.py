#!/usr/bin/env python3
"""Herramienta de curación: consulta el texto extraído de un programa.

Uso:
    python3 scripts/ver.py pp 12-20          # imprime las páginas 12 a 20
    python3 scripts/ver.py pp 34             # una sola página
    python3 scripts/ver.py pp --buscar vivienda
    python3 scripts/ver.py --listar
"""
from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TEXTO = RAIZ / "data" / "texto"


def normalizar(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def cargar(slug: str) -> dict:
    ruta = TEXTO / f"{slug}.json"
    if not ruta.exists():
        sys.exit(f"No hay texto extraído para «{slug}». Ejecuta scripts/extraer_texto.py")
    return json.loads(ruta.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?")
    ap.add_argument("rango", nargs="?")
    ap.add_argument("--buscar")
    ap.add_argument("--listar", action="store_true")
    args = ap.parse_args()

    if args.listar:
        for ruta in sorted(TEXTO.glob("*.json")):
            d = json.loads(ruta.read_text(encoding="utf-8"))
            print(f"{d['slug']:14} {d['paginas']:3} págs  {d['caracteres']:7} chars  {d['pdf']}")
        return 0

    if not args.slug:
        ap.print_help()
        return 1

    doc = cargar(args.slug)

    if args.buscar:
        termino = normalizar(args.buscar)
        for p in doc["texto"]:
            texto = normalizar(p["texto"])
            n = texto.count(termino)
            if n:
                print(f"pág. {p['pagina']:3}  {n:2}×  {p['texto'][:150]}")
        return 0

    if not args.rango:
        ap.print_help()
        return 1

    if "-" in args.rango:
        desde, hasta = (int(x) for x in args.rango.split("-", 1))
    else:
        desde = hasta = int(args.rango)

    for p in doc["texto"]:
        if desde <= p["pagina"] <= hasta:
            print(f"\n─── pág. {p['pagina']} ───")
            print(p["texto"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
