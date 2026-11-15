/**
 * Enlaces de compartir sin scripts de terceros.
 *
 * Son URLs normales: no cargan píxeles ni cookies, y funcionan sin JavaScript.
 * El texto se compone con el titular y la URL absoluta de la página o cita.
 */

const REDES = [
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    url: (texto, url) => `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
  },
  {
    id: 'x',
    nombre: 'X',
    url: (texto, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'bluesky',
    nombre: 'Bluesky',
    url: (texto, url) => `https://bsky.app/intent/compose?text=${encodeURIComponent(`${texto} ${url}`)}`,
  },
  {
    id: 'telegram',
    nombre: 'Telegram',
    url: (texto, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto)}`,
  },
  {
    id: 'correo',
    nombre: 'Correo',
    url: (texto, url, asunto) =>
      `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(`${texto}\n\n${url}`)}`,
    externo: false,
  },
];

/**
 * @param {{ texto: string, url: string, asunto?: string }} datos
 * @returns {{ id: string, nombre: string, href: string, externo: boolean }[]}
 */
export function enlacesCompartir({ texto, url, asunto = 'Programas electorales 29N' }) {
  if (!texto || !url) throw new Error('Hacen falta texto y url para compartir');
  return REDES.map((red) => ({
    id: red.id,
    nombre: red.nombre,
    href: red.url(texto, url, asunto),
    externo: red.externo !== false,
  }));
}

/** Texto corto y estable para las tarjetas de compartir. */
export function textoCompartir(titular, detalle) {
  return detalle ? `${titular} · ${detalle}` : titular;
}
