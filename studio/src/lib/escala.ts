import { useVideoConfig } from "remotion";

/**
 * Escala del lienzo. `u` vale 1 px cuando el lado corto mide 1080: todo se diseña en esa unidad
 * y funciona igual en 9:16, 16:9, 1:1 y 4:5. `zona` es el margen seguro del formato
 * (en vertical deja libre la interfaz de Reels y TikTok: 14 % arriba y 20 % abajo).
 */
export const useEscala = () => {
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const vertical = height > width;
  const horizontal = width > height;
  const zona = {
    arriba: vertical ? height * 0.14 : 80 * u,
    abajo: vertical ? height * 0.2 : 80 * u,
    lados: (vertical ? 72 : 120) * u,
  };
  return { u, ancho: width, alto: height, vertical, horizontal, zona };
};
