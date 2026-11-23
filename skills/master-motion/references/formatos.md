# Formatos

| Id | Tamaño | Uso | Zona segura (`useEscala().zona`) |
|---|---|---|---|
| `vertical` | 1080×1920 | Reels, TikTok, Shorts | 14 % arriba, 20 % abajo, 72 u a los lados |
| `horizontal` | 1920×1080 | YouTube, web, VSL | 80 u arriba y abajo, 120 u a los lados |
| `cuadrado` | 1080×1080 | Feed | 80 u |
| `retrato` | 1080×1350 | Feed de Instagram | 80 u |

30 fps por defecto (`lib/formatos.ts`). Capas con alfa (Blender): PNG RGBA o ProRes 4444 → WebM VP9 con `alpha_mode=1` para `BlenderLayer`.

Verificación de la entrega: `scripts/master.sh` imprime tamaño, fps, duración, LUFS y pico.
