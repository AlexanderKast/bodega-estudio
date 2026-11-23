# Plantilla de ficha de referente

Cada video de referencia tiene su ficha en `referentes/fichas/<id>.md` con estas secciones, en este orden.
Regla de derechos: se resume y se analiza; nunca se copian bloques del video, la transcripción o las skills
(citas de menos de 15 palabras, entre comillas, con su minuto).

```markdown
# <Título del video>

| Campo | Valor |
|---|---|
| Canal | … |
| URL | https://youtu.be/<id> |
| Duración · idioma · fecha | … |
| Tipo | tutorial con IA · masterclass de After Effects · pieza de muestra · explicación |
| Stack | herramientas y modelos que usa (Claude Code / Desktop, Remotion, HyperFrames, AE, Flow, ElevenLabs…) |

## En una frase
Qué enseña y para qué sirve.

## Proceso paso a paso
Numerado, con marcas de tiempo [m:ss]. Qué hace en cada paso y por qué.

## Cómo lo hace (técnica)
- Prompts o instrucciones clave (parafraseados) y cómo da contexto a la IA.
- Motion: curvas, tiempos, stagger, cámara, transiciones, tipografía, textura, sonido.
- Control de calidad: cómo revisa e itera.

## Resultados
Qué se logra (lo que se ve en los cuadros), tiempo y costo reportados, nivel de acabado.
Lo que sale bien y lo que se nota "hecho con IA".

## Limitaciones y errores que muestra

## Recursos citados
Enlaces, repos y skills, con su estado: revisado · bloqueado (login) · no aplica.

## Qué adopta Master Motion
Acciones concretas, cada una con el destino (archivo de `kb/`, preset, script o skill).
Y qué descartamos y por qué.
```
