# Catálogo de estilos de motion vivos en 2025–2026 (redes y showcases)

Investigación: 2026-11-07. Alcance: redes sociales y showcases (Instagram, Vimeo, YouTube, Behance, Dribbble,
Motionographer, artículos de tendencias). Son ESTILOS reproducibles, no artistas. Cada ficha trae 3+ ejemplos con URL
que aparecieron en resultados de búsqueda o en páginas leídas (sobre todo la selección "Best Motion Design & Animation
of 2026 (So Far...)" de Ben Marriott, que lista cada pieza con enlace, y las Quickies/News de Motionographer).

Cómo leer las "señales medibles": son rangos de oficio para arrancar el build y luego contrastar con la referencia
(con `motion-architect:reference-analyst` o midiendo a mano). No están medidas frame a frame sobre estos ejemplos;
cuando un dato viene de la fuente (por ejemplo "line boil", "frame rate bajo", "risograph") se dice.

Contexto que atraviesa todo el catálogo: las fuentes de 2026 coinciden en que lo hecho a mano, la textura y la
imperfección visible se volvieron la señal de calidad frente al contenido generado (Envato: "Craft as luxury" y
"Coded motion"; Videobolt: dibujo a mano, texturas analógicas, papel rasgado, módulos, vidrio; Ben Marriott: "No AI in
anything shown here"). Eso aplica directo a `kb/10-anti-look-ia.md`.

---

## 1. Tipografía cinética a golpe (beat-synced bold type)

**Qué es:** palabras que entran, se apilan y rellenan pantalla sincronizadas a un beat o a la voz; el texto es el
protagonista y la composición se arma con bloques tipográficos.

**Señales medibles**
- Easing: entradas con expo-out muy marcado (cubic-bezier ~0.16,1,0.3,1) o cortes duros sin interpolación; salidas
  cortas expo-in. Overshoot pequeño (2–6 %) solo en escalas.
- Duración de entrada: 4–10 frames a 30 fps por palabra; holds de 8–20 frames.
- Stagger: por palabra 2–4 f; por letra 1 f (o 0,5 f con subframe). Cambio de layout en cada beat.
- Ritmo: 60–140 cambios de layout por minuto (1 por beat a 90–128 BPM, o cada 2 beats).
- Paleta: 2 tintas + 1 acento. Inversiones fondo/figura en el beat fuerte.
- Tipografía: grotescas condensadas o extendidas en negrita (peso 700–900), mayúsculas, tracking negativo; contraste
  con una serif display en una palabra clave.
- Textura: plana, a lo sumo grano fino. Cámara: 2D, algún zoom de escala 110–140 % en el acento.
- Transiciones: wipe por la propia letra, máscara por bloque, "fill the screen" (repetición hasta llenar).
- Sonido: beat claro; whoosh/click corto por palabra fuerte, no en todas.

**Género:** anuncio, hook de VSL, lanzamiento, lyric video, aperturas de evento, talking head (overlays).

**Cómo se hace:** AE Text Animators (Range Selector por palabra, offset por expresión), Cavalry (Text + Duplicator),
Remotion (split por palabra, `spring` con damping alto o `interpolate` con easing), HyperFrames/`kinetic-type`.
Trucos: marcar el beat en la línea de tiempo antes de animar; animar el layout (la caja), no solo la letra; repetir la
palabra en patrón de bloques para llenar el cuadro.

**Ejemplos**
- Reel de tipografía en bloques con Text Animators ("Animating my YouTube mood"): https://www.instagram.com/reel/DWRC-2Hkrx1/
- Ina Kavaliuk, experimentos de kinetic type (Abduzeedo): https://abduzeedo.com/kinetic-typography-dynamic-motion-design-experiments
- Hrvoje Grubisic, "Bold kinetic typography" (citado en SVGator): https://dribbble.com/hrvoje-grubisic
- Recopilación por subestilos (beat-synced, fluido, UI, títulos): https://www.svgator.com/blog/50-kinetic-typography-examples/

**Tells de barato/IA:** todo el texto entrando a la vez con el mismo fade-up; easing lineal o "ease" por defecto;
centrar todo; tipografía genérica (Montserrat/Bebas sin ajuste de tracking); animar cada palabra igual sin jerarquía;
beat que no coincide con el sonido (desfase de 2–4 frames se nota); sombras/glow para "dar energía".

---

## 2. Morph líquido (formas y letras que se transforman)

**Qué es:** formas planas y letras que se estiran, se funden y se convierten unas en otras sin cortar; transmite calma
y continuidad. SVGator lo llama "fluid typography"; Motionographer reseña obras construidas sobre "morphing forms".

**Señales medibles**
- Easing: in-out simétrico suave (sine/cubic in-out), curvas largas; nada de overshoot duro.
- Duración: transformaciones de 18–45 frames; casi sin holds (siempre algo fluye).
- Stagger: por vértice/segmento con offset continuo, o por objeto 3–6 f.
- Ritmo: pocos "cortes" (5–20 por minuto); la transición ES el contenido.
- Paleta: 2–4 colores planos de alto contraste o un monocromo; gradientes solo si están controlados.
- Tipografía: sans geométrica o display redondeada que admita morph (mismo número de puntos ayuda).
- Textura: plana o grano muy fino. Cámara: estática 2D.
- Transiciones: match-shape (la forma final de una escena es la inicial de la siguiente).
- Sonido: pads, texturas, sonido "squish"/líquido sutil.

**Género:** branding (logo reveal), explainer calmado, wellness/salud, bumpers.

**Cómo se hace:** AE (shape layers + path morph, Liquify/Turbulent Displace con moderación), Cavalry (shape morph,
Falloffs), código (SVG path interpolation tipo flubber, o metaballs por shader). Trucos: igualar número y orden de
vértices antes del morph; mover el centro de masa con un poco de retraso respecto al borde (squash & stretch); pensar la
siguiente forma antes de terminar la actual.

**Ejemplos**
- TAPE, logo líquido animado (citado en SVGator): https://dribbble.com/tapestudio
- Fremox, "Shape to animated text" (citado en SVGator): https://dribbble.com/Fremox
- Wednesday Studio, "Ying & Yang" (breakdown en Motionographer): https://motionographer.com/2025/04/30/breakdown-ying-yang-by-wednesday-studio-a-motion-poem-to-duality-design/
- Dedo Ciego, "Nervi" – ecosistema de formas que mutan (Motionographer): https://motionographer.com/2025/01/31/nervi-breakdown-crafted-motion-visual-ecosystem-shaped-by-morphing-forms/

**Tells de barato/IA:** "blob" genérico con gradiente morado-azul; morph que se cruza sobre sí mismo (vértices mal
emparejados); deformación por plugin aplicada a todo el cuadro; metaballs sin intención compositiva; loops que se notan.

---

## 3. 2D suelto a mano con line boil (sketchy commercial)

**Qué es:** animación 2D cuadro a cuadro, con trazo suelto, textura de pincel y línea que "hierve"; poco detalle,
mucha intención. Ben Marriott destaca en la pieza de Giant Ant el equilibrio entre line boil, textura de pincel y
frame rate.

**Señales medibles**
- Frame rate: "on 2s" (12 dibujos/s sobre 24 fps) y "on 3s" para planos lentos; on 1s solo en acción rápida.
- Line boil: 2–3 versiones del trazo en ciclo cada 2–4 frames en holds.
- Easing: no hay curvas de keyframe; espaciado dibujado (slow in/out con intercalados agrupados en los extremos),
  smears de 1–2 frames en movimientos rápidos.
- Entradas: 8–20 dibujos. Ritmo: planos de 2–5 s (12–30 cortes por minuto).
- Paleta: limitada (3–6 colores), a menudo fondos planos cálidos; color que no llena el trazo exacto.
- Tipografía: rotulada a mano o una sans neutra muy pequeña al final.
- Textura: pincel seco, crayón, papel. Cámara: casi estática; transiciones por metamorfosis dibujada.
- Sonido: foley orgánico, música acústica.

**Género:** anuncio de marca, branding emocional, explainer con tono, lujo (Hermès), apertura de evento.

**Cómo se hace:** TVPaint, Procreate Dreams, Toon Boom, AE solo para composición; en Blender Grease Pencil. En código:
secuencias de PNG dibujadas y un componente que cambie de frame cada 2. Trucos: animar en 2s y dejar 1s solo para el
golpe; usar ciclos de boil en holds para que "respire"; esconder lo que no importa (simplificar) para que el ojo vaya al
gesto principal.

**Ejemplos**
- Giant Ant, OpenTable "Find A Restaurant": https://vimeo.com/1163448564
- Space Dawg (Michael Lim), Hermès campaña 520: https://www.instagram.com/p/DYkJxQvsHuz/
- Masanobu Hiraoka, "On Being" para Max Cooper & Félix Gerbelot: https://www.youtube.com/watch?v=dtTdjRB4Q4g
- Sahana Vathsa, "Dishkyaaon!!!" (2D cuadro a cuadro digital + tradicional): https://motionographer.com/quickie/sahana-vathsa-dishkyaaon/

**Tells de barato/IA:** boil aplicado con Wiggle/Turbulent Displace sobre un vector rígido (todo vibra igual); on 1s
uniforme con interpolación de puppet tool; trazo perfecto de vector con "filtro de lápiz"; personajes que cambian de
modelo entre planos sin intención; morphs de IA entre poses.

---

## 4. 2D pictórico con grano y acabados analógicos

**Qué es:** ilustración con color pictórico (pastel, acuarela, gouache), bordes duros y suaves mezclados, grano y
acabados de lente sutiles (aberración cromática, light leaks) que dan calidez sin tapar el diseño.

**Señales medibles**
- Easing: suave, in-out largo; parallax lento entre capas (1–3 % del ancho por segundo).
- Duración: entradas de 20–40 frames; planos largos de 3–8 s (8–20 cortes/min).
- Stagger: por capa de profundidad 4–10 f.
- Paleta: armonías poco obvias y saturación controlada; fondos que podrían contar la historia solos.
- Tipografía: serif editorial o sans fina, pequeña, con mucho aire.
- Textura: grano de film 3–8 % de opacidad, papel, bordes de pigmento; aberración cromática < 1 px en bordes.
- Cámara: pans y push-ins lentos sobre ilustración en capas; profundidad de campo pintada.
- Transiciones: disolución de pintura, cambio de luz, wipe por mancha.
- Sonido: ambiente, música orquestal/ambient, poco SFX.

**Género:** lujo y moda, branding, música, cortos, aperturas de serie.

**Cómo se hace:** pintado en Photoshop/Procreate/Fresco + animación en AE o TVPaint; en Blender, pintado sobre planos
(2.5D). Trucos: diseñar el grano y la paleta desde el inicio (no como filtro final); contraste de bordes duros y suaves en
el mismo cuadro; acabados analógicos dosificados (Ben Marriott remarca "sin tomar el control").

**Ejemplos**
- Mathilde Loubes, Burberry "Nature's Affection" (Eddy): https://www.eddyanimation.tv/all/work/2391/burberry-nature-s-affection
- Tezo Don Lee, RIMOWA "Holiday reunions": https://www.youtube.com/watch?v=igH1sj1i9T0
- Danaë Gosset, Mac Miller "Rush Hour" (acuarela pintada a mano): https://youtu.be/6AlRQzmhLUI
- Jocelyn Charles, apertura de "Dealies" (textura de marcador sangrado): https://www.youtube.com/watch?v=4AwV9EZAouU

**Tells de barato/IA:** grano idéntico y estático encima de todo; "painterly" como filtro sobre vector; light leaks
de stock cada 2 segundos; colores sucios sin decisión; pinceladas que se deslizan con la cámara (no están en el mundo);
estilo "acuarela IA" con bordes que se derriten de forma uniforme.

---

## 5. Collage y recorte (cut-out, papel rasgado)

**Qué es:** composición con recortes de fotos, periódico, semitonos y bordes rasgados, animada en stop-frame o
imitándolo; lo físico se ve. Videobolt lo describe con bordes irregulares y frame rate reducido.

**Señales medibles**
- Frame rate: 8–12 fps efectivos (on 2s/3s) aunque se entregue a 24/30.
- Easing: ninguno o escalonado (posiciones discretas); pequeños "jitters" de 1–3 px por frame en elementos sueltos.
- Entradas: pops de 2–4 frames, recortes que caen o se deslizan en 4–8 frames.
- Ritmo: rápido y musical, 40–100 cambios por minuto en publicidad; más lento en documental.
- Paleta: papel envejecido, negro de tinta, 1–2 acentos saturados (rojo, amarillo, azul impresos).
- Tipografía: letras recortadas, sellos, máquina de escribir, semitono.
- Textura: escaneos de papel, sombras proyectadas reales o simuladas (offset 2–6 px, blur bajo), fibras.
- Cámara: cenital fija; a veces miniatura real con profundidad.
- Transiciones: cubrir con otro papel, rasgar, deslizar una hoja.
- Sonido: papel, tijeras, cinta, foley seco.

**Género:** anuncio con tono, explainer social y educativo, música, editorial/noticias.

**Cómo se hace:** escaneos o fotos de recortes reales animados en Dragonframe; o AE con capas recortadas, Posterize
Time y sombra; en código, sprites con jitter determinista por frame y `step` en vez de interpolación. Trucos: escanear
material real (encyclopedias, revistas, Super 8 como hace Dedo Ciego); sombra coherente de una sola luz; no limpiar los
bordes.

**Ejemplos**
- Artful Being / Danny Cato, "Follow Your Passion" para Open University y BBC Bitesize (periódico rasgado, semitonos):
  https://motionographer.com/news/artful-being-follow-your-passion-open-university-bbc-bitesize/
- Winston Hacking, "Listen2me" de Foxwarren (sets en miniatura y recortes en stop-motion, sin IA):
  https://motionographer.com/quickie/big-active-winston-hacking-listen2me-foxwarren/
- "Spring Time" – recorte de papel en stop-motion (Motionographer): https://motionographer.com/quickie/spring-time-old-man/
- Videobolt, tendencia "torn paper aesthetics": https://blog.videobolt.net/post/top-motion-graphics-trends-2026

**Tells de barato/IA:** recortes de stock con bordes rasgados idénticos repetidos; animación suave a 60 fps (pierde lo
físico); sombras incoherentes; textura de papel en loop corto que se nota; fotos de IA recortadas (manos y caras raras).

---

## 6. Textura de impresión (risograph, serigrafía, lápiz de color)

**Qué es:** cada frame pasa por un proceso de impresión o dibujo físico (riso, serigrafía, lápiz) y se escanea; queda
el desregistro de tintas, el grano y la variación entre frames.

**Señales medibles**
- Frame rate: 8–12 fps (cada frame es un objeto físico).
- Easing: dibujado/espaciado manual; sin curvas de software.
- Paleta: tintas planas limitadas (2–4), colores fluorescentes típicos de riso (rosa, azul medio, amarillo) o tinta china.
- Textura: desregistro de 2–6 px entre tintas, trama/grano de tóner, papel visible; varía cuadro a cuadro.
- Tipografía: rotulación o tipos de imprenta, a veces impresa en el mismo proceso.
- Cámara: plana. Transiciones: cambio de hoja, overprint de una tinta sobre otra.
- Sonido: mecánico (impresora), acústico.

**Género:** branding de cultura/editorial, efemérides (año nuevo lunar), música, contenido de marca personal con autor.

**Cómo se hace:** imprimir la secuencia (riso/serigrafía), intervenir a mano, escanear y reensamblar en AE o en
código. Simulación digital: separar por canales, desplazar cada tinta con offset aleatorio por frame, multiplicar sobre
papel escaneado, añadir grano de tóner. Trucos: el offset debe cambiar por frame, no por plano; usar papel real
escaneado.

**Ejemplos**
- Jimograph, "Year Of The Horse" (frames impresos en riso, tinta china y re-escaneados): https://www.instagram.com/jimograph/reel/DU20Nx4jWkF/
- Kate Renshaw-Lewis, "Busy Bodies" (2D a mano con serigrafía): https://motionographer.com/news/busy-bodies-hand-drawn-printmaking-vimeo/
- FLiiiP Design, "Year of the Horse" (cada frame coloreado con lápiz de color): https://www.instagram.com/p/DVb255PAobC/

**Tells de barato/IA:** filtro "riso" estático (mismo desregistro en todo el video); trama de halftone perfecta y
digital; colores de riso falsos (RGB saturado que no existe en tinta); grano sin papel debajo.

---

## 7. Stop-motion y miniatura real

**Qué es:** objetos, sets y efectos filmados cuadro a cuadro; la luz y los materiales son reales. En 2026 hay marcas
grandes apostando por ello (Telstra, BBC Juegos Olímpicos, Diptyque, Staatsloterij).

**Señales medibles**
- Frame rate: 12 fps (on 2s) típico; 24 fps en piezas premium.
- Easing: lo da el animador con espaciado; pequeñas imperfecciones (ligero "chatter" de superficie, huellas).
- Duración: planos de 2–6 s; transiciones teatrales con el set rotando o desplazándose.
- Paleta: dictada por materiales (fieltro, arcilla, papel, madera); luz práctica cálida.
- Textura: real (huellas, polvo, fibra). Profundidad de campo corta de lente macro.
- Cámara: motion control lento o fija; a veces el set se mueve en lugar de la cámara.
- Sonido: foley de materiales, música acústica.

**Género:** anuncio de marca de masa (telecom, lotería), lujo, campañas de temporada, trailer.

**Cómo se hace:** Dragonframe + cámara fija; compositing en AE/Nuke para rigs. Simulación en 3D (Blender) con shader de
clay/fieltro, animación en 2s y jitter de superficie (ver estilo 8). Trucos de las fuentes: NOMINT encendió lana de acero
en cada frame para las llamas (la luz real del fuego ilumina el set); Telstra resuelve las transiciones con miniaturas
que rotan.

**Ejemplos**
- Catherine Prowse / Passion Animation, Telstra "Satellite Messaging": https://vimeo.com/1182730839
- NOMINT, Juegos Olímpicos de Invierno Milano Cortina 2026 (BBC): https://youtu.be/7wdwqYcMoaQ
- Chris Ullens, Diptyque "Médicis" (artesanos en miniatura): https://motionographer.com/quickie/diptyque-medicis-chris-ullens/
- Kaho Yoshida, Yoodle de YouTube en arcilla polimérica: https://www.instagram.com/p/DWT7RkojvjX/

**Tells de barato/IA:** 3D perfecto a 30 fps con "filtro de plastilina"; superficies sin huellas ni variación entre
frames; cámara flotante imposible en un set pequeño; video generado con física de juguete incoherente (objetos que se
funden).

---

## 8. Clay digital y 3D con smears (claymation en Blender)

**Qué es:** 3D con aspecto de plastilina o juguete blando, animado en 2s, con smears y squash & stretch exagerados de
animación clásica; carisma de personaje.

**Señales medibles**
- Frame rate: render 24 fps, pose cada 2 frames (stepped).
- Easing: poses extremas fuertes, anticipación 3–6 f, smears de 1–2 f (geometría estirada o duplicada).
- Squash & stretch: 10–30 % en impactos manteniendo volumen.
- Duración: gags cortos; planos de 1,5–4 s.
- Paleta: saturada pero de juguete (pasteles fuertes), fondos de color sólido o sets simples.
- Textura: shader con huellas/ruido de baja frecuencia, subsurface leve, imperfección de superficie que cambia por pose.
- Cámara: fija o pocos movimientos, lente media; iluminación de estudio suave con una key clara.
- Sonido: cartoon foley (boing, squish), música jugosa.

**Género:** anuncio de producto con personalidad (joyería, consumo), branding lúdico, mascota de marca, redes.

**Cómo se hace:** Blender (shader clay con ruido + bump, modificador de stepped en curvas o "Constant" interpolation,
smears con shape keys o lattice), C4D. Trucos: variar el ruido de superficie en cada pose (boil 3D); smear como
geometría, no como motion blur; mantener volumen en el squash.

**Ejemplos**
- Kapi Kurtaran, ad para 5MC2 (joyería) y "No Barking": https://www.instagram.com/p/DYesah4tezC/ y https://www.instagram.com/kaps_motion/reel/DVgf1YejPlh/
- Kyeonghong Kim, "The Talent of Clay" (claymation 3D en Blender, 80.lv): https://80.lv/articles/claymation-in-3d-a-cute-blender-animation-with-stop-motion-vibes
- Oomy Zen / Pleid St. (Black&Co.), sensaciones táctiles traducidas a 3D blando: https://motionographer.com/quickie/oomy-zen-pleid-st/

**Tells de barato/IA:** interpolación suave a 1s (se ve "Pixar barato", no clay); textura de huellas estática pegada
como textura; personajes inflados genéricos sin poses; render con mucho bloom y DOF para disimular.

---

## 9. 3D lúdico-premium "satisfying" (simulaciones y trucos de mano)

**Qué es:** 3D impecable con un momento satisfactorio en cada plano (algo encaja, se pliega, rueda, se apila) o
simulación de tela/softbody; premium y juguetón a la vez. Ben Marriott sobre Wannerstedt: alta gama, renderizado
preciso, "nunca estéril".

**Señales medibles**
- Easing: física real (simulación) o curvas con anticipación y settle (1–2 rebotes amortiguados).
- Duración: loops de 4–10 s; un evento principal por plano.
- Ritmo: lento y contemplativo; 6–15 cortes por minuto o loop sin cortes.
- Paleta: pasteles o neutros con un color fuerte; materiales mate + uno brillante.
- Textura: materiales PBR muy cuidados (tela, goma, cerámica), sin ruido de render.
- Cámara: ortográfica o lente larga, encuadre simétrico/limpio, movimientos mínimos.
- Transiciones: loop perfecto (último frame = primero).
- Sonido: ASMR (foley preciso de material) o música minimal.

**Género:** redes (loops), branding de producto, apertura de marca, presentaciones de material.

**Cómo se hace:** Blender/C4D/Houdini; simulaciones bakeadas y convertidas a keyframes para hacer loop; render en
Cycles/Redshift. Trucos: diseñar la "mecánica" del gag primero en 2D; loop por bake + crossfade de cache o simulación con
estado inicial = final; sonido grabado o diseñado para cada contacto.

**Ejemplos**
- Andreas Wannerstedt, "Soft Logic": https://www.instagram.com/reel/DXwgH2IsyST/
- @nickel_3d, una esfera explorando materiales (Blender): https://www.instagram.com/reel/DZqTnerS1zA/
- SatisfySim, simulación de tela en seis etapas: https://www.instagram.com/_c/reel/DfKhyOJzp-U/

**Tells de barato/IA:** "satisfying" sin gag (solo cosas girando); simulación de tela de preset sobre esfera sin
propósito; materiales de librería brillantes; loop con salto visible; motion blur y DOF exagerados; ASMR de stock que no
corresponde al material.

---

## 10. Lo-fi glitch / footage "filtrado" (leaked lab, térmico, estática analógica)

**Qué es:** el producto se esconde tras distorsión, primeros planos extremos, bordes de cuadro rasgados, estática
analógica o cámara térmica; parece material que no debíamos ver. Evolución de "Glitch 2.0" (Motionographer) y
"Hallucination as aesthetic" (Envato).

**Señales medibles**
- Easing: cortes duros y saltos de frame (frame drops, holds de 2–4 f); zooms digitales bruscos.
- Duración: planos muy cortos (6–20 frames) intercalados con holds largos de tensión.
- Ritmo: 60–150 cortes/min en los picos; irregular a propósito.
- Paleta: desaturada o falso color (térmica: azul→amarillo→blanco), negros aplastados, un rojo/verde de monitor.
- Tipografía: monoespaciada, timecode, etiquetas de archivo/laboratorio, texto técnico pequeño.
- Textura: estática, scanlines, compresión, blur de movimiento real, viñeteo; bordes de film rasgados.
- Cámara: handheld, macro, CCTV, tilt raro.
- Sonido: drones, ruido, cortes de audio sincronizados al glitch.

**Género:** lanzamiento de producto (sneakers, tech), teaser, música, moda.

**Cómo se hace:** grabación real + AE (Datamosh 2, displacement con mapas reales, Time Displacement), cámaras térmicas
reales, simulaciones; en código, desplazamiento por bloques con semilla y saltos de frame deterministas. Trucos:
el glitch tiene reglas (siempre en el beat, siempre en el mismo eje); ocultar el producto genera deseo; mezclar planos
limpios para que el glitch tenga contraste.

**Ejemplos**
- JOYCGI, Nike GT Cut 4 (estética de experimento soviético lo-fi, bordes rasgados): https://www.instagram.com/reel/DVf67ZFiUJi/
- Future Deluxe, Nike Tiempo (cámaras térmicas y simulaciones): https://www.instagram.com/p/DZKq1xpjIht/
- Yonick Studio, Nothing Phone 3A Pro – concepto de lanzamiento (líneas modulares rotas por estática analógica):
  https://motionographer.com/quickie/yonick-studio-nothing-phone-3a-pro-product-launch-concept/

**Tells de barato/IA:** glitch RGB-split de preset en cada corte; VHS overlay de stock encima de render limpio;
glitch sin relación con el sonido; aberración cromática fuerte permanente; "cyberpunk" neón.

---

## 11. Dither, pixel y 1-bit (estética Mac temprano / juego)

**Qué es:** imagen construida con paletas de 1–4 bits, dithering y pixel art; el dither es una paleta de texturas
pensada desde el principio, no un filtro (Ben Marriott sobre Mattis Dovier).

**Señales medibles**
- Resolución interna baja (p. ej. 320×180 o 512×342) escalada con nearest-neighbor ×3–×6.
- Frame rate: 8–15 fps para personaje; scroll a frame rate completo con paso de 1 px.
- Easing: escalonado (posiciones enteras en píxel), sin subpíxel.
- Paleta: 1-bit blanco/negro o 4–16 colores fijos; dither Bayer u ordenado, o patrones de screentone.
- Tipografía: bitmap fonts.
- Cámara: scroll lateral, plano cenital de juego, cortes de "escena".
- Transiciones: dissolve por dither, cortes a negro tipo juego, wipes de bloques.
- Sonido: chiptune, bleeps; o contraste con música orquestal.

**Género:** trailer (cómic, juego), música, campañas con juego jugable, marca personal nerd/tech.

**Cómo se hace:** Aseprite, Photoshop indexado, AE con plugins de dither; en código (Remotion/shader) un pase de
cuantización + matriz Bayer sobre un render de baja resolución; en Blender render a baja resolución + compositor.
Trucos: diseñar valores con patrones de dither (como tramas de manga); no escalar con suavizado; animar en píxeles
enteros.

**Ejemplos**
- Mattis Dovier + Chloé Nicquet, trailer "Monsters We Make Vol. 3": https://www.catsuka.com/player/monsters_we_make_vol_3_trailer
- Song Yeongnam, MV "[PO WAH BUILDING]" (pixel art "fake gameplay"):
  https://motionographer.com/news/experimental-mv-pixel-art-fake-gameplay-traverses-eerie-liminal-spaces-in-song-yeongnams-po-wah-building/
- Electric Studios + Nissan + Dark Horses, experiencia arcade 16-bit:
  https://motionographer.com/news/electric-studios-team-up-on-16-bit-playable-arcade-experience-with-nissan-dark-horses/

**Tells de barato/IA:** filtro de pixelado sobre video HD (píxeles de tamaño inconsistente, subpíxel en movimiento);
paleta sin límite; dither aplicado igual a todo; "pixel art" de IA con anatomía rota y píxeles mezclados.

---

## 12. Código generativo y ASCII (coded motion)

**Qué es:** sistemas que se animan solos: ASCII, matrices de caracteres, duplicadores, campos de puntos, física 2D
reactiva. Envato lo nombra tendencia 2026 ("ASCII-inspired visualizations... custom-coded particle flows"); Cavalry es
ahora gratuito para individuos tras la compra de Canva.

**Señales medibles**
- Easing: el comportamiento lo dan funciones (ruido, falloffs, ondas); entradas por barrido de falloff 20–60 frames.
- Stagger: por índice de celda (0,2–1 f por celda), patrones radiales o por ruido.
- Ritmo: continuo; cambios de estado en el beat.
- Paleta: monocromo (verde/ámbar de terminal, negro/blanco) o 2 colores; posterizado.
- Tipografía: monoespaciada; los propios glifos son la imagen (rampa de densidad de caracteres).
- Textura: CRT opcional (scanlines leves), sin grano pesado.
- Cámara: 2D; a veces 3D de nube de puntos.
- Transiciones: el sistema se reconfigura (de imagen a texto a datos) sin corte.
- Sonido: electrónica, glitches sutiles, sonido reactivo.

**Género:** branding tech/IA, música y VJ, intro de producto developer, marca personal tech, data storytelling.

**Cómo se hace:** Cavalry (String Array, Duplicator, Image Sampler, Posterize, Pixelate — según la propia descripción
del reel), TouchDesigner, p5.js/three.js, Remotion con canvas/shader (muestreo de luminancia → carácter). Trucos:
rampa de caracteres de 8–16 niveles; muestrear un video/render real como fuente (no ruido); limitar la paleta.

**Ejemplos**
- Reel de Cavalry explorando ASCII con String Array, Duplicator, Color Blend, Posterize, Pixelate: https://www.instagram.com/reel/DazHPyFBQfj/
- Breakdown paso a paso "how to make any element ASCII" (Cavalry, CRT): https://www.instagram.com/reel/DU2oRPvDHho/
- Loop generativo de tipografía hecho en Cavalry (dic. 2025): https://www.instagram.com/reel/DSGaWm3DHhB/
- Tutorial "Cavalry: Binary Data Effect" (Image Sampler): https://www.youtube.com/watch?v=xm4uuoMRSHo

**Tells de barato/IA:** "lluvia Matrix" verde genérica; ASCII sobre una imagen sin contraste (sopa de caracteres);
partículas sin regla visible; glow de neón; sistemas que nunca resuelven en una imagen legible.

---

## 13. Mixed media que salta de dimensión (2D ↔ 3D ↔ live action)

**Qué es:** la pieza cambia de técnica como recurso narrativo: dibujo a mano que pasa a gráfica plana y luego a 3D, o
2D que interactúa con superficies 3D o con footage. El choque de capas se muestra, no se esconde (Ben Marriott sobre
"Abstwin": no forzar la integración con light wrap es refrescante).

**Señales medibles**
- Easing: cada capa conserva el suyo (2D en 2s, 3D suave, live action real); el contraste es intencional.
- Duración: transiciones de técnica de 12–36 frames como momentos clave.
- Ritmo: 20–60 cortes por minuto, con 2–4 "saltos de dimensión" por pieza.
- Paleta: un sistema de color común que une técnicas diferentes.
- Tipografía: una sola familia para anclar la identidad entre técnicas.
- Textura: cada técnica con su textura nativa (trazo, plano, render, grano de cámara).
- Cámara: la cámara 3D o real "entra" al dibujo; match de perspectiva en el salto.
- Sonido: el diseño de sonido cambia de registro con la técnica.

**Género:** branding/ID de marca, música, cortos, anuncio de moda o deporte.

**Cómo se hace:** AE + Blender/C4D + footage; Blender Grease Pencil sobre escenas 3D; en Remotion, composiciones
anidadas por técnica con transiciones match-cut. Trucos: definir la regla del salto (qué lo dispara); match de forma o
de movimiento en el corte; dejar visible el compositing cuando aporta.

**Ejemplos**
- Anna Huijun Wang, "OROBORO" (de dibujo a mano a gráfica plana y a 3D): https://motionographer.com/quickie/oroboro-anna-huijun-wang/
- A Qing Yu A, "泛泛相生 (Abstwin)" (fondos pintados, 3D, efectos 2D): https://www.youtube.com/watch?v=e6tCVipGAFU
- Bemo Studio, Powell Lacrosse Brand ID (cel a mano, live action y VFX): https://motionographer.com/quickie/bemo-studio-powell-lacrosse-brand-id/
- ManvsMachine, Moncler x Gilga Farm (2D que modifica la superficie 3D): https://vimeo.com/1142037205

**Tells de barato/IA:** mezclar técnicas sin sistema de color; stickers 2D de stock encima de footage; transiciones
de preset entre técnicas; personajes que cambian de estilo por error y no por regla.

---

## Notas para Master Motion

- Cobertura actual (Buck, MvM, Gunner, Oddfellows, Giant Ant, Tendril, Golden Wolf, Animade; Apple/Stripe/Linear/Vercel/
  Nike; "UI como objeto físico") toca sobre todo 3D premium y 2D de personaje. Este catálogo suma ejes que faltan:
  frame rate como decisión (2s/3s, 8–12 fps), textura física real (papel, impresión, stop-motion), dither/ASCII y
  sistemas generativos, y el salto de técnica.
- Más fáciles de hacer bien en código (Remotion/HyperFrames): 1, 2, 11, 12, y la simulación de 5 y 6.
- Mejor en Blender (el VPS de Bodega): 8, 9, y la simulación de 7.
- Requieren material físico o dibujo real para no caer en tell: 3, 4, 6, 7. Si se simulan, el tell principal es el
  filtro estático: la variación debe cambiar por frame y tener semilla.
- Regla transversal anti-IA observada en las fuentes: decidir el frame rate, la paleta y la textura al principio; un
  efecto que se aplica "al final y a todo" es la señal más común de barato.

---

## Fuentes (consultadas el 2026-11-07)

Selecciones y tendencias
1. Ben Marriott, "The Best Motion Design & Animation of 2026 (So Far...)" (descripción con enlaces + transcripción) – https://www.youtube.com/watch?v=ylXeuDp_8XM – 2026-11-07
2. Envato, "11 motion design trends shaping 2026" – https://elements.envato.com/learn/motion-design-trends – 2026-11-07
3. Envato (YouTube), "Video & motion design trends 2026: AI, craft, and chaos" – https://www.youtube.com/watch?v=XRIh-m23-DM – 2026-11-07
4. Videobolt, "Top Motion Graphics Trends for 2026" – https://blog.videobolt.net/post/top-motion-graphics-trends-2026 – 2026-11-07
5. Motionographer, "25 (+1) for 2025 – Pt 2" (kinetic type, Glitch 2.0, simulaciones, retrofuturismo) – https://motionographer.com/2025/01/02/25-for-2025-the-motionographers-crystal-ball-motion-design-predictions-part-2/ – 2026-11-07
6. Motionographer, "25 (+1) for 2025 – Pt 4" (generativo, analógico + digital) – https://motionographer.com/2025/02/01/25-1-for-2025-motionographers-crystal-ball-motion-design-predictions-and-part-4/ – 2026-11-07
7. Motionographer, portada (Quickies y News recientes) – https://motionographer.com/ – 2026-11-07
8. SVGator, "50 kinetic typography examples" – https://www.svgator.com/blog/50-kinetic-typography-examples/ – 2026-11-07
9. Digital Synopsis, "Top 20 Graphic Design Trends Of 2026" – https://digitalsynopsis.com/design/graphic-design-trends-2026/ – 2026-11-07
10. Behance, "Design Trends 2026" – https://www.behance.net/gallery/239027109/Design-Trends-2026 – 2026-11-07

Piezas y páginas de ejemplo
11. https://www.instagram.com/reel/DWRC-2Hkrx1/ – 2026-11-07
12. https://abduzeedo.com/kinetic-typography-dynamic-motion-design-experiments – 2026-11-07
13. https://dribbble.com/hrvoje-grubisic – 2026-11-07 (citado en SVGator)
14. https://dribbble.com/tapestudio – 2026-11-07 (citado en SVGator)
15. https://dribbble.com/Fremox – 2026-11-07 (citado en SVGator)
16. https://motionographer.com/2025/04/30/breakdown-ying-yang-by-wednesday-studio-a-motion-poem-to-duality-design/ – 2026-11-07
17. https://motionographer.com/2025/01/31/nervi-breakdown-crafted-motion-visual-ecosystem-shaped-by-morphing-forms/ – 2026-11-07
18. https://vimeo.com/1163448564 – 2026-11-07 (Giant Ant, vía fuente 1)
19. https://www.instagram.com/p/DYkJxQvsHuz/ – 2026-11-07 (Space Dawg, vía fuente 1)
20. https://www.youtube.com/watch?v=dtTdjRB4Q4g – 2026-11-07 (Masanobu Hiraoka, vía fuente 1)
21. https://motionographer.com/quickie/sahana-vathsa-dishkyaaon/ – 2026-11-07
22. https://www.eddyanimation.tv/all/work/2391/burberry-nature-s-affection – 2026-11-07 (vía fuente 1)
23. https://www.youtube.com/watch?v=igH1sj1i9T0 – 2026-11-07 (Tezo Don Lee, vía fuente 1)
24. https://youtu.be/6AlRQzmhLUI – 2026-11-07 (Danaë Gosset, vía fuente 1)
25. https://www.youtube.com/watch?v=4AwV9EZAouU – 2026-11-07 (Jocelyn Charles, vía fuente 1)
26. https://motionographer.com/news/artful-being-follow-your-passion-open-university-bbc-bitesize/ – 2026-11-07
27. https://motionographer.com/quickie/big-active-winston-hacking-listen2me-foxwarren/ – 2026-11-07
28. https://motionographer.com/quickie/spring-time-old-man/ – 2026-11-07
29. https://www.instagram.com/jimograph/reel/DU20Nx4jWkF/ – 2026-11-07 (vía fuente 1)
30. https://motionographer.com/news/busy-bodies-hand-drawn-printmaking-vimeo/ – 2026-11-07
31. https://www.instagram.com/p/DVb255PAobC/ – 2026-11-07 (FLiiiP Design, vía fuente 1)
32. https://vimeo.com/1182730839 – 2026-11-07 (Catherine Prowse / Passion, vía fuente 1)
33. https://youtu.be/7wdwqYcMoaQ – 2026-11-07 (NOMINT, vía fuente 1)
34. https://motionographer.com/quickie/diptyque-medicis-chris-ullens/ – 2026-11-07
35. https://www.instagram.com/p/DWT7RkojvjX/ – 2026-11-07 (Kaho Yoshida, vía fuente 1)
36. https://www.instagram.com/p/DYesah4tezC/ – 2026-11-07 (Kapi Kurtaran, vía fuente 1)
37. https://www.instagram.com/kaps_motion/reel/DVgf1YejPlh/ – 2026-11-07 (Kapi Kurtaran, vía fuente 1)
38. https://80.lv/articles/claymation-in-3d-a-cute-blender-animation-with-stop-motion-vibes – 2026-11-07
39. https://motionographer.com/quickie/oomy-zen-pleid-st/ – 2026-11-07
40. https://www.instagram.com/reel/DXwgH2IsyST/ – 2026-11-07 (Andreas Wannerstedt, vía fuente 1)
41. https://www.instagram.com/reel/DZqTnerS1zA/ – 2026-11-07
42. https://www.instagram.com/_c/reel/DfKhyOJzp-U/ – 2026-11-07
43. https://www.instagram.com/reel/DVf67ZFiUJi/ – 2026-11-07 (JOYCGI, vía fuente 1)
44. https://www.instagram.com/p/DZKq1xpjIht/ – 2026-11-07 (Future Deluxe, vía fuente 1)
45. https://motionographer.com/quickie/yonick-studio-nothing-phone-3a-pro-product-launch-concept/ – 2026-11-07
46. https://www.catsuka.com/player/monsters_we_make_vol_3_trailer – 2026-11-07 (vía fuente 1)
47. https://motionographer.com/news/experimental-mv-pixel-art-fake-gameplay-traverses-eerie-liminal-spaces-in-song-yeongnams-po-wah-building/ – 2026-11-07
48. https://motionographer.com/news/electric-studios-team-up-on-16-bit-playable-arcade-experience-with-nissan-dark-horses/ – 2026-11-07
49. https://www.instagram.com/reel/DazHPyFBQfj/ – 2026-11-07
50. https://www.instagram.com/reel/DU2oRPvDHho/ – 2026-11-07
51. https://www.instagram.com/reel/DSGaWm3DHhB/ – 2026-11-07
52. https://www.youtube.com/watch?v=xm4uuoMRSHo – 2026-11-07
53. https://abduzeedo.com/cavalry-free-motion-design-software-individuals – 2026-11-07
54. https://motionographer.com/quickie/oroboro-anna-huijun-wang/ – 2026-11-07
55. https://www.youtube.com/watch?v=e6tCVipGAFU – 2026-11-07 (A Qing Yu A, vía fuente 1)
56. https://motionographer.com/quickie/bemo-studio-powell-lacrosse-brand-id/ – 2026-11-07
57. https://vimeo.com/1142037205 – 2026-11-07 (ManvsMachine, vía fuente 1)
58. https://motionographer.com/2023/03/21/7-ways-to-mix-frame-by-frame-and-rigged-animation/ – 2026-11-07 (técnica: 2s, line boil)

Nota de verificación: las páginas 1, 2, 5, 6, 7 y 8 se leyeron completas. Las demás URLs aparecieron en resultados
de búsqueda con su descripción o como enlaces dentro de esas páginas; los posts de Instagram/TikTok no se abrieron
uno a uno (Instagram bloquea el scrapeo), así que conviene mirarlos antes de usarlos como referencia medida. Ninguna
URL de este archivo se construyó a mano.
