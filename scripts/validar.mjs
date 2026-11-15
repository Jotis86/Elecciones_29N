#!/usr/bin/env node
/**
 * Valida los datos antes de construir el sitio.
 *
 * Comprueba, entre otras cosas, que cada cita textual aparece de verdad en la
 * página del PDF que se indica. Si una cita no se encuentra, el proceso falla:
 * el sitio no publica nada que no esté respaldado por el documento original.
 *
 * Uso:
 *   node scripts/validar.mjs             # errores + avisos
 *   node scripts/validar.mjs --estricto  # exige los 16 temas en cada partido
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATOS = join(RAIZ, 'data');

const ESTRICTO = process.argv.includes('--estricto');
const errores = [];
const avisos = [];

const leer = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));

/** Normaliza para comparar: sin acentos, minúsculas y sin puntuación. */
const normalizar = (s) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

const partidos = leer(join(DATOS, 'partidos.json'));
const temas = leer(join(DATOS, 'temas.json'));
const sitio = existsSync(join(DATOS, 'sitio.json'))
  ? leer(join(DATOS, 'sitio.json'))
  : null;

// ── Metadatos del sitio ───────────────────────────────────────────────────
if (!sitio) {
  errores.push('Falta data/sitio.json');
} else {
  if (!sitio.autor || typeof sitio.autor !== 'string') {
    errores.push('sitio.json: falta el autor');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sitio.actualizado ?? '')) {
    errores.push('sitio.json: fecha de actualización no válida');
  }
  if (
    sitio.contacto !== null &&
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(sitio.contacto ?? '')
  ) {
    errores.push('sitio.json: contacto no válido');
  }
  if (!Array.isArray(sitio.correcciones)) {
    errores.push('sitio.json: correcciones debe ser un array');
  } else {
    sitio.correcciones.forEach((c, i) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha ?? '')) {
        errores.push(`sitio.json: la corrección ${i + 1} no tiene fecha válida`);
      }
      if (!c.texto) {
        errores.push(`sitio.json: la corrección ${i + 1} no tiene texto`);
      }
    });
  }
}
const slugsTema = new Set(temas.map((t) => t.slug));
const slugsPartido = new Set(partidos.map((p) => p.slug));

