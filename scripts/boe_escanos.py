"""Actualiza los escaños por circunscripción desde el anexo del RD 806/2026.

Uso: python scripts/boe_escanos.py

Lee data/escanos.json (que aporta los códigos INE y los nombres), descarga el
anexo del BOE y actualiza solo el número de diputados de cada circunscripción,
conservando el resto de metadatos y el esquema que usa la web.

Fuente: https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-20742
"""
import json
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

BOE_ID = "BOE-A-2026-20742"
URL = f"https://www.boe.es/diario_boe/xml.php?id={BOE_ID}"
RUTA = Path("data/escanos.json")

NUM = {
    "uno": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5, "seis": 6, "siete": 7,
    "ocho": 8, "nueve": 9, "diez": 10, "once": 11, "doce": 12, "trece": 13,
    "catorce": 14, "quince": 15, "dieciséis": 16, "diecisiete": 17, "dieciocho": 18,
    "diecinueve": 19, "veinte": 20, "treinta": 30, "cuarenta": 40,
}

def palabras_a_numero(txt: str) -> int:
    total = 0
    for w in txt.lower().strip(". ").replace(" y ", " ").split():
        total += NUM[w]
    return total

def extraer(xml_text: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    filas = []
    for tr in root.iter("tr"):
        celdas = ["".join(td.itertext()).strip() for td in tr]
        if len(celdas) != 2 or celdas[0].startswith("Circunscripción"):
            continue
        filas.append({"circunscripcion": celdas[0].rstrip("."),
                      "diputados": palabras_a_numero(celdas[1])})
    return filas

def normalizar(nombre: str) -> str:
    """Une variantes con o sin acentos, puntos finales y espacios dobles."""
    sin_acentos = unicodedata.normalize("NFKD", nombre)
    sin_acentos = "".join(c for c in sin_acentos if not unicodedata.combining(c))
    return " ".join(sin_acentos.lower().rstrip(".").split())


def main(xml_text: str | None = None) -> None:
    if xml_text is None:
        with urllib.request.urlopen(URL) as r:
            xml_text = r.read().decode("utf-8")

    filas = extraer(xml_text)
    assert len(filas) == 52, f"Esperaba 52 circunscripciones, hay {len(filas)}"
    assert sum(f["diputados"] for f in filas) == 350, "Los escaños no suman 350"

    actual = json.loads(RUTA.read_text(encoding="utf-8"))
    por_nombre = {normalizar(c["nombre"]): c for c in actual["circunscripciones"]}

    sin_match = []
    for fila in filas:
        clave = normalizar(fila["circunscripcion"])
        if clave not in por_nombre:
            sin_match.append(fila["circunscripcion"])
            continue
        por_nombre[clave]["diputados"] = fila["diputados"]

    if sin_match:
        raise SystemExit(
            "Circunscripciones del BOE sin correspondencia en data/escanos.json: "
            + ", ".join(sin_match)
        )

    total = sum(c["diputados"] for c in actual["circunscripciones"])
    assert total == 350, f"Tras la actualización suman {total}, no 350"
    actual["total"] = total

    RUTA.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {len(filas)} circunscripciones actualizadas, {total} escaños ({BOE_ID})")

if __name__ == "__main__":
    main()
