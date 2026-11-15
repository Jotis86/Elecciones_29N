/**
 * Utilidades de porcentajes para la calculadora.
 *
 * Todo se mide en décimas de punto porcentual (1000 = 100 %) para que las
 * sumas y los topes cuadren sin errores de coma flotante.
 */

/** Convierte un porcentaje a décimas enteras. */
export const decimas = (valor) => Math.round(Number(valor) * 10);

/**
 * Máximo en décimas que puede tomar un campo.
 *
 * @param {number[]} valores  Todos los campos en décimas, incluido el propio.
 * @param {number} indice     Índice del campo; para el blanco, el último.
 * @returns {number}          Décimas libres para ese campo.
 */
export function maximoCampo(valores, indice) {
  const total = valores.reduce((suma, v) => suma + v, 0);
  const propio = valores[indice] ?? 0;
  return Math.max(0, 1000 - (total - propio));
}

/** Recorta un porcentaje al máximo permitido y lo devuelve en décimas. */
export function recortar(valor, maximoDecimas) {
  const v = Math.round((Number(valor) || 0) * 10);
  return Math.min(Math.max(0, maximoDecimas), Math.max(0, v));
}
