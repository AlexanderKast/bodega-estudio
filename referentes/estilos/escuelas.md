# Catálogo de estilos y escuelas de motion (crudo)

Investigación de Master Motion (2026-11-07), base de Bodega Estudio. Propósito: tener un menú de direcciones de arte
para variar las piezas de Bodega de Belleza (redes, anuncios, explainers, VSL, lanzamientos) sin caer siempre en el mismo look.

Cómo leer las fichas:
- **Señales medibles** son rangos de trabajo para arrancar el storyboard, no leyes. Donde un número viene de una fuente
  se cita; el resto es criterio de oficio y hay que medirlo contra la referencia concreta en la puerta 2 (referencias
  medidas) de la skill `master-motion`.
- Los ejemplos tienen URL verificada el 2026-11-07 (la página respondió o apareció indexada con ese título). Son para
  estudiar, no para copiar: cualquier asset de terceros que se use va a `CREDITOS.md`.
- Las fichas no repiten lo que ya está en `kb/` (principios, easing general, anti-look-IA). Solo lo específico del estilo.

## Contexto de tendencias 2025–2026 (resumen de los reportes)

- **Envato, "11 motion design trends shaping 2026"** (ene 2026): hacerlo en post con IA; autenticidad por
  imperfección (cámara en mano, tomas sin pulir); brand films con historia; *craft as luxury* (frame by frame, stop
  motion, lo táctil en campañas premium); actores/dobles con IA; edición nativa de plataforma; fin de las reglas de
  aspect ratio; nostalgia analógica; POV con cámaras vestibles; edición minimalista; *coded motion* (Cavalry,
  generativo, ASCII, física 2D reactiva).
- **Envato, video "AI, craft, and chaos"** (feb 2026): alucinación como estética, documental de marca, craft como lujo,
  *scroll-stopping stunts*, motion programado.
- **Videobolt, "Top Motion Graphics Trends for 2026"** (dic 2025): trazo a mano y frame by frame, texturas analógicas
  (grano, fibra de papel, polvo), papel rasgado con framerate reducido, layouts modulares de collage editorial,
  vidrio y dispersión de luz.
- **It's Nice That, "graphic trends for 2026"**: estética imperfecta y analógica (look de fotocopiadora/Xerox),
  micrográficos utilitarios, logos fluidos tipo mancha, tipografía experimental "pick-and-mix".
- **Creative Bloq, "Texture, warmth and tactile rebellion"** (dic 2025): textura, calidez, lo hecho a mano como
  respuesta a lo generado.
- **Envato, "squishiness"** (jul 2025): el 3D blando/inflado sigue vigente; lo rastrean hasta los idents de BBC Two
  2018 (BBC Creative + Superunion).
- **Behance "Design Trends 2026"**: diseño humanizado, motion como lenguaje de marca primario, micro-interacciones.

Lectura para Master Motion: el viento sopla hacia **lo hecho con decisión humana visible** (textura, trazo, collage,
frame by frame) y hacia **lo programado con sistema** (coded motion). Las dos cosas encajan con un estudio en código:
Remotion es la segunda, y la primera se consigue con texturas reales, framerate en 2s/3s y cortes motivados. Lo que
envejece: el 3D genérico brillante, los degradados morado-azul, el glow neón y el "todo entra a la vez".

---

## 1. Tipografía cinética suiza / brutalista

**Qué es.** La palabra como protagonista: retícula estricta, sans grotesca, alto contraste, el movimiento sale de la
tipografía misma (escala, máscara, tracking, peso variable) y no de adornos. La variante brutalista rompe la retícula a
propósito: tipos gigantes que se salen del cuadro, superposición, crudeza.

**De dónde viene.** Estilo Tipográfico Internacional (Suiza, años 50: Müller-Brockmann, Hofmann), la "nueva tipografía"
de la Bauhaus, y en cine los títulos de Saul Bass (The Man with the Golden Arm 1955, Vertigo 1958 con John Whitney).
Hoy su referente vivo es DIA Studio (Mitch Paone y Meg Donohoe, fundado 2009), que llevó el *kinetic type* al diseño de
marca.

**Señales medibles.**
- Easing: curvas expo/quint muy marcadas (entrada rápida, frenado largo) o cortes duros sin easing en la variante
  brutalista. Nada de ease-in-out suave genérico.
- Duraciones: palabras o bloques de 6–15 frames por cambio en piezas rítmicas; frases clave sostenidas 1–2 s.
- Ritmo: sincronía estricta al beat; una transformación por golpe.
- Stagger: por letra (1–2 frames) o por línea (3–5 frames); nunca todo a la vez.
- Paleta: 1–2 tintas + negro/blanco. Acento plano (rojo, naranja, amarillo).
- Tipografía: grotesca neutra (Helvetica/Neue Haas, Inter Display, Söhne) o variable con ejes de peso/ancho para
  animar. Mayúsculas en titulares, tracking cerrado.
- Textura: ninguna o grano mínimo. La versión brutalista acepta ruido de fotocopia.
- Cámara: 2D, a lo sumo zoom brusco o desplazamiento de la retícula.
- Transiciones: la tipografía es la transición (una letra crece hasta llenar pantalla y se vuelve fondo; máscaras de
  barra a la Bass).
- Sonido: percusivo, clicks y golpes secos alineados a cada cambio.

**Rinde en:** lanzamientos, teasers, intros de marca, anuncios de 6–15 s, frases manifiesto de la marca, VSL en
los bloques de promesa. **No rinde en:** explicaciones largas con mucho dato (fatiga), testimonios, contenido emocional
cálido.

**Cómo se produce.**
- Remotion: es el terreno natural. `spring` con damping alto o `interpolate` con `Easing.bezier` expo; texto partido por
  letra/palabra con stagger por índice; fuentes variables animando `font-variation-settings`; `clipPath` para máscaras.
  Retícula definida como constantes de layout, no a ojo.
- AE: Text Animators por rango (Offset/Selector), expresiones de stagger, plugin de fuentes variables nativo (AE 2023+).
- Truco DIA (descrito por la comunidad): rampa con Posterize dentro de un precomp para controlar por bandas qué letras
  se mueven, y desplazamiento por valores en lugar de keyframes sueltos.

**Ejemplos.**
- DIA Studio, portafolio: https://www.dia.studio/
- It's Nice That sobre DIA y su tipografía en flujo: https://www.itsnicethat.com/features/dia-mitch-paone-meg-donohoe-graphic-design-animation-typography-180918
- Saul Bass, títulos de Vertigo (Art of the Title): https://www.artofthetitle.com/title/vertigo/

**Tells de barato/IA.** Retícula inexistente (texto centrado por defecto), fuentes de plantilla (Bebas/Montserrat en
todo), todas las palabras entrando con el mismo bounce, kerning roto al escalar, sombras paralelas, contorno neón. En la
brutalista: "caos" sin intención, sin una jerarquía legible en el primer segundo.

---

## 2. Editorial-documental (Vox / Johnny Harris)

**Qué es.** Explainer periodístico: narración en off, evidencia visual en pantalla (documentos, recortes de prensa,
fotos de archivo, mapas), collage sobre texturas de papel y una línea de color de acento que señala lo importante.

**De dónde viene.** El equipo de video de Vox.com (series como Borders, presentada por Johnny Harris, nominada al Emmy,
y Earworm de Estelle Caswell). Harris lo llevó a su canal propio. Su principio, en palabras de Caswell en School of
Motion: la prioridad es siempre la evidencia visual.

