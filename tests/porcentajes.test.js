import test from 'node:test';
import assert from 'node:assert/strict';

import { decimas, maximoCampo, recortar } from '../src/lib/porcentajes.js';

test('convierte porcentajes a décimas enteras', () => {
  assert.equal(decimas(0), 0);
  assert.equal(decimas(40.5), 405);
  assert.equal(decimas(33.33), 333);
  assert.equal(decimas('12.3'), 123);
});

test('el máximo de un campo excluye su propio valor', () => {
  // 40 % + 30 % + 5 % = 75 %.
  const valores = [400, 300, 0, 50];
  // Un campo con 40 % puede subir hasta 65 % (100 % − 30 % − 5 %).
  assert.equal(maximoCampo(valores, 0), 650);
  // Un campo a 0 solo puede ocupar lo libre: 25 %.
  assert.equal(maximoCampo(valores, 2), 250);
  // El blanco (último) también puede ocupar lo libre: 30 %.
  assert.equal(maximoCampo(valores, 3), 300);
});

test('si el resto ocupa el 100 %, el máximo es 0', () => {
  // El campo de 40 % no puede subir porque el resto ya suma 60 %.
  assert.equal(maximoCampo([400, 600, 0], 0), 400);
  // Un campo vacío no tiene margen.
  assert.equal(maximoCampo([400, 600, 0], 2), 0);
});

test('recorta al máximo y redondea a décimas', () => {
  assert.equal(recortar(70, 600), 600);
  assert.equal(recortar(33.33, 1000), 333);
  assert.equal(recortar(-5, 1000), 0);
  assert.equal(recortar(10, 0), 0);
});

test('el máximo y el recorte nunca permiten pasar de 1000 décimas', () => {
  const valores = [999, 0, 1];
  const maximo = maximoCampo(valores, 1);
  assert.equal(maximo, 0);
  assert.equal(recortar(50, maximo), 0);
});
