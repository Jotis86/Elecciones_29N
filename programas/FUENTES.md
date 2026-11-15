# Programas electorales 29N 2026 — fuentes

Actualizado: 2026-11-15

Los PDFs NO se versionan (ver `.gitignore`). Esta tabla es el registro de
fuentes; la web enlaza a la URL oficial y, cuando exista, a una copia archivada.

| Partido | Programa | Estado | Archivo local | URL oficial |
|---|---|---|---|---|
| PP | La Reconstrucción Nacional | Publicado 10-nov · texto extraído | `pp.pdf` | https://www.pp.es/wp-content/uploads/2026/11/LA-RECONSTRUCCION-NACIONAL.pdf |
| PSOE | — | Presentación prevista 15-nov | — | — |
| Vox | Es sentido común | Publicado ~12-nov · confirmar PDF completo | `vox.pdf` | https://www.voxespana.es/wp-content/uploads/2026/11/Programa-completo-A5-1.pdf |
| SALF | Contrato electoral | Publicado · texto extraído | `salf.pdf` | https://www.seacabolafiesta.com/SALF_Contrato_Electoral_29N.pdf |
| Por Un Mundo Más Justo | Si no es justo, cámbialo | Publicado · texto extraído | `por un mundo mas justo.pdf` | https://www.porunmundomasjusto.es/wp-content/uploads/2026/11/Castellano.pdf |
| ERC | Programa electoral Congrés 2026 | Anunciado, PDF no localizado | — | no encontrado en esquerra.cat |
| PNV / EAJ | Euskadi zaindu | Publicado · bilingüe eu/es | `pnv.pdf` | https://www.eaj-pnv.eus/eu/adjuntos-agiriak/21765/pdf/hauteskunde-programa-a29 |
| BNG | Xerais 2026 | Publicado · en gallego | `bng.pdf` | https://www.bng.gal/media/bnggaliza/files/2026/11/12/26_bng_xerais_documentos_programa_electoral.pdf |
| CC | Defiende Canarias | Publicado 9-nov | `canaria.pdf` | https://coalicioncanaria.org/wp-content/uploads/2026/11/CCA-26-Programa_Electoral-29NOV.pdf |
| Frente Amplio | — | Sin publicar | — | — |
| Podemos | — | Sin publicar | — | — |

## Notas

- **SALF**: en la tabla original figuraba como «La ilusión de un país», pero el
  documento se titula «Contrato electoral».
- **PNV**: el documento está en euskera (con versión en castellano).
- **BNG**: el documento está en gallego.
- **CC**: el archivo local se llama `canaria.pdf` (antes figuraba como `cc.pdf`).
- **PSOE**: si se confirma la publicación del 15-nov, descargar, añadir a
  `data/partidos.json` y extraer el texto.

## Pendiente

- Guardar copia archivada (Wayback Machine) de cada PDF y rellenar
  `pdf_archivado` en `data/partidos.json`.
- Revisar si los partidos sustituyen sus PDFs: `scripts/extraer_texto.py` avisa
  cuando cambia el `sha256`.