**Señales medibles.**
- Easing: suave y motivado; empujes de cámara lentos (ease-in-out largo de 2–4 s). Lo único rápido son los "snaps" de
  un recorte que aparece.
- Duraciones: planos de 3–6 s; un mapa puede sostenerse 8–12 s con movimiento continuo.
- Ritmo: 10–20 cortes por minuto; el corte lo dicta la narración, no la música.
- Stagger: los nombres de lugar aparecen cuando el narrador los dice, no todos a la vez (lo señala también la guía de
  MotionVid sobre el estilo).
- Paleta: base apagada (papel, sepia, gris cálido) + **un** color de acento (rojo, amarillo marcador) que hace todo el
  trabajo.
- Tipografía: serif editorial para titulares/citas, sans o máquina de escribir para etiquetas; subrayados y resaltados
  dibujados.
- Textura: papel escaneado, pliegues, sombras de objetos sobre una mesa, grano fílmico.
- Cámara: 2.5D, *push-in* hacia lo que se va a nombrar; paralaje leve entre capas del collage.
- Transiciones: el mapa como hilo conductor (zoom out del lugar, zoom in al siguiente), barridos de papel, *match cuts*
  de documento a documento.
- Sonido: música ambiental baja, SFX de papel, plumón, sellos, clic de pin.

**Rinde en:** explainers de producto, "cómo funciona X", noticias, VSL largos en el tramo de
"por qué pasa esto". **No rinde en:** anuncios de 6 s, lanzamientos de producto brillante, contenido aspiracional.

**Cómo se produce.**
- AE: GEOlayers 3 para mapas con datos reales; Google Earth Studio para vuelos; capas de papel con modos de fusión.
  El propio Harris tiene un video de su flujo de mapas.
- Remotion: mapas en SVG/GeoJSON (d3-geo) con trazo animado (`strokeDashoffset`), pins con sombra, overlays de textura
  como imagen fija con `mix-blend-mode: multiply`. Recortes de documento como `<Img>` con rotación leve y sombra.
- Blender: mesa con documentos reales para tomas 3D ocasionales (luz de lámpara, DOF corto).

**Ejemplos.**
- Johnny Harris, canal: https://www.youtube.com/johnnyharris
- Johnny Harris, "How I Make My Maps": https://www.youtube.com/watch?v=GsojLuJpe_0
- Estelle Caswell (Vox Earworm) en el podcast de School of Motion: https://schoolofmotion.com/blog/estelle-caswell-vox-podcast

**Tells de barato/IA.** Mapas con fronteras inventadas o costas deformes (típico de mapas generados), etiquetas de
texto renderizadas por IA con faltas, stock genérico en vez de evidencia, todos los recortes con la misma rotación y
sombra, "textura de papel" en loop visible, música épica que contradice el tono periodístico.

---

## 3. Edición de retención tipo creators (MrBeast / Hormozi)

**Qué es.** Edición al servicio de que nadie se vaya: cero aire, cortes en cada énfasis, *punch-ins* digitales,
captions palabra por palabra, SFX en cada golpe visual, gráficos que ilustran literalmente lo que se dice.

**De dónde viene.** YouTube y Shorts desde ~2018. Dos ramas: MrBeast (espectáculo, primer minuto como estructura
crítica, según su documento interno de onboarding filtrado en 2024) y Alex Hormozi (talking head de negocio con
captions grandes).

**Señales medibles.**
- Cortes: plano medio cada 1–3 s en Hormozi; se eliminan pausas y muletillas (análisis de Choppity sobre sus Shorts).
- Zoom: *punch-ins* digitales de 10–20 % para énfasis, alternando medio y primer plano (mismo análisis).
- Captions: 1–3 palabras a la vez, MAYÚSCULAS, sans heavy condensada (Anton, Montserrat Black, The Bold Font), contorno
  o sombra gruesa, palabra activa en color (amarillo en Hormozi), pop-in con escala leve (Exemplary AI y Choppity).
- Easing: pops de 3–6 frames con overshoot pequeño; zooms instantáneos (corte) o de 4–8 frames.
- Paleta: fondo oscuro en Hormozi; MrBeast saturado y luminoso.
- Sonido: whoosh en cada transición, *pop* en cada caption de énfasis, *riser* antes de la revelación, música que cambia
  por bloque.
- Estructura: gancho en el primer frame, sin intro ni logo; el documento de MrBeast insiste en el primer minuto.

**Rinde en:** Reels/Shorts/TikTok de Bodega, clips de podcast, anuncios UGC, cortes de VSL para tráfico frío.
**No rinde en:** piezas de marca premium, lanzamientos de producto con estética cuidada, explainers que necesitan que el
espectador piense (la sobrecarga mata la comprensión).

**Cómo se produce.**
- Remotion: captions desde la transcripción de Whisper (timestamps por palabra) → componente que muestra una ventana de
  1–3 palabras con la activa resaltada; `scale` con `spring` corto. Punch-ins como cambio de `transform: scale` en el
  frame exacto del énfasis. SFX como `<Audio>` disparados por la misma lista de eventos.
- Premiere/Descript para el corte de silencios; luego captions en Remotion para control fino.
- Regla de oficio: el caption va en la zona segura (ver ficha 4), nunca sobre la cara.

**Ejemplos.**
- Análisis del estilo Hormozi (cortes, zoom, captions): https://www.choppity.com/tools/recreate-video-editing-style/alex-hormozi/
- Qué hace "Hormozi captions" y errores que lo abaratan: https://exemplary.ai/blog/alex-hormozi-captions
- "How to Succeed in MrBeast Production" comentado por Simon Willison: https://simonwillison.net/2024/Sep/15/how-to-succeed-in-mrbeast-production/

**Tells de barato/IA.** Captions desfasados del audio (el error número uno), plantilla de CapCut idéntica a la de mil
cuentas, emoji en cada línea, zooms con keyframe lineal que "flotan", SFX de librería gratuita repetidos, captions que
tapan la boca, todo resaltado (si todo es amarillo nada lo es).

---

## 4. Motion nativo 9:16

**Qué es.** No es un reencuadre de un 16:9: es diseñar para un teléfono en la mano, con la interfaz de la plataforma
encima. La composición es vertical por bloques, el texto vive en una franja segura y el sujeto ocupa el centro alto.

**De dónde viene.** TikTok (feed infinito vertical desde 2018), después Reels y Shorts. Envato 2026 lo lista como
"platform-first editing" y "el fin de las reglas de aspect ratio".

**Señales medibles.**
- Lienzo 1080×1920. Entre 25 % y 35 % de la pantalla queda tapada por la UI (od2.in, simulador de zonas seguras 2026).
- Márgenes de referencia para TikTok: ~180 px arriba, ~380 px abajo, ~140 px a la derecha (botones). Meta pide dejar
  bordes superior, inferior y laterales libres de texto y logos en Stories/Reels.
- Texto: titulares en el tercio medio-alto; tamaño mínimo legible ~48–60 px en 1080 de ancho para captions.
- Ritmo: el primer cambio visual antes de 1 s; un evento nuevo cada 1,5–3 s.
- Cámara: movimientos verticales (tilt, scroll) se sienten nativos; los paneos horizontales largos no.
- Transiciones: *swipe* vertical, apilado de tarjetas, split arriba/abajo.
- Sonido: pensado para verse en mudo (captions siempre) y para golpear con audio.

