# Marca

La marca activa es la de **Bodega de Belleza** y no se cambia: `studio/src/marca/marca.json` (colores, fuentes, radios,
logos y reglas) y `marca.ts` (carga de fuentes). Sale del manual oficial (`studio/src/marca/tokens-bodega.json`).

- Fondo negro `#1d1d1b`, texto blanco `#f4f9fc`, acento violeta `#b112e3`, titulares violeta `#c03bfb` (solo 24 px o más).
- Titulares en Impact en MAYÚSCULAS (respaldo Anton, que es la que carga Remotion); texto en Archivo.
- Logos en `studio/public/marca/`: `logo-negativo.svg` sobre oscuro, `logo-positivo.svg` sobre claro,
  `logo-sobre-violeta.svg` sobre violeta. No se redibujan, no se recolorean y no se generan con IA.
- La única luz degradada permitida es la de la flecha del logo (`#7757bd → #c342ff`). Nada de degradados morado-azul genéricos.
- Las reglas de edición medidas en su material (ritmo, subtítulos, zoom, sonido) están en la skill `estilo-bodega`.

Si el manual cambia: copia el nuevo `tokens.json` del repo `bodega-de-belleza/docs/marca/` a `tokens-bodega.json`,
actualiza `marca.json` y corre `node scripts/lint-motion.mjs` (F-01 avisa si una fuente quedó sin cargar).
