import test from 'node:test';
import assert from 'node:assert/strict';

import { repartir } from '../src/lib/dhondt.js';

const soloAsignados = (r) =>
  Object.fromEntries(Object.entries(r.asignados).filter(([, n]) => n > 0));

test('ejemplo práctico de la LOREG: 8 escaños y 480.000 votos', () => {
  const r = repartir({
    votos: { A: 168000, B: 104000, C: 72000, D: 64000, E: 40000, F: 32000 },
    escanos: 8,
  });
  assert.deepEqual(soloAsignados(r), { A: 4, B: 2, C: 1, D: 1 });
  assert.equal(Object.values(r.asignados).reduce((a, b) => a + b, 0), 8);
  // El noveno cociente (primero sin escaño) es E 40/1.
  assert.equal(r.siguiente.partido, 'E');
  assert.equal(r.siguiente.divisor, 1);
  assert.equal(r.siguiente.cociente, 40000);
});

test('reparte exactamente los escaños disponibles', () => {
  for (const escanos of [1, 2, 3, 5, 8, 12, 16, 38]) {
    const r = repartir({
      votos: { A: 30, B: 25, C: 20, D: 15, E: 10 },
      escanos,
    });
    assert.equal(
      Object.values(r.asignados).reduce((a, b) => a + b, 0),
      escanos,
      `con ${escanos} escaños`,
    );
  }
});

test('el umbral es el 3% de los votos válidos e incluye el blanco', () => {
  // Sin blanco: válidos 62.000, umbral 1.860 → B (2.000) entra.
  const sinBlanco = repartir({ votos: { A: 60000, B: 2000 }, escanos: 5 });
  assert.ok(sinBlanco.aptos.includes('B'));

  // Con 10.000 en blanco: válidos 72.000, umbral 2.160 → B (2.000) queda fuera.
  const conBlanco = repartir({ votos: { A: 60000, B: 2000 }, escanos: 5, blanco: 10000 });
  assert.ok(!conBlanco.aptos.includes('B'));
  assert.deepEqual(conBlanco.excluidos, ['B']);
});

test('el umbral es un mínimo inclusivo: exactamente el 3% entra', () => {
  const r = repartir({ votos: { A: 970, B: 30 }, escanos: 3 });
  assert.equal(r.validos, 1000);
  assert.ok(r.aptos.includes('B'));
});

test('una candidatura por debajo del 3% no recibe escaños aunque le toque un cociente', () => {
  const r = repartir({ votos: { A: 49, B: 49, C: 2 }, escanos: 3 });
  assert.equal(r.asignados.C, undefined);
  assert.equal(r.asignados.A + r.asignados.B, 3);
});

test('los votos en blanco y otros no reciben escaños pero cuentan para el umbral', () => {
  const r = repartir({
    votos: { A: 40, B: 35, C: 15 },
    escanos: 5,
    blanco: 5,
    otros: 5,
  });
  assert.equal(r.validos, 100);
  assert.equal(r.asignados.blanco, undefined);
  assert.equal(Object.values(r.asignados).reduce((a, b) => a + b, 0), 5);
});

test('invariante a la escala: multiplicar los votos no cambia el reparto', () => {
  const base = { A: 34, B: 28, C: 18, D: 12, E: 8 };
  const normal = repartir({ votos: base, escanos: 10 });
  const escalado = repartir({
    votos: Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * 1000])),
    escanos: 10,
  });
  assert.deepEqual(normal.asignados, escalado.asignados);
});

test('en una circunscripción de un escaño gana el más votado', () => {
  const r = repartir({ votos: { A: 40, B: 35, C: 25 }, escanos: 1 });
  assert.deepEqual(soloAsignados(r), { A: 1 });
});

test('desempate: gana quien más votos totales tiene', () => {
  // A y B empatan a cociente 50 (100/2 y 50/1), pero A tiene más votos totales.
  const r = repartir({ votos: { A: 100, B: 50, C: 10 }, escanos: 2 });
  assert.equal(r.asignados.A, 2);
});

test('empate total: el sorteo es determinista entre ejecuciones', () => {
  const votos = { A: 40, B: 40, C: 20 };
  const primera = repartir({ votos, escanos: 3 });
  const segunda = repartir({ votos, escanos: 3 });
  assert.deepEqual(primera.asignados, segunda.asignados);
});

test('sin votos no hay reparto y no falla', () => {
  const r = repartir({ votos: {}, escanos: 4 });
  assert.equal(r.validos, 0);
  assert.deepEqual(r.asignados, {});
});

test('rechaza un número de escaños inválido', () => {
  assert.throws(() => repartir({ votos: { A: 100 }, escanos: 0 }));
  assert.throws(() => repartir({ votos: { A: 100 }, escanos: 1.5 }));
});
