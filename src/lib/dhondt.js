/**
 * Reparto D'Hondt conforme a los artículos 162 y 163 de la LOREG.
 *
 * Reglas implementadas:
 *  - Quedan fuera las candidaturas con menos del 3 % de los votos válidos
 *    emitidos en la circunscripción (art. 163.1.a).
 *  - Los votos de cada candidatura se dividen entre 1, 2, 3… hasta el número
 *    de escaños y se asignan los cocientes mayores (art. 163.1.c).
 *  - Si coinciden cocientes de candidaturas distintas, gana la que más votos
 *    totales tenga; si persiste el empate, se resuelve por sorteo
 *    (art. 163.1.d). El sorteo aquí es determinista: misma entrada, mismo
 *    resultado, usando una semilla pública.
 *
 * Los votos pueden expresarse en cualquier unidad (votos reales o milésimas
 * de punto porcentual): el método es invariante a la escala.
 */

/** Semilla del «sorteo» para los empates. Documentada y fija a propósito. */
export const SEMILLA_SORTEO = 29;

/** Hash FNV-1a: solo para ordenar empates de forma estable. */
function hash(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Compara dos cocientes (mayor primero) sin dividir, para no depender de
 * redondeos en coma flotante: a.votos/a.divisor frente a b.votos/b.divisor.
 */
export function compararCocientes(a, b) {
  const izquierda = a.votos * b.divisor;
  const derecha = b.votos * a.divisor;
  if (izquierda !== derecha) return derecha - izquierda;

  // Mismo cociente: gana quien más votos totales tiene.
  if (a.votos !== b.votos) return b.votos - a.votos;

  // Empate total: sorteo determinista entre candidaturas.
  const ha = hash(`${a.partido}|${SEMILLA_SORTEO}`);
  const hb = hash(`${b.partido}|${SEMILLA_SORTEO}`);
  if (ha !== hb) return ha - hb;
  return a.partido < b.partido ? -1 : 1;
}

/**
 * @param {object} opciones
 * @param {Record<string, number>} opciones.votos  Votos o pesos por candidatura.
 * @param {number} opciones.escanos                Escaños de la circunscripción.
 * @param {number} [opciones.blanco]               Votos en blanco (cuentan como válidos).
 * @param {number} [opciones.otros]                Otros votos válidos sin escaño.
 * @returns {{
 *   validos: number,
 *   umbral: number,
 *   aptos: string[],
 *   excluidos: string[],
 *   asignados: Record<string, number>,
 *   ganadores: Array<{ partido: string, votos: number, divisor: number, cociente: number }>,
 *   siguiente: ({ partido: string, votos: number, divisor: number, cociente: number } | null)
 * }}
 */
export function repartir({ votos, escanos, blanco = 0, otros = 0 }) {
  if (!Number.isInteger(escanos) || escanos < 1) {
    throw new Error('El número de escaños debe ser un entero mayor o igual que 1.');
  }

  const entradas = Object.entries(votos)
    .map(([partido, valor]) => ({ partido, votos: Number(valor) }))
    .filter((x) => Number.isFinite(x.votos) && x.votos > 0)
    .sort((a, b) => b.votos - a.votos || a.partido.localeCompare(b.partido, 'es'));

  const totalCandidaturas = entradas.reduce((suma, x) => suma + x.votos, 0);
  const validos = totalCandidaturas + Math.max(0, blanco) + Math.max(0, otros);

  if (validos <= 0 || entradas.length === 0) {
    return {
      validos,
      umbral: 0,
      aptos: [],
      excluidos: [],
      asignados: {},
      ganadores: [],
      siguiente: null,
    };
  }

  const umbral = validos * 0.03;
  const aptos = entradas.filter((x) => x.votos >= umbral);
  const excluidos = entradas.filter((x) => x.votos < umbral);

  const cocientes = [];
  for (const { partido, votos: votosPartido } of aptos) {
    for (let divisor = 1; divisor <= escanos; divisor++) {
      cocientes.push({ partido, votos: votosPartido, divisor });
    }
  }
  cocientes.sort(compararCocientes);

  const ganadores = cocientes.slice(0, escanos);
  const asignados = {};
  for (const ganador of ganadores) {
    asignados[ganador.partido] = (asignados[ganador.partido] ?? 0) + 1;
  }

  const conCociente = (g) => ({ ...g, cociente: g.votos / g.divisor });
  const siguiente = cocientes[escanos] ?? null;

  return {
    validos,
    umbral,
    aptos: aptos.map((x) => x.partido),
    excluidos: excluidos.map((x) => x.partido),
    asignados,
    ganadores: ganadores.map(conCociente),
    siguiente: siguiente ? conCociente(siguiente) : null,
  };
}
