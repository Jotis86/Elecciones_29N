import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FECHA_ELECCIONES,
  diasHasta,
  fechaMadrid,
  textoCuentaAtras,
} from '../src/lib/cuenta-atras.js';

test('la fecha de las elecciones es el 29N', () => {
  assert.equal(FECHA_ELECCIONES, '2026-11-29');
});

test('cuenta los días naturales que faltan', () => {
  assert.equal(diasHasta('2026-11-29', '2026-11-16'), 13);
  assert.equal(diasHasta('2026-11-29', '2026-11-28'), 1);
  assert.equal(diasHasta('2026-11-29', '2026-11-29'), 0);
  assert.equal(diasHasta('2026-11-29', '2026-11-30'), -1);
});

test('singular, plural y día de las elecciones', () => {
  assert.deepEqual(textoCuentaAtras(13), {
    numero: 13,
    texto: 'días para las elecciones',
  });
  assert.deepEqual(textoCuentaAtras(1), {
    numero: 1,
    texto: 'día para las elecciones',
  });
  assert.deepEqual(textoCuentaAtras(0), {
    numero: null,
    texto: 'Hoy son las elecciones',
  });
});

test('después de las elecciones no hay cuenta atrás', () => {
  assert.equal(textoCuentaAtras(-1), null);
});

test('la fecha de Madrid cambia a medianoche', () => {
  assert.equal(fechaMadrid(new Date('2026-11-16T22:59:00Z')), '2026-11-16');
  assert.equal(fechaMadrid(new Date('2026-11-16T23:00:00Z')), '2026-11-17');
});

test('la fecha de Madrid respeta el horario de verano', () => {
  assert.equal(fechaMadrid(new Date('2026-07-01T21:59:00Z')), '2026-07-01');
  assert.equal(fechaMadrid(new Date('2026-07-01T22:00:00Z')), '2026-07-02');
});
