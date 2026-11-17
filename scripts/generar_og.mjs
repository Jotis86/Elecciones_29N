import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const RAIZ = process.cwd();
const partidos = JSON.parse(readFileSync(join(RAIZ, 'data/partidos.json'), 'utf8'));
const temas = JSON.parse(readFileSync(join(RAIZ, 'data/temas.json'), 'utf8'));
const fichas = Object.fromEntries(
  readdirSync(join(RAIZ, 'data/propuestas'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const d = JSON.parse(readFileSync(join(RAIZ, 'data/propuestas', f), 'utf8'));
      return [d.partido, d];
    }),
);

const SALIDA = join(RAIZ, 'public/og');
mkdirSync(SALIDA, { recursive: true });

const PAPEL = '#fcfbf7';
const TINTA = '#14161a';
const TENUE = '#5b6170';
const LINEA = '#ddd8cc';

const escapeXml = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const wrap = (text, maxChars, maxLines = 3) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let actual = '';
  for (const word of words) {
    const prueba = actual ? `${actual} ${word}` : word;
    if (prueba.length <= maxChars) actual = prueba;
    else {
      if (actual) lines.push(actual);
      actual = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (actual) lines.push(actual);
  return lines.slice(0, maxLines);
};

const tspan = (lines, x, y, size, lineHeight = size * 1.18, extra = '') =>
  lines
    .map((line, i) => `<tspan x="${x}" y="${y + i * lineHeight}" ${extra}>${escapeXml(line)}</tspan>`)
    .join('');

const baseSvg = ({ kicker, title, subtitle, accent, footer, badge }) => {
  const titleSize = title.length > 18 ? 58 : title.length > 13 ? 68 : title.length > 10 ? 82 : 96;
  const titleLines = wrap(title, 20, 2);
  const subtitleLines = wrap(subtitle, 58, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPEL}"/>
  <rect x="0" y="0" width="18" height="630" fill="${accent}"/>
  <text x="80" y="58" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700" fill="${TINTA}">29N</text>
  <text x="180" y="56" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="16" letter-spacing="2" fill="${TENUE}">ELECCIONES GENERALES · 29 DE NOVIEMBRE DE 2026</text>
  <text x="80" y="142" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="18" letter-spacing="2.6" fill="${accent}">${escapeXml(kicker)}</text>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="700" fill="${TINTA}">${tspan(titleLines, 80, 270, titleSize, titleSize * 1.05)}</text>
  <text font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="31" fill="${TENUE}">${tspan(subtitleLines, 80, 420, 31, 42)}</text>
  <line x1="80" y1="548" x2="1120" y2="548" stroke="${LINEA}" stroke-width="2"/>
  <text x="80" y="590" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="20" fill="${TINTA}">${escapeXml(footer)}</text>
  ${badge ? `<text x="1120" y="590" text-anchor="end" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="18" fill="${TENUE}">${escapeXml(badge)}</text>` : ''}
</svg>`;
};

const generar = async (nombre, svg) => {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(SALIDA, nombre));
};

const jobs = [];
for (const partido of partidos) {
  const ficha = fichas[partido.slug];
  const temasFicha = ficha ? Object.keys(ficha.temas).length : 0;
  const propuestas = ficha
    ? Object.values(ficha.temas).reduce((n, b) => n + b.propuestas.length, 0)
    : 0;
  const kicker = 'PARTIDO · 29N';
  const title = partido.siglas;
  const subtitle = partido.programa ?? 'Programa electoral todavía no publicado';
  const footer = partido.estado === 'disponible'
    ? `${temasFicha} temas · ${propuestas} propuestas citadas`
    : 'Se actualizará cuando se publique el programa';
  const badge = 'elecciones29n-sigma.vercel.app';
  const svg = baseSvg({ kicker, title, subtitle, accent: partido.color, footer, badge });
  jobs.push(generar(`partido-${partido.slug}.png`, svg));
}

for (const tema of temas) {
  const conFicha = partidos.filter(
    (p) => p.estado === 'disponible' && fichas[p.slug]?.temas?.[tema.slug],
  );
  const propuestas = conFicha.reduce(
    (n, p) => n + fichas[p.slug].temas[tema.slug].propuestas.length,
    0,
  );
  const svg = baseSvg({
    kicker: 'TEMA · 29N',
    title: tema.nombre,
    subtitle: tema.descripcion,
    accent: TINTA,
    footer: `${conFicha.length} partidos · ${propuestas} propuestas citadas`,
    badge: 'elecciones29n-sigma.vercel.app',
  });
  jobs.push(generar(`tema-${tema.slug}.png`, svg));
}

await Promise.all(jobs);
console.log(`${partidos.length} OG de partido y ${temas.length} OG de tema generadas en public/og/`);
