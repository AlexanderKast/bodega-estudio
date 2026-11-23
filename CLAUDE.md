# Bodega Estudio

Estudio de video de **Bodega de Belleza** (Inversiones Brush CS S.A.S., Medellín) para Claude Code. Lo construye
IA Master Tech dentro del Paquete 3 (frente de creativos) y se entrega para que el equipo de Bodega lo use en su
propio Claude. Parte de Master Motion (`UPSTREAM.md`).

- **Dónde corre:** `estudio.config.json` → `ejecucion: local` (el computador donde está instalado) o `vps` (VPS de
  Bodega por SSH). Todo lo pesado pasa por `scripts/host.sh`. **Nunca** se manda material de Bodega a otros
  servidores, incluidos los de IA Master Tech (cláusula 9 del contrato y D-025 del repo de la app).
- **Datos personales:** crudos, podcast, referentes descargados y renders van en `trabajo/` o
  `studio/public/clientes/`, que están fuera de git. No se suben a repos ni a servicios externos sin permiso de Bodega.
- **Marca:** `studio/src/marca/` (manual oficial en `tokens-bodega.json`). No se cambia, no se recolorea el logo y
  no se generan logos con IA. Reglas de edición de Bodega: skill `estilo-bodega`.
- Toda pieza a medida pasa por la skill `master-motion` (brief → guion → voz → estilo → storyboard → animática →
  animación → crítico → entrega). Para algo que cabe en una plantilla: skill `mm-plantillas`.
- Antes de animar, `kb/10-anti-look-ia.md`. Antes de entregar, `node scripts/verify.mjs` en verde.
- Primer paso en un equipo nuevo: `/bodega-doctor` (o `bash scripts/doctor.sh`) y `bash scripts/humo.sh`.
- No se inventan precios, promociones, cifras ni testimonios: los confirma Bodega.
- Remotion exige Company License para empresas de más de 3 personas: Bodega debe tenerla (`CREDITOS.md`).