**Rinde en:** todo lo social de Bodega, anuncios Meta/TikTok, teasers de lanzamiento. **No rinde en:** VSL de
escritorio, explainers con gráficas anchas (timelines, mapas horizontales) que piden 16:9 o 1:1.

**Cómo se produce.**
- Remotion: componer cada pieza con una constante de *safe area* por plataforma y un overlay de guía que se activa solo
  en el Studio (no en render). Variantes 9:16 / 1:1 / 16:9 como composiciones distintas que comparten escenas, no un
  `scale` del 16:9.
- AE: overlays PNG de zonas seguras como capa guía.
- Zack D. Films es el ejemplo de formato que nace vertical: 3D simple, un plano fuerte, narración en off y texto
  centrado arriba.

**Ejemplos.**
- Simulador de zonas seguras Reels/TikTok/Shorts 2026: https://od2.in/reels-safe-zone
- Meta, zona segura para anuncios en Stories y Reels: https://www.facebook.com/business/help/980593475366490
- Zack D. Films (Shorts verticales 3D): https://www.youtube.com/@zackdfilms

**Tells de barato/IA.** 16:9 con barras borrosas arriba y abajo, texto pegado al borde inferior (queda bajo el nombre
de usuario), logo en la esquina superior derecha (lo tapa la UI), composición centrada en el medio exacto que deja el
tercio superior vacío, subtítulos de 2 líneas largas.

---

## 5. Collage / mixed media / papel rasgado

**Qué es.** Fotos recortadas, papel, cinta, texturas de revista, video dentro de recortes, todo ensamblado a la vista.
La animación es a saltos: piezas que entran a framerate reducido, papel que se rasga para revelar la siguiente escena.

**De dónde viene.** Dadá y el fotomontaje (Hannah Höch, John Heartfield), Terry Gilliam en Monty Python, el zine punk.
En video actual: videoclips de Winston Hacking (Corridor, "Jump Cut", Vimeo Staff Pick), el layout modular editorial que
Videobolt marca para 2026, y el "pick-and-mix" de It's Nice That.

**Señales medibles.**
- Framerate de animación: piezas en 2s o 3s (12 u 8 fps dentro de un timeline de 24/25), "más táctil y entrecortado"
  (Videobolt).
- Easing: casi ninguno; *pose to pose* con 1–2 frames de anticipación. La suavidad delata lo digital.
- Duraciones: escenas de 1–3 s en videoclip; 3–5 s en explainer.
- Stagger: las piezas entran de una en una con 2–4 frames de separación, como colocadas a mano.
- Paleta: la que traen las fotos + 1–2 tintas planas de unión (rojo, azul klein, amarillo).
- Tipografía: letras recortadas de revista, tipo de máquina, rotulación a mano. Mezcla controlada (máximo 3 familias).
- Textura: bordes de papel reales escaneados, sombras de contacto, grano, cinta adhesiva.
- Cámara: plano cenital fijo con pequeñas sacudidas; paralaje ligero.
- Transiciones: rasgado, tapado con otra hoja, *stop motion* de piezas que se barren.
- Sonido: papel, tijera, cinta; foley real.

**Rinde en:** contenido de marca personal con opinión, explainers culturales, anuncios que quieren verse "no IA",
lanzamientos con carácter, separadores de VSL. **No rinde en:** SaaS corporativo, producto premium minimal, datos
precisos.

**Cómo se produce.**
- Remotion: piezas como PNG con alfa recortadas a mano (o con rembg en el servidor y luego bordes de papel reales
  encima), posición cuantizada a cada 2–3 frames (`Math.floor(frame / 2) * 2`) para el look de stop motion, rotaciones
  aleatorias con semilla fija por pieza.
- AE: Posterize Time por capa, mattes con texturas de papel rasgado.
- Fuente física: escanear 20–30 bordes de papel y cintas una vez y reutilizarlos en `studio/src/marca/` como kit.

**Ejemplos.**
- Corridor, "Jump Cut" (dir. Winston Hacking): https://www.youtube.com/watch?v=6_TQzYnWpn0
- Colossal sobre el videoclip: https://www.thisiscolossal.com/2025/04/corridor-jump-cut/
- Videobolt, papel rasgado y layouts modulares 2026: https://blog.videobolt.net/post/top-motion-graphics-trends-2026

**Tells de barato/IA.** Bordes de recorte perfectos (vector) fingiendo papel, plugins de "paper stack" aplicados encima
de todo, piezas moviéndose con interpolación suave a 25 fps, texturas que se repiten en tile, collage sin jerarquía
(diez cosas, ningún foco).

---

## 6. Cel / frame by frame / rotoscopia (incluye doodle sobre video)

**Qué es.** Animación dibujada cuadro a cuadro: personajes, efectos (humo, chispas, smears) y transiciones dibujadas.
La rotoscopia calca sobre video real. El *doodle* sobre video añade trazos animados encima de una toma real (flechas,
contornos, garabatos que reaccionan a lo que pasa).

**De dónde viene.** Animación tradicional en acetato (Disney, Fleischer), rotoscopia de Max Fleischer (1915), A-ha
"Take On Me" para la mezcla con live action. Hoy estudios como Ordinary Folk, Golden Wolf y BUCK lo mantienen en
publicidad; Envato y Videobolt lo marcan como "craft as luxury" y "hand-drawn visuals" para 2026.

**Señales medibles.**
- Framerate de dibujo: en 2s (12 dibujos/s) por defecto; 1s solo en acciones rápidas; 3s para un look más crudo.
- Easing: lo dan los espaciados de los dibujos (*slow in/out* con dibujos intermedios más juntos), no curvas.
- Smears y multiples en movimientos de 1–3 frames.
- Línea "hirviendo" (*boil*): 2–3 versiones del mismo dibujo en loop a 8–12 fps para que lo quieto respire.
- Paleta: limitada, 4–6 colores planos + 1 sombra.
- Textura: línea con presión variable, grano de papel o lápiz.
- Cámara: generalmente fija; los movimientos se dibujan.
- Doodle sobre video: trazos blancos o de un color, 2–4 px, que aparecen dibujándose (*write-on*) en 6–12 frames y se
  quedan hirviendo.
- Sonido: SFX cartoon dosificados, *whooshes* de dibujo.

**Rinde en:** explainers con personaje, anuncios con humor, intros de marca, momentos de énfasis en talking heads de El
Master IA (doodle), contenido que quiere decir "esto lo hizo una persona". **No rinde en:** producción con plazos de
horas (es caro), producto premium realista.

**Cómo se produce.**
- No es terreno de código puro. Dibujar en Procreate Dreams, Toon Boom, TVPaint, Clip Studio o Animate; exportar
  secuencias PNG; montar en Remotion con `<Img>` por frame o `<OffthreadVideo>` con alfa.
- Híbrido barato que sí funciona: *boil* en Remotion aplicando un `feTurbulence` + `feDisplacementMap` con semilla que
  cambia cada 2–3 frames sobre trazos SVG, más `strokeDashoffset` para el write-on.
- Rotoscopia: segmentación en el servidor (rembg/SAM) para máscaras de referencia, luego calco a mano.

**Ejemplos.**
- Ordinary Folk, estudio: https://www.ordinaryfolk.co/
- Golden Wolf, estudio: https://goldenwolf.tv/
- MoMA, "How to Make Hand-Drawn Animation" (straight-ahead y keyframing): https://www.youtube.com/watch?v=9ytf-Ujpr9g