// ── Integridad de partidos ────────────────────────────────────────────────
if (slugsPartido.size !== partidos.length) {
  errores.push('Hay slugs de partido duplicados en data/partidos.json');
}
for (const p of partidos) {
  if (!/^[a-z0-9-]+$/.test(p.slug)) errores.push(`Slug no válido: «${p.slug}»`);
  if (!p.color?.match(/^#[0-9A-Fa-f]{6}$/)) errores.push(`${p.slug}: color no válido`);
  if (p.estado === 'disponible') {
    if (!p.pdf_oficial) errores.push(`${p.slug}: disponible pero sin pdf_oficial`);
    if (!p.programa) errores.push(`${p.slug}: disponible pero sin nombre de programa`);
  }
  if (p.estado !== 'disponible' && p.estado !== 'pendiente') {
    errores.push(`${p.slug}: estado desconocido «${p.estado}»`);
  }
  if (
    p.escanos2023 !== undefined &&
    (!Number.isInteger(p.escanos2023) || p.escanos2023 < 0)
  ) {
    errores.push(`${p.slug}: escanos2023 debe ser un entero no negativo`);
  }
}

// ── Integridad de temas ───────────────────────────────────────────────────
if (slugsTema.size !== temas.length) errores.push('Hay slugs de tema duplicados en data/temas.json');

// ── Fichas de propuestas ──────────────────────────────────────────────────
const dirPropuestas = join(DATOS, 'propuestas');
const ficheros = existsSync(dirPropuestas)
  ? readdirSync(dirPropuestas).filter((f) => f.endsWith('.json'))
  : [];

if (ficheros.length === 0) avisos.push('No hay fichas en data/propuestas/');

const resumenPartidos = [];

for (const fichero of ficheros) {
  const ficha = leer(join(dirPropuestas, fichero));
  const slug = ficha.partido;
  const partido = partidos.find((p) => p.slug === slug);

  if (!partido) {
    errores.push(`${fichero}: el partido «${slug}» no existe en partidos.json`);
    continue;
  }
  if (partido.estado !== 'disponible') {
    errores.push(`${fichero}: «${slug}» está como ${partido.estado} pero tiene ficha`);
  }

  const textoRuta = join(DATOS, 'texto', `${slug}.json`);
  if (!existsSync(textoRuta)) {
    errores.push(`${slug}: falta data/texto/${slug}.json (ejecuta scripts/extraer_texto.py)`);
    continue;
  }
  const documento = leer(textoRuta);
  const paginas = new Map(documento.texto.map((p) => [p.pagina, normalizar(p.texto)]));
  const totalPaginas = documento.paginas;

  // Los programas que no están en castellano se traducen, pero se guarda la
  // cita original y se verifica contra el PDF.
  const idioma = ficha.idioma ?? 'es';
  if (!['es', 'gl', 'eu'].includes(idioma)) {
    errores.push(`${slug}: idioma desconocido «${idioma}»`);
  }

  if (!partido.pdf && documento.pdf) {
    avisos.push(`${slug}: partidos.json no indica «pdf» pero existe texto extraído`);
  }

  let nPropuestas = 0;
  const temasFicha = Object.keys(ficha.temas ?? {});

  for (const tema of temasFicha) {
    if (!slugsTema.has(tema)) {
      errores.push(`${slug}: tema desconocido «${tema}»`);
      continue;
    }
    const bloque = ficha.temas[tema];
    if (!bloque?.resumen || bloque.resumen.length < 80) {
      errores.push(`${slug}/${tema}: resumen ausente o demasiado corto`);
    }
    if (!Array.isArray(bloque?.propuestas) || bloque.propuestas.length === 0) {
      errores.push(`${slug}/${tema}: no tiene propuestas`);
      continue;
    }

    for (const [i, prop] of bloque.propuestas.entries()) {
      const etiqueta = `${slug}/${tema}[${i}]`;
      nPropuestas++;

      if (!prop.titular || prop.titular.length < 5) errores.push(`${etiqueta}: titular ausente`);
      if (!prop.texto || prop.texto.length < 40) errores.push(`${etiqueta}: cita demasiado corta`);
      if (idioma !== 'es' && !prop.texto_original) {
        avisos.push(`${etiqueta}: sin cita original en ${idioma}`);
      }
      if (!Number.isInteger(prop.pagina)) {
        errores.push(`${etiqueta}: «pagina» debe ser un número entero`);
        continue;
      }
      if (prop.pagina < 1 || prop.pagina > totalPaginas) {
        errores.push(`${etiqueta}: página ${prop.pagina} fuera del documento (1-${totalPaginas})`);
        continue;
      }

      const cita = normalizar(prop.texto_original ?? prop.texto);
      if (!cita) {
        errores.push(`${etiqueta}: la cita queda vacía al normalizar`);
        continue;
      }

      if (!paginas.get(prop.pagina)?.includes(cita)) {
        // ¿Está en una página contigua? Suele indicar un desfase de una página.
        const vecina = [prop.pagina - 1, prop.pagina + 1].find((n) =>
          paginas.get(n)?.includes(cita),
        );
        errores.push(
          vecina
            ? `${etiqueta}: la cita aparece en la página ${vecina}, no en la ${prop.pagina}`
            : `${etiqueta}: la cita NO aparece en la página ${prop.pagina} del PDF`,
        );
      }
    }
  }

  const faltan = [...slugsTema].filter((t) => !temasFicha.includes(t));
  if (faltan.length && (ESTRICTO || faltan.length < slugsTema.size)) {
    avisos.push(`${slug}: sin ficha en ${faltan.length} tema(s): ${faltan.join(', ')}`);
  }

  resumenPartidos.push(`${slug.padEnd(12)} ${String(temasFicha.length).padStart(2)} temas · ${String(nPropuestas).padStart(3)} propuestas`);
}

// ── Informe ───────────────────────────────────────────────────────────────
console.log('Validación de datos\n');
for (const linea of resumenPartidos) console.log('  ' + linea);

const pendientes = partidos.filter((p) => p.estado === 'pendiente');
if (pendientes.length) {
  console.log(`\n  ${pendientes.length} partidos pendientes de programa: ${pendientes.map((p) => p.siglas).join(', ')}`);
}

if (avisos.length) {
  console.log('\nAvisos');
  for (const a of avisos) console.log('  · ' + a);
}

if (errores.length) {
  console.log(`\n${errores.length} error(es)`);
  for (const e of errores) console.log('  ✗ ' + e);
  process.exit(1);
}

console.log('\nTodo correcto: todas las citas están en la página indicada.');
