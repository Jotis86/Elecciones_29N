"""Resultados oficiales del Congreso 23J 2023 por provincia -> data/resultados_2023.json

Fuente: Ministerio del Interior (Infoelectoral), fichero TOTA (ámbito superior al municipio).
Formato de registros de ancho fijo descrito en FICHEROS.doc dentro del zip.
Uso: python scripts/infoelectoral_2023.py
"""
import io, json, urllib.request, zipfile

URL = "https://infoelectoral.interior.gob.es/estaticos/docxl/apliextr/02202307_TOTA.zip"

def parse(files: dict[str, str]) -> list[dict]:
    lines = lambda k: [l for l in files[k].splitlines() if l.strip()]
    siglas, nacional = {}, {}
    for l in lines("03022307.DAT"):              # candidaturas
        cod, sig = l[8:14], l[14:64].strip()
        siglas[cod], nacional[cod] = sig, l[-6:]
    provs = {}
    for l in lines("07022307.DAT"):              # datos de ámbito (CA/provincia)
        pr, dist = l[11:13], l[13:14]
        if pr == "99" or dist != "9":            # 99 = totales CA/nacional
            continue
        r = l[64:]
        n = lambda a, b: int(r[a:b])
        provs[pr] = {"cod_ine": pr, "nombre": l[14:64].strip(), "censo_ine": n(13, 21),
                     "votos_blanco": n(61, 69), "votos_nulos": n(69, 77),
                     "votos_candidaturas": n(77, 85), "escanos": n(85, 91), "partidos": []}
    for l in lines("08022307.DAT"):              # votos por candidatura
        pr, dist = l[11:13], l[13:14]
        if pr not in provs or dist != "9":
            continue
        cod, votos, esc = l[14:20], int(l[20:28]), int(l[28:33])
        if votos:
            provs[pr]["partidos"].append({"siglas": siglas[cod],
                                          "agrupacion_nacional": siglas.get(nacional[cod], siglas[cod]),
                                          "votos": votos, "escanos": esc})
    out = sorted(provs.values(), key=lambda p: p["cod_ine"])
    for p in out:
        p["partidos"].sort(key=lambda x: -x["votos"])
        p["votos_validos"] = p["votos_candidaturas"] + p["votos_blanco"]
        p["votantes"] = p["votos_validos"] + p["votos_nulos"]
    return out

def main() -> None:
    with urllib.request.urlopen(URL) as r:
        z = zipfile.ZipFile(io.BytesIO(r.read()))
    files = {n: z.read(n).decode("latin-1") for n in z.namelist() if n.endswith(".DAT")}
    provs = parse(files)
    assert len(provs) == 52 and sum(p["escanos"] for p in provs) == 350
    data = {"eleccion": "Congreso 23J 2023", "fuente": URL,
            "nota": "Resultados oficiales Ministerio del Interior. censo_ine excluye CERA.",
            "provincias": provs}
    with open("data/resultados_2023.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"OK: {len(provs)} provincias, 350 escaños")

if __name__ == "__main__":
    main()
