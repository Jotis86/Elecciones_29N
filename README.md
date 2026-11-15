# Programas electorales · 29N

Web informativa sobre las elecciones generales del 29 de noviembre de 2026.
Reúne los programas de los partidos, los resume por temas y enlaza cada
propuesta a la página exacta del PDF oficial.

Sitio estático generado con [Astro](https://astro.build). Sin servidor, sin
trackers, sin cookies.

## Arrancar

Requisitos: Node 20+ y Python 3.11+.

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt

npm run dev      # http://localhost:4321
npm run build    # valida los datos y genera dist/
npm run validar  # valida citas y datos electorales
npm test         # pruebas del reparto D'Hondt
```

## Cómo está organizado

```
programas/            PDFs originales (no se versionan, están en .gitignore)
data/
  partidos.json       metadatos: siglas, color, programa, URLs, estado
  temas.json          taxonomía de 16 temas + palabras clave
  escanos.json        diputados por circunscripción (anexo RD 806/2026)
  texto/<slug>.json   texto extraído del PDF, página a página (generado)
  propuestas/<slug>.json  fichas curadas: resumen + citas con página
src/
  lib/datos.ts        carga de datos y utilidades
  lib/dhondt.js       reparto D'Hondt y umbral del 3% (LOREG 162-163)
  components/         FichaTema, TarjetaPartido
  pages/              portada, /temas, /tema/[slug], /partido/[slug],
                      /calculadora, /buscar, /programas, /sobre
tests/
  dhondt.test.js      ejemplo de la LOREG, umbral, empates y escala
scripts/
  extraer_texto.py    PDF → data/texto (con caché por sha256)
  ver.py              consulta el texto extraído durante la curación
  validar.mjs         comprueba esquema y que cada cita exista en su página
  validar-electoral.mjs  52 circunscripciones y suma de 350 diputados
```

## Añadir un partido

1. Descarga el PDF oficial a `programas/`.
2. Añade su entrada en `data/partidos.json` con `estado: "disponible"`,
   `pdf` (nombre del archivo), `pdf_oficial` y `programa`.
3. Extrae el texto:
   ```bash
   .venv/bin/python scripts/extraer_texto.py --solo <slug>
   ```
4. Crea `data/propuestas/<slug>.json` con las fichas por tema.
5. Valida y construye:
   ```bash
   npm run validar && npm run build
   ```

Si el partido aún no ha publicado programa, basta con `estado: "pendiente"`:
su página existe y la web lo muestra como «pendiente», sin romper enlaces.

## Añadir un tema

Añade el objeto en `data/temas.json` (`slug`, `nombre`, `descripcion`,
`palabras`). Aparecerá automáticamente en la portada, en `/temas` y como ruta
`/tema/<slug>`. Los partidos sin ficha en ese tema se listan como «sin
propuestas localizadas».

## Programa en otro idioma

Si el programa no está en castellano, la ficha lleva `"idioma": "gl"` o `"eu"`
y cada propuesta guarda la cita original además de la traducción:

```json
{
  "titular": "Topar el alquiler por ley",
  "texto": "Topar por ley los precios de los alquileres…",
  "texto_original": "Topar por lei os prezos dos alugueiros…",
  "pagina": 12
}
```

El validador comprueba `texto_original` contra el PDF (la traducción no se
valida, porque no está en el documento) y la web muestra la traducción con un
desplegable para ver la cita literal en su idioma.

## Por qué no se suben los PDFs

- Git no perdona archivos grandes: un PDF de 69 MB queda en el historial para
  siempre, y GitHub bloquea por encima de 100 MB.
- Los programas tienen derechos de autor: enlazar es lo correcto; citar
  fragmentos con indicación de fuente, también.
- Se guarda `sha256` del PDF usado, así que si el partido cambia el documento
  el proceso de extracción lo detecta.
- `data/texto/*.json` sí se versiona: permite buscar y validar sin redistribuir
  el documento completo.

## Calculadora D'Hondt

`/calculadora` reparte escaños por circunscripción con los diputados del anexo
del Real Decreto 806/2026 (BOE-A-2026-20742) y las reglas de los artículos 162
y 163 de la LOREG:

- quedan fuera las candidaturas con menos del 3% de los votos válidos, umbral
  que incluye el voto en blanco;
- los votos se dividen entre 1, 2, 3… hasta el número de escaños y se asignan
  los cocientes mayores, comparados con enteros para evitar redondeos;
- los empates de cociente se resuelven por votos totales y, si persisten, por
  un sorteo determinista y reproducible.

Las barras miden los escaños de cada partido sobre el total de la
circunscripción, de modo que todas juntas suman el 100% de los escaños.

El botón **Reproducir 2023** carga los votos oficiales del 23J guardados en
`data/resultados_2023.json`, usa los escaños de 2023 y marca la página con un
distintivo de «resultado oficial». En ese modo el cálculo emplea los votos
enteros, no los porcentajes redondeados. Al editar cualquier porcentaje se sale
del modo y se vuelve a los escaños de 2026.

Los campos empiezan vacíos: la página no carga encuestas ni resultados
anteriores. `npm test` verifica, entre otros casos, el ejemplo práctico de la
LOREG y que el reparto sea invariante a la escala.

## La garantía

`scripts/validar.mjs` normaliza cada cita (sin acentos, espacios ni puntuación)
y comprueba que aparece en el texto de la página indicada. Si una cita no
coincide, `npm run build` falla. Una cita desplazada un página también se
detecta y se señala con la página donde sí aparece.
