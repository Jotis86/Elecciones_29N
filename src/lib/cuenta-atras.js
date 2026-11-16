/** Fecha de las elecciones generales del 29N. */
export const FECHA_ELECCIONES = '2026-11-29';

/**
 * Fecha actual en hora peninsular española, en formato YYYY-MM-DD.
 * Se usa Europe/Madrid para que la cuenta atrás cambie a medianoche en España
 * aunque quien visite la web esté en otra zona horaria.
 */
export function fechaMadrid(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ahora);

  const valor = (tipo) => partes.find((parte) => parte.type === tipo)?.value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

/** Días naturales entre hoy y la fecha indicada (ambas en formato YYYY-MM-DD). */
export function diasHasta(fecha, hoy = fechaMadrid()) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [anioHoy, mesHoy, diaHoy] = hoy.split('-').map(Number);

  const objetivo = Date.UTC(anio, mes - 1, dia);
  const actual = Date.UTC(anioHoy, mesHoy - 1, diaHoy);

  return Math.round((objetivo - actual) / 86_400_000);
}

/**
 * Texto de la cuenta atrás. Devuelve null cuando las elecciones ya pasaron,
 * para que la portada pueda ocultar la píldora.
 */
export function textoCuentaAtras(dias) {
  if (!Number.isInteger(dias) || dias < 0) return null;
  if (dias === 0) return { numero: null, texto: 'Hoy son las elecciones' };

  return {
    numero: dias,
    texto: dias === 1 ? 'día para las elecciones' : 'días para las elecciones',
  };
}
