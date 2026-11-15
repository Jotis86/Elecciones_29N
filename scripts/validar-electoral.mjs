#!/usr/bin/env node
/**
 * Valida los datos electorales antes de construir el sitio.
 *
 * Comprueba que el anexo del Real Decreto esté completo y cuadre:
 * 52 circunscripciones, códigos INE únicos, suma exacta de 350 diputados
 * y Ceuta y Melilla con un escaño cada una.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATOS = join(RAIZ, 'data', 'escanos.json');

const errores = [];
const leer = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));

let datos;
try {
  datos = leer(DATOS);
} catch (error) {
  console.error('No se puede leer data/escanos.json:', error.message);
  process.exit(1);
}

const circunscripciones = datos.circunscripciones ?? [];

if (!datos.fuente) errores.push('Falta la referencia a la fuente (Real Decreto).');
if (!datos.boe) errores.push('Falta el identificador del BOE.');
if (!Number.isInteger(datos.total)) errores.push('Falta el total de diputados.');

if (circunscripciones.length !== 52) {
  errores.push(`Hay ${circunscripciones.length} circunscripciones; deberían ser 52.`);
}

const codigos = new Set();
for (const c of circunscripciones) {
  if (!/^\d{2}$/.test(c.codigo ?? '')) {
    errores.push(`Código no válido: «${c.codigo}» (${c.nombre}).`);
  }
  if (codigos.has(c.codigo)) errores.push(`Código duplicado: ${c.codigo}.`);
  codigos.add(c.codigo);
  if (!c.nombre || typeof c.nombre !== 'string') {
    errores.push(`Circunscripción sin nombre: ${c.codigo}.`);
  }
  if (!Number.isInteger(c.diputados) || c.diputados < 1) {
    errores.push(`${c.nombre}: diputados debe ser un entero mayor que 0.`);
  }
}

// Los códigos INE de provincia van del 01 al 52 sin huecos.
for (let i = 1; i <= 52; i++) {
  const codigo = String(i).padStart(2, '0');
  if (!codigos.has(codigo)) errores.push(`Falta la circunscripción con código ${codigo}.`);
}

const suma = circunscripciones.reduce((total, c) => total + (c.diputados ?? 0), 0);
if (suma !== datos.total) {
  errores.push(`La suma de diputados es ${suma}; el total declarado es ${datos.total}.`);
}
if (datos.total !== 350) {
  errores.push('El Congreso debe tener 350 diputados.');
}

const ceuta = circunscripciones.find((c) => c.codigo === '51');
const melilla = circunscripciones.find((c) => c.codigo === '52');
for (const [nombre, c] of [['Ceuta', ceuta], ['Melilla', melilla]]) {
  if (!c) errores.push(`Falta ${nombre}.`);
  else if (c.diputados !== 1) errores.push(`${nombre} debe elegir 1 diputado.`);
}

if (errores.length) {
  console.error(`Datos electorales: ${errores.length} error(es)`);
  for (const e of errores) console.error('  ✗ ' + e);
  process.exit(1);
}

console.log(
  `Datos electorales: 52 circunscripciones, ${suma} diputados (${datos.boe}).`,
);