**Tells de barato/IA.** Interpolación digital suave entre dos dibujos (morph en vez de dibujos intermedios), línea con
grosor constante perfecto, "boil" ausente o idéntico en todo, filtros de "cartoon" sobre video, rotoscopia generada que
cambia de cara entre frames.

---

## 7. Anime-inspired

**Qué es.** Lenguaje del anime japonés aplicado a motion: impactos con líneas de velocidad, *smear frames*, encuadres
dramáticos, fondos pintados, cortes de cámara bruscos, efectos (destellos, polvo, energía) dibujados.

**De dónde viene.** Estudios japoneses (Kanada Yoshinori y la escuela "sakuga" de efectos, Trigger, A-1 Pictures).
Referencia occidental: Porter Robinson & Madeon, "Shelter" (A-1 Pictures, 2016). En publicidad, Golden Wolf lo mezcla
con 2D occidental.

**Señales medibles.**
- Framerate en 2s y 3s, con 1s en los impactos; *holds* largos (12–24 frames) seguidos de acción explosiva.
- Easing: contraste extremo; quietud total → 3–4 frames de movimiento → quietud.
- Encuadres: contrapicados, primerísimos planos de ojos, planos detalle en los golpes.
- Efectos: líneas de velocidad radiales, flashes de 1–2 frames en blanco o color, cámara que tiembla 4–8 frames.
- Paleta: cel con sombras duras de 1–2 tonos; fondos pintados con gradiente atmosférico.
- Tipografía: onomatopeyas o títulos grandes, a veces en japonés estilizado (cuidado con usarlo sin sentido).
- Sonido: golpes muy secos, silencio antes del impacto, *whoosh* metálico.

**Rinde en:** lanzamientos con energía, anuncios a público joven/gamer, momentos de "revelación" en un video. **No
rinde en:** contenido corporativo serio, explainers de datos, piezas de autoridad.

**Cómo se produce.**
- Dibujo cuadro a cuadro (ficha 6) para lo principal.
- Remotion/AE para lo que es gráfico: líneas de velocidad (SVG radial con dash animado), flashes (capas sólidas de 1–2
  frames), *camera shake* con ruido de semilla fija, holds y cortes al frame.
- Blender: Grease Pencil para efectos 2D sobre cámara 3D; *toon shader* con 2 tonos y contorno (Freestyle o Line Art).

**Ejemplos.**
- Porter Robinson & Madeon, "Shelter" (A-1 Pictures): https://www.youtube.com/watch?v=fzQ6gRAEoy0
- Golden Wolf, canal: https://www.youtube.com/@golden_wolf

**Tells de barato/IA.** Filtro "anime" sobre video real (parpadeo de rasgos entre frames), todo a 24 fps fluido (pierde
el *timing* del estilo), líneas de velocidad en todos los planos, ojos enormes genéricos sin dirección de personaje,
fondo generado con perspectiva imposible.

---

## 8. Liquid & morph (blobs, fluidos, vidrio)

**Qué es.** Formas que se funden, gotean, se estiran y se transforman unas en otras; transiciones donde un color "se
derrama" sobre el siguiente. La variante 2026 suma vidrio translúcido y dispersión de luz.

