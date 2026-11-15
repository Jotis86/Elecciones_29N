"""Extrae los escaños por circunscripción del anexo del RD 806/2026 (BOE-A-2026-20742).

Uso: python scripts/boe_escanos.py   -> escribe data/escanos.json
Fuente: https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-20742
"""
import json
import urllib.request
import xml.etree.ElementTree as ET

BOE_ID = "BOE-A-2026-20742"
URL = f"https://www.boe.es/diario_boe/xml.php?id={BOE_ID}"

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

def main(xml_text: str | None = None) -> None:
    if xml_text is None:
        with urllib.request.urlopen(URL) as r:
            xml_text = r.read().decode("utf-8")
    filas = extraer(xml_text)
    total = sum(f["diputados"] for f in filas)
    assert len(filas) == 52, f"Esperaba 52 circunscripciones, hay {len(filas)}"
    assert total == 350, f"Esperaba 350 escaños, suman {total}"
    out = {"fuente": URL, "boe": BOE_ID, "total": total, "circunscripciones": filas}
    with open("data/escanos.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"OK: {len(filas)} circunscripciones, {total} escaños")

if __name__ == "__main__":
    main()
