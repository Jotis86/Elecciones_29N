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
npm run build    # valida las citas y genera dist/
npm run validar  # solo la validación
```

## Cómo está organizado

```
programas/            PDFs originales (no se versionan, están en .gitignore)
data/
  partidos.json       metadatos: siglas, color, programa, URLs, estado
  temas.json          taxonomía de 16 temas + palabras clave
  texto/<slug>.json   texto extraído del PDF, página a página (generado)
  propuestas/<slug>.json  fichas curadas: resumen + citas con página
src/
  lib/datos.ts        carga de datos y utilidades
  components/         FichaTema, TarjetaPartido
  pages/              portada, /temas, /tema/[slug], /partido/[slug], /programas, /sobre
scripts/
  extraer_texto.py    PDF → data/texto (con caché por sha256)
  ver.py              consulta el texto extraído durante la curación
  validar.mjs         comprueba esquema y que cada cita exista en su página
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

## Por qué no se suben los PDFs

- Git no perdona archivos grandes: un PDF de 69 MB queda en el historial para
  siempre, y GitHub bloquea por encima de 100 MB.
- Los programas tienen derechos de autor: enlazar es lo correcto; citar
  fragmentos con indicación de fuente, también.
- Se guarda `sha256` del PDF usado, así que si el partido cambia el documento
  el proceso de extracción lo detecta.
- `data/texto/*.json` sí se versiona: permite buscar y validar sin redistribuir
  el documento completo.

## La garantía

`scripts/validar.mjs` normaliza cada cita (sin acentos, espacios ni puntuación)
y comprueba que aparece en el texto de la página indicada. Si una cita no
coincide, `npm run build` falla. Una cita desplazada un página también se
detecta y se señala con la página donde sí aparece.
