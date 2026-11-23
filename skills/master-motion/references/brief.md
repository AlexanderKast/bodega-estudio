# Brief: preguntas y defaults

Un solo mensaje, con AskUserQuestion si está disponible. Lo que no respondan se asume con el default y se dice en una línea.

| Pregunta | Default |
|---|---|
| ¿Qué tiene que entender o sentir quien lo ve? (una idea) | La del pedido, en una línea |
| Tipo de pieza | Tipografía cinética · título/ident · UI · explainer · producto (elige por el pedido). Explainer, VSL o pieza con locución que explica algo → camino completo con guion, storyboard dibujado y animática; el resto → camino corto |
| Estilo base (+ un acento opcional) | Uno de `kb/13-estilos.md` que sirva al mensaje y al formato, con el porqué en una línea; nunca el mismo de la pieza anterior por inercia |
| Género (fija la densidad de eventos) | Anuncio (≤ 0,5 s sin evento) |
| Formato | 9:16 vertical; 16:9 si es para YouTube o VSL |
| Duración | 15–20 s anuncio · 30–45 s explainer · la de la voz si hay voz |
| Voz | Explainer: con voz, y va primero (lectura temporal grabada con el celular hasta que llegue la real). Resto: sin voz; si hay, la graba la persona o ElevenLabs con su voz. Los tiempos salen siempre de `scripts/voz/transcribir.sh` |
| Música | 3 opciones (pista de librería con licencia comercial). Explainer: se elige en la animática. Pieza corta: al final, sobre la imagen terminada |
| Umbral del crítico | Promedio ≥ 4,0 y ningún criterio por debajo de 3 (`umbral_promedio`, `minimo_por_criterio`); se fija aquí, no después de ver el puntaje |
| Marca | `studio/src/marca/marca.json` (Bodega de Belleza) |
| Referencias | Ninguna: se dice y se usa el criterio de `kb/` |
| Texto en pantalla | Se propone en el brief y se aprueba literal |

Datos: cada cifra con su fuente en `studio/src/data/<pieza>.json`.
