import type { APIRoute } from 'astro';
import { partidos, temas, sitio } from '../lib/datos';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://elecciones29n-sigma.vercel.app');
  const rutas = [
    '/',
    '/temas/',
    '/calculadora/',
    '/programas/',
    '/sobre/',
    '/fuentes/',
    ...temas.map((tema) => `/tema/${tema.slug}/`),
    ...partidos
      .filter((partido) => partido.estado === 'disponible')
      .map((partido) => `/partido/${partido.slug}/`),
  ];
  const urls = rutas
    .map(
      (ruta) =>
        `  <url><loc>${new URL(ruta, base).href}</loc><lastmod>${sitio.actualizado}</lastmod></url>`,
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
