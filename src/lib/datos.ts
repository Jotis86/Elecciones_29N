import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const leer = <T>(ruta: string): T => JSON.parse(readFileSync(join(RAIZ, ruta), 'utf8'));

export interface Partido {
  slug: string;
  siglas: string;
  nombre: string;
  color: string;
  programa: string | null;
  estado: 'disponible' | 'pendiente';
  ambito: string;
  pdf: string | null;
  pdf_oficial: string | null;
  pdf_archivado: string | null;
  publicado: string | null;
  descargado: string | null;
  notas: string | null;
}

export interface Tema {
  slug: string;
  nombre: string;
  descripcion: string;
  palabras: string[];
}

export interface Propuesta {
  titular: string;
  texto: string;
  /** Cita literal en el idioma original cuando el programa no está en castellano. */
  texto_original?: string;
  pagina: number;
  nota?: string;
}

export interface BloqueTema {
  resumen: string;
  propuestas: Propuesta[];
}

export interface Ficha {
  partido: string;
  /** Idioma original del programa: es, gl (gallego) o eu (euskera). */
  idioma?: 'es' | 'gl' | 'eu';
  revisado: string;
  temas: Record<string, BloqueTema>;
}

export const NOMBRE_IDIOMA: Record<string, string> = {
  es: 'castellano',
  gl: 'gallego',
  eu: 'euskera',
};

export const partidos = leer<Partido[]>('data/partidos.json');
export const temas = leer<Tema[]>('data/temas.json');

const dirFichas = join(RAIZ, 'data/propuestas');
export const fichas: Ficha[] = existsSync(dirFichas)
  ? readdirSync(dirFichas)
      .filter((f) => f.endsWith('.json'))
      .map((f) => leer<Ficha>(`data/propuestas/${f}`))
  : [];

export const partidosDisponibles = partidos.filter((p) => p.estado === 'disponible');
export const partidosPendientes = partidos.filter((p) => p.estado === 'pendiente');

export const partidoPorSlug = (slug: string) => partidos.find((p) => p.slug === slug);
export const temaPorSlug = (slug: string) => temas.find((t) => t.slug === slug);
export const fichaDe = (slug: string) => fichas.find((f) => f.partido === slug);

export const totalPropuestas = fichas.reduce(
  (n, f) => n + Object.values(f.temas).reduce((m, b) => m + b.propuestas.length, 0),
  0,
);

export const totalFichas = fichas.reduce((n, f) => n + Object.keys(f.temas).length, 0);

/** Una ficha por tema, ordenada según el orden de partidos.json. */
export function fichasPorTema(temaSlug: string) {
  return partidos
    .map((partido) => {
      const ficha = fichaDe(partido.slug);
      const bloque = ficha?.temas[temaSlug];
      return bloque ? { partido, ficha: ficha!, bloque } : null;
    })
    .filter((x): x is { partido: Partido; ficha: Ficha; bloque: BloqueTema } => x !== null);
}

/** Enlace a la página exacta del PDF oficial. */
export function enlacePdf(partido: Partido, pagina?: number) {
  if (!partido.pdf_oficial) return null;
  return pagina ? `${partido.pdf_oficial}#page=${pagina}` : partido.pdf_oficial;
}

export interface DocumentoTexto {
  slug: string;
  pdf: string;
  sha256: string;
  paginas: number;
  caracteres: number;
  extraido: string;
  texto: { pagina: number; texto: string }[];
}

export function documentoDe(slug: string): DocumentoTexto | null {
  const ruta = join(RAIZ, 'data/texto', `${slug}.json`);
  return existsSync(ruta) ? leer<DocumentoTexto>(`data/texto/${slug}.json`) : null;
}

export function formatearFecha(iso: string | null) {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][Number(m) - 1]} de ${a}`;
}
