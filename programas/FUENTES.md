# Programas electorales 29N 2026 — fuentes

Actualizado: 2026-11-16

Los PDFs NO se versionan (ver `.gitignore`). Esta tabla es el registro de
fuentes; la web enlaza a la URL oficial y, cuando exista, a una copia archivada.

| Partido | Programa | Estado | Archivo local | URL oficial |
|---|---|---|---|---|
| PP | La Reconstrucción Nacional | Publicado 10-nov · texto extraído | `pp.pdf` | https://www.pp.es/wp-content/uploads/2026/11/LA-RECONSTRUCCION-NACIONAL.pdf |
| PSOE | La fuerza de seguir avanzando | Publicado 15-nov · texto extraído | `psoe.pdf` | https://www.psoe.es/media-content/2026/11/PROGRAMAPSOE29N26-1.pdf |
| Vox | Es sentido común | Publicado ~12-nov · confirmar PDF completo | `vox.pdf` | https://www.voxespana.es/wp-content/uploads/2026/11/Programa-completo-A5-1.pdf |
| SALF | Contrato electoral | Publicado · texto extraído | `salf.pdf` | https://www.seacabolafiesta.com/SALF_Contrato_Electoral_29N.pdf |
| Por Un Mundo Más Justo | Si no es justo, cámbialo | Publicado · texto extraído | `por un mundo mas justo.pdf` | https://www.porunmundomasjusto.es/wp-content/uploads/2026/11/Castellano.pdf |
| ERC | Programa electoral Congrés 2026 | Anunciado, PDF no localizado | — | no encontrado en esquerra.cat |
| PNV / EAJ | Euskadi zaindu | Publicado · en euskera | `pnv.pdf` | https://www.eaj-pnv.eus/eu/adjuntos-agiriak/21765/pdf/hauteskunde-programa-a29 |
| BNG | Xerais 2026 | Publicado · en gallego | `bng.pdf` | https://www.bng.gal/media/bnggaliza/files/2026/11/12/26_bng_xerais_documentos_programa_electoral.pdf |
| CC | Defiende Canarias | Publicado 9-nov | `canaria.pdf` | https://coalicioncanaria.org/wp-content/uploads/2026/11/CCA-26-Programa_Electoral-29NOV.pdf |
| UPN | — | Coalición con PP en Navarra; programa conjunto pendiente | — | — |
| Frente Amplio | Un programa como una casa | Publicado 16-nov · texto extraído | `ProgramaFrenteAmplio.pdf` | https://frenteamplio.info/pdf/ProgramaFrenteAmplio.pdf |
| Podemos | — | Sin publicar | — | — |

## Notas

- **SALF**: en la tabla original figuraba como «La ilusión de un país», pero el
  documento se titula «Contrato electoral».
- **PNV**: el documento está íntegramente en euskera. La URL «/es/» devuelve el
  mismo PDF en euskera, así que no hay versión castellana oficial localizada:
  las fichas se publican traducidas, con la cita original al lado.
- **BNG**: el documento está en gallego.
- **CC**: el archivo local se llama `canaria.pdf` (antes figuraba como `cc.pdf`).
- **UPN**: su Consejo Político aprobó el 13-oct-2026 concurrir con el PP en
  Navarra; UPN encabeza la lista al Congreso. El programa conjunto no estaba
  publicado a mediados de octubre.
- **PSOE**: el PDF oficial está protegido por Imperva y no se puede descargar
  por HTTP. La copia local se obtuvo de Demócrata el 15-nov; su texto coincide
  con el del documento oficial y la huella sirve para detectar cambios.
- **Frente Amplio**: coalición de IU, Sumar, Comuns, Más Madrid, CHA, Verdes
  Equo y otras formaciones. El PDF oficial pesa 1,1 MB y tiene 151 páginas.

## Pendiente

- Guardar copia archivada (Wayback Machine) de cada PDF y rellenar
  `pdf_archivado` en `data/partidos.json`.
- Revisar si los partidos sustituyen sus PDFs: `scripts/extraer_texto.py` avisa
  cuando cambia el `sha256`.
