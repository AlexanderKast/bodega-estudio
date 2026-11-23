# Bodega Estudio en el VPS de Bodega (CPU, sin GPU). Remotion + ffmpeg + faster-whisper.
FROM node:22-bookworm-slim

# Dependencias del sistema: ffmpeg, python, tesseract y las librerías del Chrome headless de Remotion.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-pip python3-venv git ca-certificates fonts-noto-color-emoji \
      tesseract-ocr tesseract-ocr-spa \
      libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev libxfixes3 \
      libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
    && apt-get clean

RUN python3 -m venv /opt/py && /opt/py/bin/pip install --no-cache-dir faster-whisper numpy scipy yt-dlp
ENV PATH="/opt/py/bin:$PATH" PY=python3 HF_HOME=/estudio/trabajo/.modelos

WORKDIR /estudio
COPY studio/package.json studio/package-lock.json studio/
RUN cd studio && npm ci --no-audit --no-fund && npx remotion browser ensure

# Corre como `node` (uid 1000, el mismo de `deploy` en el VPS) para que los renders y temporales del volumen
# queden del usuario del VPS y no de root.
RUN chown -R node:node /estudio
USER node

# El código entra por volumen (ver docker-compose.yml); el contenedor queda vivo para `docker exec`.
CMD ["sleep", "infinity"]
