import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { repartir } from '../src/lib/dhondt.js';

const datos = JSON.parse(
  readFileSync(new URL('../data/resultados_2023.json', import.meta.url), 'utf8'),
);

/**
 * Prueba de extremo a extremo: con los votos oficiales del 23J y los escaños
 * de cada provincia, el reparto debe coincidir con el que proclamó la Junta
 * Electoral Central en las 52 circunscripciones.
 */
test('reproduce el reparto oficial de 2023 en las 52 provincias', () => {
  assert.equal(datos.provincias.length, 52);

  let provincias = 0;
  for (const provincia of datos.provincias) {
    const votos = {};
    const esperado = {};
    provincia.partidos.forEach((partido, i) => {
      const clave = `${partido.siglas}#${i}`;
      votos[clave] = partido.votos;
      if (partido.escanos > 0) esperado[clave] = partido.escanos;
    });

    const resultado = repartir({
      votos,
      escanos: provincia.escanos,
      blanco: provincia.votos_blanco,
    });
    const obtenido = Object.fromEntries(
      Object.entries(resultado.asignados).filter(([, n]) => n > 0),
    );

    assert.deepEqual(
      obtenido,
      esperado,
      `${provincia.nombre}: el reparto no coincide con el oficial`,
    );
    provincias++;
  }

  assert.equal(provincias, 52);
  assert.equal(
    datos.provincias.reduce((total, p) => total + p.escanos, 0),
    350,
  );
});
