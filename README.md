# Programas electorales · 29N

Web informativa sobre las elecciones generales del 29 de noviembre de 2026.
Reúne los programas de los partidos, los resume por temas y enlaza cada
propuesta a la página exacta del PDF oficial.

Sitio estático generado con [Astro](https://astro.build). Sin servidor, sin
trackers, sin cookies.

## Arrancar

Requisitos: Node 22.23.4+ y Python 3.11+.

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt

npm run dev      # http://localhost:4321
npm run build    # valida los datos y genera dist/
npm run validar  # valida citas y datos electorales
npm run og       # regenera las imágenes OG de partidos y temas
npm test         # pruebas: D'Hondt, porcentajes, compartir y cuenta atrás
```

## Dirección pública

Las URLs absolutas (canonical y tarjetas al compartir) salen de `PUBLIC_SITE_URL`.
En Vercel se toma sola de `VERCEL_PROJECT_PRODUCTION_URL`, así que no hay que
configurar nada. En desarrollo apunta a `http://localhost:4321`; al generar
un build sin variables usa la URL pública de producción.

## Cuenta atrás del 29N

La portada muestra una píldora con los días que faltan para las elecciones,
junto a la fecha del encabezado. Se calcula en el navegador con la fecha de
Madrid (`Europe/Madrid`), no al construir el sitio, y se actualiza cada minuto
y al volver a la pestaña. El 29N muestra «Hoy son las elecciones» y a partir
del 30 desaparece.

La lógica está en `src/lib/cuenta-atras.js` y la píldora en
`src/components/CuentaAtras.astro`. Sin JavaScript no se muestra la cuenta
atrás, para no dejar una cifra antigua: la fecha sigue visible en el kicker.

## Cómo está organizado

```
programas/            PDFs originales (no se versionan, están en .gitignore)
data/
  partidos.json       metadatos: siglas, color, programa, URLs, estado, escaños 2023;
                      pdf_fuente si el partido no aloja el PDF y se usa una copia
  temas.json          taxonomía de 16 temas + palabras clave
  sitio.json          autor y fecha de actualización
  escanos.json        diputados por circunscripción (anexo RD 806/2026)
  texto/<slug>.json   texto extraído del PDF, página a página (generado)
  propuestas/<slug>.json  fichas curadas: resumen + citas con página
src/
  lib/datos.ts         carga de datos y utilidades
  lib/cuenta-atras.js  días para el 29N, fecha de Madrid y cálculo
  lib/dhondt.js        reparto D'Hondt y umbral del 3% (LOREG 162-163)
  lib/porcentajes.js   topes del 100% y redondeo en décimas
  components/          FichaTema, TarjetaPartido, Compartir, CuentaAtras
  pages/               portada, /temas, /tema/[slug], /partido/[slug],
                       /calculadora, /buscar, /programas, /sobre, /fuentes,
                       404, sitemap.xml y robots.txt
tests/
  dhondt.test.js        ejemplo de la LOREG, umbral, empates y escala
  porcentajes.test.js   topes del 100% y recorte de valores
  compartir.test.js     enlaces de compartir por red
  cuenta-atras.test.js  días, singular/plural y medianoche de Madrid
  reparto-2023.test.js  reparto oficial del 23J en las 52 provincias
scripts/
  extraer_texto.py    PDF → data/texto (con caché por sha256)
  ver.py              consulta el texto extraído durante la curación
  validar.mjs         comprueba esquema y que cada cita exista en su página
  validar-electoral.mjs  52 circunscripciones y suma de 350 diputados
  generar_og.mjs      genera las imágenes OG de partidos y temas en public/og
  boe_escanos.py      actualiza los diputados desde el BOE sin cambiar el esquema
```

Los partidos se ordenan por `escanos2023` (de mayor a menor) y, a igualdad, por
siglas. Las candidaturas sin escaños en 2023 van después. El orden se aplica en
la portada, en los temas y en la tabla de programas.

## Añadir un partido

1. Descarga el PDF a `programas/`.
2. Añade su entrada en `data/partidos.json` con `estado: "disponible"`,
   `pdf` (nombre del archivo), `pdf_oficial` y `programa`. Si el partido no
   publica el PDF, indica `pdf_fuente` con la copia de terceros y explica la
   procedencia en `notas`.
3. Extrae el texto:
   ```bash
   .venv/bin/python scripts/extraer_texto.py --solo <slug>
   ```
4. Crea `data/propuestas/<slug>.json` con las fichas por tema.
5. Genera las imágenes OG y valida:
   ```bash
   npm run og && npm run validar && npm run build
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

- quedan fuera las candidaturas con menos del 3 % de los votos válidos, umbral
  que incluye el voto en blanco;
- los votos se dividen entre 1, 2, 3… hasta el número de escaños y se asignan
  los cocientes mayores, comparados con enteros para evitar redondeos;
- los empates de cociente se resuelven por votos totales y, si persisten, por
  un sorteo determinista y reproducible. Es una simplificación del criterio de
  la LOREG, que ordena los empates por sorteo y los siguientes de forma
  alternativa.

Las barras miden los escaños de cada partido sobre el total de la
circunscripción, de modo que todas juntas suman el 100% de los escaños.

Los porcentajes tampoco pueden sumar más de 100: cada campo tiene como tope lo
que queda libre, los campos sin margen se deshabilitan y el resto se muestra
como «otros partidos (sin asignar)». No hay normalización silenciosa: lo que
ves es lo que se reparte.

Los colores son estables por partido (PP azul, PSOE rojo) y todos los números
se formatean en español. Los escaños se pueden actualizar desde el BOE con
`python scripts/boe_escanos.py`, que conserva los códigos y nombres.

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
