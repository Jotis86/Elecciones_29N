import { defineConfig } from 'astro/config';

/**
 * Dirección pública del sitio. En Vercel no hace falta configurar nada: la
 * plataforma expone el dominio de producción en VERCEL_PROJECT_PRODUCTION_URL.
 * En local se queda en localhost, que es lo correcto para las pruebas.
 */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const produccion = 'https://elecciones29n-sigma.vercel.app';
const site =
  process.env.PUBLIC_SITE_URL ??
  (vercel
    ? `https://${vercel}`
    : process.env.NODE_ENV === 'production'
      ? produccion
      : 'http://localhost:4321');

export default defineConfig({
  site,
  devToolbar: { enabled: false },
  build: {
    format: 'directory',
  },
});
