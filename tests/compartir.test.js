import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enlacesCompartir, textoCompartir } from '../src/lib/compartir.js';

const url = 'https://ejemplo.test/tema/vivienda/#psoe-propuesta-2';
const texto = 'Vivienda como derecho fundamental · PSOE';

test('genera un enlace por red, sin duplicados', () => {
  const enlaces = enlacesCompartir({ texto, url });
  const ids = enlaces.map((e) => e.id);
  assert.deepEqual(ids, ['whatsapp', 'x', 'bluesky', 'telegram', 'correo']);
  assert.equal(new Set(ids).size, ids.length);
});

test('codifica acentos, almohadillas y ampersands', () => {
  const [wa, x, bsky, tg] = enlacesCompartir({
    texto: 'Vivienda & empleo: ¿qué proponen?',
    url,
  });
  for (const enlace of [wa, x, bsky, tg]) {
    assert.ok(!enlace.href.includes(' '), 'sin espacios sin codificar');
    assert.ok(!enlace.href.includes('#psoe'), 'la almohadilla va codificada');
  }
  assert.ok(wa.href.includes('Vivienda%20%26%20empleo'));
  assert.ok(x.href.includes('url=https%3A%2F%2Fejemplo.test'));
});

test('WhatsApp y Bluesky llevan texto y URL juntos; Telegram los separa', () => {
  const [wa, , bsky, tg] = enlacesCompartir({ texto, url });
  assert.ok(wa.href.includes(encodeURIComponent(`${texto} ${url}`)));
  assert.ok(bsky.href.includes(encodeURIComponent(`${texto} ${url}`)));
  assert.ok(tg.href.includes(`url=${encodeURIComponent(url)}`));
  assert.ok(tg.href.includes(`text=${encodeURIComponent(texto)}`));
});

test('el correo no es un enlace externo y lleva asunto', () => {
  const correo = enlacesCompartir({ texto, url, asunto: 'Elecciones 29N' }).at(-1);
  assert.equal(correo.externo, false);
  assert.ok(correo.href.startsWith('mailto:?subject=Elecciones%2029N'));
  assert.ok(correo.href.includes(encodeURIComponent(url)));
});

test('exige texto y URL', () => {
  assert.throws(() => enlacesCompartir({ texto: '', url }));
  assert.throws(() => enlacesCompartir({ texto, url: '' }));
});

test('compone el texto con titular y detalle', () => {
  assert.equal(textoCompartir('Vivienda', 'PSOE'), 'Vivienda · PSOE');
  assert.equal(textoCompartir('Vivienda'), 'Vivienda');
});