**De dónde viene.** El *morphing* de los 90 (videoclip "Black or White"), el motion 2D vectorial de los 2010 popularizado
por tutoriales (Ben Marriott y otros), y hoy los logos fluidos/"blotch" (It's Nice That 2026) y el vidrio con
dispersión que Videobolt ve volver.

**Señales medibles.**
- Easing: overshoot y *follow-through* claros; las formas llegan, se pasan y se asientan. Springs de damping medio.
- Duraciones: transiciones de 12–24 frames; loops de 2–4 s.
- Ritmo: 1 transformación por idea; sostener la forma ya asentada al menos 1 s.
- Paleta: 2–4 colores planos con alto contraste entre sí; en vidrio, fondos oscuros o neutros para que la refracción se
  lea.
- Textura: limpia en 2D; en vidrio, aberración cromática sutil y desenfoque detrás.
- Cámara: 2D; en vidrio, 3D con DOF.
- Transiciones: *liquid wipe*, gotas que crecen y llenan pantalla, un logo que se derrite en el siguiente.
- Sonido: *swooshes* húmedos, burbujas, sintes con glide.

**Rinde en:** intros de marca, transiciones entre bloques, anuncios de producto (bebidas, cosmética, apps), logos.
**No rinde en:** contenido serio o periodístico, piezas con mucho texto (las formas compiten con la lectura).

**Cómo se produce.**
- AE: el clásico *gooey* con Fast Box Blur + Simple Choker (o Levels sobre el alfa) sobre capas de forma; Wave Warp y
  Turbulent Displace para goteo.
- Remotion: el mismo truco en SVG (`feGaussianBlur` + `feColorMatrix` sobre el alfa) con círculos animados por
  `spring`; morph entre paths con flubber o paths de igual número de puntos.
- Blender: metaballs o simulación de fluidos (Mantaflow) para tomas 3D; vidrio con Principled BSDF transmisión 1,
  dispersión si se usa Cycles. Render en servidor.

**Ejemplos.**
- Tutorial de flujo "Animating a Liquid Reveal in After Effects": https://www.youtube.com/watch?v=geBX861h8K4
- It's Nice That, logos fluidos y "blotch" en 2026: https://www.itsnicethat.com/features/forward-thinking-graphic-trends-2026-graphic-design-120126
- Videobolt, vidrio y dispersión 2026: https://blog.videobolt.net/post/top-motion-graphics-trends-2026

**Tells de barato/IA.** Blobs flotando sin propósito de fondo, degradado morado-azul "líquido" (el tell IA por
excelencia), morph que pasa por formas intermedias feas porque los paths no tienen correspondencia, vidrio con
reflejos de HDRI genérico, todo moviéndose siempre (sin momentos de reposo).

---

## 9. Isométrico

**Qué es.** Ilustración en proyección isométrica (sin punto de fuga, ejes a 30°): sistemas, ciudades, flujos de datos,
"cómo funciona por dentro". Ordena complejidad sin el costo de 3D realista.

**De dónde viene.** Dibujo técnico e ingeniería, videojuegos de los 80–90 (SimCity 2000), la ilustración tech de los
2010. Sigue vigente en SaaS, fintech y enterprise según los estudios que lo venden (Kasra Design).

**Señales medibles.**
- Ángulo: 30° exactos (o dimétrico 2:1 para pixel art). Mezclar ángulos rompe el estilo al instante.
- Easing: ease-out cortos; objetos que "caen" a su sitio con un rebote pequeño (overshoot 5–10 %).
- Duraciones: construcción de escena 2–4 s; cada elemento 8–15 frames.
- Stagger: de atrás hacia adelante o en el orden del flujo que se explica, 3–6 frames.
- Paleta: 3 tonos por material (cara superior clara, izquierda media, derecha oscura) + 1 acento para lo que importa.
- Tipografía: sans geométrica, etiquetas planas o también en isométrico (si se proyectan, todas igual).
- Cámara: fija o paneo lateral; zoom suave hacia el sub-sistema.
- Transiciones: zoom a un edificio que se convierte en la siguiente escena; corte de sección.
- Sonido: clics suaves, *pops* de construcción, música tech ligera.

**Rinde en:** explainers de software de IA Master Tech, "cómo funciona tu automatización", diagramas de flujo de
n8n/agentes, onboarding. **No rinde en:** contenido emocional, marca personal, anuncios de impacto.

**Cómo se produce.**
- Remotion: matriz isométrica en CSS (`rotateX(60deg) rotateZ(-45deg)` sobre un plano) o mejor SVG con coordenadas
  ya proyectadas (función `iso(x,y,z)`); construir escenas como datos (lista de bloques) y animarlas por índice.
- Blender: cámara ortográfica con rotación 54,736° / 45°; render en servidor y composición en Remotion. Da sombras y
  oclusión reales a bajo costo.
- AE: plantillas de rejilla isométrica + capas de forma.

**Ejemplos.**
- Kasra Design, 15 explainers isométricos 2026: https://www.kasradesign.com/top-15-isometric-animation-samples-our-picks/
- Tutorial "Isometric Motion Design for Tech" (After Effects): https://www.youtube.com/watch?v=cGP1UxRZh8s

**Tells de barato/IA.** Ángulos que no casan entre objetos (muy típico de ilustración generada), sombras en direcciones
distintas, ciudades de stock genéricas con personajes planos de plantilla, neón azul sobre blanco en todo, todo
animando a la vez.

---

## 10. Data viz animada

**Qué es.** Gráficas y números que cuentan una historia: barras, líneas, mapas de puntos, unidades que se acumulan (un
punto = una persona). El movimiento revela la comparación en el orden en que se entiende.

**De dónde viene.** Hans Rosling (Gapminder), el periodismo de datos, Neil Halloran ("The Fallen of World War II",
2015, documental "data-driven" escrito, codificado y narrado por él) y The Pudding, que colaboró con Vox Earworm.

**Señales medibles.**
- Easing: ease-in-out medio en crecimiento de barras (cubic); los contadores numéricos con ease-out para que los
  últimos dígitos se lean.
- Duraciones: cada gráfica se construye en 1–2 s y se sostiene al menos 2–3 s para leerla.
- Ritmo: un dato por plano; 6–12 cambios por minuto en explainers.
- Stagger: por serie o por categoría, 2–4 frames; en "unidades", por filas.
- Paleta: neutra de base + 1 color para la serie protagonista; paletas secuenciales/divergentes validadas.
- Tipografía: números tabulares (tnum) para que no bailen; sans legible.
- Cámara: 2D con zoom a la porción relevante; 2.5D en Halloran (cámara recorriendo una barra gigante).
- Transiciones: la gráfica se transforma en la siguiente (barra → punto en mapa); escala que cambia con animación.
- Sonido: discreto; un tono o golpe cuando aparece la cifra clave.

**Rinde en:** explainers con datos de IA, VSL en la parte de prueba, reportes, contenido de autoridad.
**No rinde en:** teasers sin datos, anuncios de 6 s (no da tiempo a leer).

**Cómo se produce.**
- Remotion: es el mejor lugar. d3-scale/d3-shape para escalas y paths; datos reales en JSON; `interpolate` de valores,
  no de píxeles. Contadores con formato `Intl.NumberFormat('es')`. La skill `dataviz` del entorno tiene paleta y
  reglas de marcas.
- AE: Data-driven animation con JSON/CSV, o plugins de gráficas.
- Blender: barras/volúmenes 3D desde CSV con Geometry Nodes cuando la escala física importa (estilo Halloran).

**Ejemplos.**
- Neil Halloran, "The Fallen of World War II" (sitio): https://www.neilfilms.com/ww2/
- El mismo en YouTube: https://www.youtube.com/watch?v=DwKPFT-RioU

**Tells de barato/IA.** Ejes sin escala o que no empiezan en cero sin avisarlo, números inventados, 3D decorativo que
distorsiona la comparación, colores arcoíris sin significado, contadores que terminan en un número distinto al que se
dice en off, gráficas que desaparecen antes de poder leerse.

---

## 11. Analógico: glitch / VHS / datamosh

**Qué es.** El error como textura: líneas de escaneo, sangrado de color, tracking de VHS, compresión rota (datamosh:
los píxeles de un plano arrastrados por el movimiento del siguiente), CRT con curvatura.

**De dónde viene.** Video arte (Nam June Paik), la estética VHS de los 80–90, el glitch art de los 2000 y el datamosh en
videoclips (Kanye West, "Welcome to Heartbreak", dir. Nabil, 2009). Envato 2026: "analog nostalgia" y "hallucination
as aesthetic".

**Señales medibles.**
- Elegir **una época** y una fuente de error (VHS, CRT, MPEG roto), no todas.
- Glitch: eventos de 2–6 frames, nunca continuos; separación RGB de 2–8 px; desplazamiento horizontal por bandas.
- VHS: grano + scanlines suaves, ruido de croma, leve inestabilidad vertical (1–2 px), timestamp tipo cámara.
- Datamosh: 1–3 s de arrastre en una transición clave, no todo el video.
- Paleta: saturación desplazada (rojos que sangran), negros levantados.
- Tipografía: monoespaciada/OSD de cámara, VCR OSD Mono; o pixelada.
- Sonido: ruido de cinta, *wow & flutter*, clics digitales en cada glitch, silencio cortado.

**Rinde en:** contenido de tecnología con tono crítico ("lo que la IA rompe"), teasers misteriosos, música, momentos de
"error" en una narrativa. **No rinde en:** marca premium, explainers donde hay que leer texto (el glitch lo destruye),
contenido de confianza (finanzas, salud).

**Cómo se produce.**
- Remotion: separación RGB con tres copias de la capa y `mix-blend-mode: screen` desplazadas; bandas con `clipPath`
  cuantizado; texturas de VHS reales (grabadas o con licencia) como overlay. Eventos de glitch en frames concretos,
  con semilla fija para que el render sea determinista.
- Datamosh real: quitar I-frames con ffmpeg/avidemux en el servidor y traer el resultado como video; los plugins lo
  imitan peor.
- AE: Data Glitch, VC Color Vibrance, o plugins de VHS; Pixel Sorter.

**Ejemplos.**
- Kanye West, "Welcome to Heartbreak" (Vimeo de Nabil): https://vimeo.com/4578366
- Envato, tendencias 2026 (analog nostalgia, hallucination as aesthetic): https://elements.envato.com/learn/motion-design-trends

**Tells de barato/IA.** Glitch encendido de principio a fin, preset de "VHS" con el mismo patrón repetido, mezclar VHS
con CRT y pixel art y cromo en la misma pieza, glitch sobre un logo nítido en 4K (época incoherente), audio limpio
debajo de imagen "rota".

---

## 12. Risografía y texturas de impresión

**Qué es.** El look de la impresora risográfica: tintas planas fluorescentes que se superponen (sobreimpresión),
registro ligeramente desfasado, grano o trama de semitono, papel visible. En motion: cada frame parece impreso.

**De dónde viene.** Riso (duplicadora japonesa de stencil, años 80), adoptada por zines y estudios independientes. Hoy
se cruza con la estética Xerox/fotocopia que It's Nice That marca para 2026; hay animadores que imprimen cada frame en
riso y lo escanean.

**Señales medibles.**
- Paleta: 2–3 tintas riso (rosa fluorescente, azul medio, amarillo, verde) + papel crudo. La mezcla nace de
  `multiply`, no de colores nuevos.
- Registro: desfase de 1–4 px entre tintas que puede variar por frame (vivo) o quedarse fijo.
- Trama: grano tipo "grain touch" o semitono de puntos visibles (los dos modos reales de la riso).
- Framerate: 8–12 fps (en 2s/3s); cada frame con el grano distinto.
- Tipografía: grotescas pesadas o serif con carácter; a veces letras impresas con relleno parcial.
- Cámara: plana; sin 3D.
- Sonido: cálido, lo-fi, un poco de ruido de impresora como gesto.

**Rinde en:** marca personal con carácter, carruseles animados, contenido cultural, anuncios que quieren verse
artesanales, portadas animadas. **No rinde en:** producto tecnológico premium, datos finos (la trama se come los
detalles), pantallas de app que deben leerse.

**Cómo se produce.**
- Remotion: separar la ilustración en capas por tinta (SVG o PNG en escala de grises), teñir cada capa con su tinta y
  combinar con `mix-blend-mode: multiply` sobre papel; desfase de registro con `translate` pequeño por capa y semilla
  por frame; trama con un patrón de semitono SVG o un shader de grano. Cuantizar el tiempo a 2–3 frames.
- AE: Overprint con modos Multiply, CC Ball Action/Color Halftone para trama, Posterize Time.
- Real: imprimir los frames clave en una riso y escanear (lo hacen las piezas de Vimeo citadas).

**Ejemplos.**
- "Animating with RISO" (frames impresos en risógrafo): https://vimeo.com/767605555
- "RISO animations" (impresión de frames, escaneo y re-animación): https://vimeo.com/833258814
- Friends & Neighbors, grain touch vs semitono en riso: https://www.friendsandneighborssf.com/print-textures

**Tells de barato/IA.** Filtro "riso" de un clic encima de una ilustración con degradados (la riso no hace degradados
suaves), tintas que no son colores riso reales, registro desfasado igual en todos los elementos y frames, grano fijo
que no cambia (se ve como vidrio sucio).

---

## 13. 3D soft / squishy / clay / inflado

**Qué es.** Objetos 3D blandos que se aplastan, inflan, rebotan y se pegan; materiales mate tipo arcilla, goma o
caucho; colores pastel o saturados planos. Lo táctil traducido a 3D.

**De dónde viene.** Plastilina y *claymation* (Aardman), el "inflate" de Cinema 4D y los *soft bodies* de Houdini. Envato
lo rastrea hasta los idents de BBC Two de 2018 (BBC Creative + Superunion), y lo ve vivo en 2025 con artistas de Houdini
y C4D.

**Señales medibles.**
- Easing: *squash & stretch* exagerado; rebotes amortiguados (springs de damping bajo-medio, 2–3 rebotes visibles).
- Duraciones: loops de 2–6 s; un impacto de 6–10 frames con 12–20 frames de asentamiento.
- Materiales: subsurface o roughness alto (0,5–0,8), sin reflejos espejo; en clay, huellas y microimperfecciones.
- Luz: estudio suave (softbox grande), sombras de contacto, AO; fondos de color sólido.
- Paleta: 3–4 colores saturados o pastel coordinados; fondo complementario.
- Cámara: fija o *dolly* lento; lente media (50–85 mm) para que las formas no se deformen.
- Transiciones: un objeto que se infla hasta llenar el cuadro; caída de piezas que se apilan.
- Sonido: *squish*, globos, goma, *boing* contenido; foley real mejor que librería.

**Rinde en:** marca con humor, apps de consumo, anuncios de producto amable, stickers animados, intros de canal, explicar
conceptos abstractos de IA con objetos simpáticos. **No rinde en:** temas serios (finanzas de riesgo, salud grave),
lujo, periodismo.

**Cómo se produce.**
- Blender (servidor): Cloth con presión para inflar, Soft Body, o Geometry Nodes con desplazamiento animado; Shape Keys
  para squash & stretch controlado (más predecible que simular). Cycles con denoise, EEVEE para pruebas.
- Remotion: no hace el 3D; compone el render (EXR/PNG) con tipografía y timing. Para casos simples, React Three Fiber
  dentro de Remotion con materiales mate y escala animada por `spring`.
- Houdini/C4D son el estándar del oficio (Vellum, Inflate), fuera del stack actual.

**Ejemplos.**
- Envato, por qué "squishiness" es tendencia en 3D y motion: https://elements.envato.com/learn/squishy-3d-trend
- BBC Two "Curve" idents (Wikipedia, con la lista de idents): https://en.wikipedia.org/wiki/BBC_Two_%22Curve%22_idents
- Transform Magazine sobre los idents de BBC Creative y Superunion: http://www.transformmagazine.net/articles/2018/bbc-creative-and-superunion-launch-new-idents-for-bbc-two/

**Tells de barato/IA.** Plástico brillante genérico con HDRI de estudio por defecto, personajes 3D "estilo Pixar" de
generador, formas que se deforman sin conservar volumen, rebotes lineales sin asentamiento, fondo degradado
morado-azul, todo el mismo material.

---

## 14. Producto 3D premium / estilo Apple keynote

**Qué es.** El producto como joya: macro de materiales, luz de recorte que dibuja aristas, cámara que orbita despacio,
fondo negro o gris profundo, tipografía mínima con mucho aire, y gráficos de interfaz limpios que salen del producto.
El keynote suma *match cuts* de producto real a plano técnico y titulares de una línea.

**De dónde viene.** Los films de producto de Apple (y su escuela: estudios como BUCK y equipos internos) y la
fotografía de producto de lujo. Los eventos de Apple son su vitrina continua.

**Señales medibles.**
- Easing: muy suave y largo (ease-in-out de 2–5 s en cámara); entradas de texto con ease-out expo corto y desenfoque
  de movimiento.
- Duraciones: planos de producto de 2–4 s; titulares sostenidos 1,5–3 s.
- Ritmo: lento en la revelación, acelera en el montaje de funciones (cortes cada 0,5–1 s al beat).
- Stagger: casi nulo en texto (una línea entra completa con *fade + slide* de 10–20 px).
- Paleta: negro/gris profundo, el color del producto como único color, blancos limpios.
- Tipografía: una sola familia (SF Pro en Apple; equivalente: Inter, Söhne, General Sans), peso semibold en titulares,
  tamaño grande, sin efectos.
- Textura: ninguna; nitidez total, profundidad de campo controlada.
- Cámara: órbitas lentas, *push-ins*, macro con DOF corto, *rack focus*.
- Transiciones: *match cut* de forma, el producto gira y revela el siguiente ángulo, fundido a negro.
- Sonido: música con pulso, silencios antes de la revelación, *whoosh* muy sutil; voz en off calmada.

**Rinde en:** lanzamientos de producto/software de IA Master Tech, demos de app, el cierre de un VSL, anuncios de marca
seria. **No rinde en:** contenido de creator rápido, humor, explainers con mucha información (es un estilo de deseo, no
de explicación).

**Cómo se produce.**
- Blender (servidor): modelo limpio con biseles reales (la luz de recorte vive en los biseles), iluminación de 3 puntos
  con áreas grandes + rim, HDRI oscuro solo para reflejos, Cycles con motion blur. La skill `blender-*` del repo ya
  cubre teléfono y MacBook.
- Remotion: la parte gráfica (titulares, UI que sale de la pantalla, specs) con capturas reales de la app, no maquetas
  inventadas; `filter: blur()` animado en entradas de texto.
- AE: Element 3D o renders de Blender + tipografía.

**Ejemplos.**
- Apple Events (archivo de keynotes): https://www.apple.com/apple-events/
- Apple Event, 9 de septiembre de 2025: https://www.youtube.com/watch?v=H3KnMyojEQU
- "How Apple Makes Motion Graphics Look So Good (After Effects)": https://www.youtube.com/watch?v=DJAR4m4l_PY

**Tells de barato/IA.** Producto con aristas sin bisel (la luz no tiene dónde quedarse), reflejos de HDRI de interior
genérico, UI inventada que no corresponde a la app real, texto con glow o degradado, demasiadas cosas en pantalla,
cámara que orbita rápido o con keyframes lineales, producto flotando sin sombra ni contacto.

---

## 15. Y2K / cromo

**Qué es.** Estética de fin de milenio: cromo y metal líquido, tipografías infladas tipo burbuja, rejillas ciber,
iridiscencia, estrellas destello, interfaces de los 2000.

**De dónde viene.** Gráfica de 1997–2004 (videoclips, portadas de pop, web temprana), revivida desde ~2020 por la moda y
la música. Motion Array lo usa para fondos de videoclip, logos en metal y tipos cromados; Studio 2am lo define por
cromo, letras burbuja y rejillas.

**Señales medibles.**
- Materiales: cromo con reflejos de entorno de alto contraste (cielo/suelo), iridiscencia en bordes.
- Easing: rebote elástico pronunciado en logos; giros 3D completos en 20–40 frames.
- Paleta: plata, negro, + 1–2 neón *pop* (rosa, lima, azul eléctrico); o pastel iridiscente.
- Tipografía: display inflada/burbuja, extendidas, o sans tech de los 2000; con bisel y cromo.
- Textura: destellos tipo estrella de 4 puntas, *lens flares* cortos, rejillas en perspectiva.
- Cámara: giros de logo, *dolly zoom*, órbitas rápidas.
- Sonido: sintes brillantes, pads aireados, *sparkle* SFX.

**Rinde en:** contenido de música, moda, lanzamientos dirigidos a Gen Z, stickers/badges animados. **No rinde en:** la
marca en registro de autoridad, B2B, explainers (y choca de frente con la regla anti-glow neón de
`kb/10-anti-look-ia.md`: usar solo con brief que lo pida y el neón como acento, nunca como halo).

**Cómo se produce.**
- Blender (servidor): Principled metálico (metallic 1, roughness 0,05–0,15) con HDRI de estudio contrastado o un
  entorno de rayas; texto 3D con bisel generoso; Thin Film para iridiscencia (Blender 4.2+).
- Remotion: compone el render; destellos como sprites con `scale` y `rotate` cortos.
- AE: plugins de texto cromado o mapas de reflejo falsos (CC Glass + gradiente), más rápido pero se nota.

**Ejemplos.**
- Motion Array, "Get the look: chrome graphics & chrometype assets": https://motionarray.com/learn/creative-assets/metallic-graphic-assets/
- Studio 2am, "The Rise of Y2K Aesthetic in Graphic Design": https://studio2am.co/blogs/news/the-rise-of-y2k-aesthetic-in-graphic-design

**Tells de barato/IA.** Cromo sin entorno que reflejar (gris plano), glow neón en todo, mezcla de Y2K con vaporwave y
cyberpunk sin decidir, tipografía burbuja descargada sin bisel ni luz coherente, el mismo HDRI en todas las piezas.

---

## 16. Coded / generativo / ASCII

**Qué es.** Motion que sale de reglas, no de keyframes: sistemas de partículas, campos de ruido, física 2D, retículas
que reaccionan al audio o a datos, texto convertido en caracteres ASCII, identidades generativas que nunca se repiten
igual.

**De dónde viene.** Arte por computadora de los 60 (John Whitney, que hizo las espirales de Vertigo con una computadora
analógica), Processing/p5.js, la demoscene, y hoy Cavalry y el creative coding. Envato lo pone como tendencia 11 de 2026
("ASCII-inspired visualizations, reactive 2D physics, custom-coded particle flows").

**Señales medibles.**
- Easing: lo define el sistema (ruido, física, fuerzas); el diseñador controla parámetros, no curvas.
- Ritmo: reactivo al audio (amplitud/beat) o al dato; picos sincronizados al golpe.
- Densidad: muchos elementos pequeños (cientos a miles) con una regla común; un "evento" claro cada 2–4 s para que no
  sea fondo de pantalla.
- Paleta: monocroma o 2 colores; el interés está en la forma.
- Tipografía: monoespaciada (ASCII), o la tipografía de marca rasterizada en celdas.
- Textura: el patrón mismo; a veces dithering.
- Cámara: 2D o 3D ortográfica.
- Sonido: electrónica, glitch suave, sonificación del dato.

**Rinde en:** contenido de tecnología (es literalmente "código haciendo arte"), intros de marca,
fondos de VSL, visualizar "el modelo pensando", demos de IA Master Tech. **No rinde en:** historias emocionales con
personas, explainers que necesitan ilustración concreta.

**Cómo se produce.**
- Remotion: el sitio ideal porque todo es función del frame. Ruido con `simplex-noise` sembrado; partículas calculadas
  de forma determinista (posición = f(frame, índice, semilla)), nunca con estado que dependa del orden de render;
  `@remotion/media-utils` (`visualizeAudio`) para reaccionar al audio; ASCII dibujando un video/imagen en `<canvas>` y
  mapeando luminancia a una rampa de caracteres. Three.js/R3F para 3D generativo.
- Cavalry (de Scene Group) es la herramienta de motion procedural que cita Envato; HyperFrames del repo también sirve
  para composiciones HTML.
- Blender: Geometry Nodes para sistemas 3D.

**Ejemplos.**
- Envato, tendencia 11 "Coded motion": https://elements.envato.com/learn/motion-design-trends
- Envato, video "Video & motion design trends 2026: AI, craft, and chaos" (bloque Coded Motion): https://www.youtube.com/watch?v=XRIh-m23-DM
- John Whitney en los títulos de Vertigo (antecedente): https://www.artofthetitle.com/title/vertigo/

**Tells de barato/IA.** Partículas de plugin con el mismo look de siempre (puntos azules con glow sobre negro), "red
neuronal" de nodos conectados como cliché de IA, generativo sin ningún evento ni dirección (salvapantallas), ASCII con
fuente no monoespaciada, simulación no determinista que cambia entre renders.

---

## Matriz rápida: estilo × uso de Master Motion

| Estilo | Reel/Short | Anuncio | Explainer | VSL | Lanzamiento | Producción en el stack |
|---|---|---|---|---|---|---|
| 1 Cinética suiza/brutalista | alto | alto | medio | medio (promesas) | alto | Remotion puro |
| 2 Editorial-documental | medio | bajo | alto | alto (problema) | bajo | Remotion + mapas d3 |
| 3 Retención creator | alto | alto | medio | medio (cortes) | bajo | Whisper + Remotion |
| 4 Nativo 9:16 | base | base | — | — | alto | Remotion (safe areas) |
| 5 Collage / papel | alto | medio | alto | medio | medio | Remotion + escaneos |
| 6 Cel / frame by frame / doodle | medio | medio | alto | bajo | medio | dibujo + Remotion |
| 7 Anime-inspired | medio | medio | bajo | bajo | alto | dibujo + Remotion/Blender |
| 8 Liquid & morph | medio | alto | bajo | bajo | alto | Remotion SVG / AE |
| 9 Isométrico | bajo | medio | alto | medio | medio | Remotion SVG / Blender orto |
| 10 Data viz | medio | bajo | alto | alto (prueba) | bajo | Remotion + d3 |
| 11 Glitch/VHS/datamosh | medio | bajo | bajo | bajo | medio | Remotion + ffmpeg |
| 12 Riso / impresión | alto | medio | medio | bajo | medio | Remotion (multiply) |
| 13 3D squishy/clay | alto | alto | medio | bajo | alto | Blender (servidor) |
| 14 Producto premium / Apple | bajo | alto | bajo | alto (cierre) | alto | Blender + Remotion |
| 15 Y2K / cromo | medio | bajo | bajo | bajo | medio | Blender |
| 16 Coded / generativo / ASCII | alto | medio | medio | medio (fondos) | alto | Remotion puro |

Combinaciones que funcionan: 2 + 10 (explainer de datos con mapas), 3 + 4 (todo lo social), 1 + 14 (lanzamiento),
5 + 12 (marca personal con carácter), 16 + 1 (piezas de IA con tipo), 6 (doodle) + 3 (talking head con énfasis
dibujado). Combinaciones que chocan: 11 + 14, 15 + 2, 13 + 2.

---

## Fuentes

Todas consultadas el 2026-11-07.

Reportes y artículos de tendencias
1. Envato, "11 motion design trends shaping 2026" — https://elements.envato.com/learn/motion-design-trends
2. Envato, "Video & motion design trends 2026: AI, craft, and chaos" (YouTube) — https://www.youtube.com/watch?v=XRIh-m23-DM
3. Envato, "Why is squishiness trending in the world of 3D and motion design?" — https://elements.envato.com/learn/squishy-3d-trend
4. Videobolt, "Top Motion Graphics Trends for 2026" — https://blog.videobolt.net/post/top-motion-graphics-trends-2026
5. It's Nice That, "The graphic trends you'll want to bookmark for 2026" — https://www.itsnicethat.com/features/forward-thinking-graphic-trends-2026-graphic-design-120126
6. Creative Bloq, "Texture, warmth and tactile rebellion: the big graphic design trends for 2026" — https://www.creativebloq.com/design/graphic-design/texture-warmth-and-tactile-rebellion-the-big-graphic-design-trends-for-2026
7. Behance, "Design Trends 2026" — https://www.behance.net/gallery/239027109/Design-Trends-2026
8. School of Motion, podcast con Estelle Caswell (Vox Earworm) — https://schoolofmotion.com/blog/estelle-caswell-vox-podcast

Tipografía cinética e historia
9. DIA Studio — https://www.dia.studio/
10. It's Nice That sobre DIA — https://www.itsnicethat.com/features/dia-mitch-paone-meg-donohoe-graphic-design-animation-typography-180918
11. Art of the Title, Vertigo (1958) — https://www.artofthetitle.com/title/vertigo/
12. MDPI Heritage, "The Graphic-Cultural Legacy of Saul Bass's Title Sequences" — https://www.mdpi.com/2571-9408/8/8/329

Editorial-documental y data viz
13. Johnny Harris, canal — https://www.youtube.com/johnnyharris
14. Johnny Harris, "How I Make My Maps" — https://www.youtube.com/watch?v=GsojLuJpe_0
15. MotionVid, guía del estilo de mapas Johnny Harris — https://motionvid.ai/blog/johnny-harris-style-map-animation
16. Neil Halloran, The Fallen of World War II — https://www.neilfilms.com/ww2/
17. The Fallen of World War II (YouTube) — https://www.youtube.com/watch?v=DwKPFT-RioU

Retención y 9:16
18. Choppity, estilo de edición de Alex Hormozi — https://www.choppity.com/tools/recreate-video-editing-style/alex-hormozi/
19. Exemplary AI, "Alex Hormozi Captions" — https://exemplary.ai/blog/alex-hormozi-captions
20. Simon Willison, "How to succeed in MrBeast production (leaked PDF)" — https://simonwillison.net/2024/Sep/15/how-to-succeed-in-mrbeast-production/
21. One Day Developers, simulador de zonas seguras 9:16 — https://od2.in/reels-safe-zone
22. Meta Business, zona segura en Stories y Reels — https://www.facebook.com/business/help/980593475366490
23. Zack D. Films, canal — https://www.youtube.com/@zackdfilms

Collage, dibujo, anime
24. Corridor, "Jump Cut" (dir. Winston Hacking) — https://www.youtube.com/watch?v=6_TQzYnWpn0
25. Colossal sobre "Jump Cut" — https://www.thisiscolossal.com/2025/04/corridor-jump-cut/
26. Ordinary Folk — https://www.ordinaryfolk.co/
27. Golden Wolf — https://goldenwolf.tv/
28. Golden Wolf, canal — https://www.youtube.com/@golden_wolf
29. MoMA, "How to Make Hand-Drawn Animation" — https://www.youtube.com/watch?v=9ytf-Ujpr9g
30. Porter Robinson & Madeon, "Shelter" (A-1 Pictures) — https://www.youtube.com/watch?v=fzQ6gRAEoy0

Liquid, isométrico, analógico, impresión
31. "Animating a Liquid Reveal in After Effects" — https://www.youtube.com/watch?v=geBX861h8K4
32. Kasra Design, "Top 15 Isometric Animation Samples in 2026" — https://www.kasradesign.com/top-15-isometric-animation-samples-our-picks/
33. "Isometric Motion Design for Tech" (After Effects) — https://www.youtube.com/watch?v=cGP1UxRZh8s
34. Kanye West, "Welcome to Heartbreak" (Vimeo, dir. Nabil) — https://vimeo.com/4578366
35. "Animating with RISO" (Vimeo) — https://vimeo.com/767605555
36. "RISO animations" (Vimeo) — https://vimeo.com/833258814
37. Friends & Neighbors, texturas de impresión riso — https://www.friendsandneighborssf.com/print-textures

3D blando, producto premium, Y2K
38. BBC Two "Curve" idents (Wikipedia) — https://en.wikipedia.org/wiki/BBC_Two_%22Curve%22_idents
39. Transform Magazine, idents de BBC Two por BBC Creative y Superunion — http://www.transformmagazine.net/articles/2018/bbc-creative-and-superunion-launch-new-idents-for-bbc-two/
40. Apple Events — https://www.apple.com/apple-events/
41. Apple Event, 9 de septiembre de 2025 — https://www.youtube.com/watch?v=H3KnMyojEQU
42. "How Apple Makes Motion Graphics Look So Good (After Effects)" — https://www.youtube.com/watch?v=DJAR4m4l_PY
43. BUCK — https://buck.co/
44. Motion Array, "Get the look: chrome graphics & chrometype assets" — https://motionarray.com/learn/creative-assets/metallic-graphic-assets/
45. Studio 2am, "The Rise of Y2K Aesthetic in Graphic Design" — https://studio2am.co/blogs/news/the-rise-of-y2k-aesthetic-in-graphic-design

Notas de verificación
- La página de tendencias 2025 de Motion Array (`motionarray.com/learn/motion-array/design-trends/`) devolvió 404; no se
  usa.
- Las de Creative Bloq e It's Nice That se verificaron por metadatos y resumen; el cuerpo completo de Creative Bloq
  quedó detrás de su muro de newsletter.
- Los números de cortes, zoom y captions de Hormozi vienen de análisis de terceros (Choppity, Exemplary AI); Exemplary
  aclara que no existe una especificación publicada por su equipo.
- Los rangos de "señales medibles" sin fuente son criterio de oficio y se deben medir contra cada referencia concreta
  con el agente `motion-architect:reference-analyst` antes de fijarlos en un storyboard.
