/** Formatos de entrega. Las piezas se diseñan una vez y se adaptan con `useEscala()`. */
export const FPS = 30;

export const FORMATOS = {
  vertical: { ancho: 1080, alto: 1920, uso: "9:16 · Reels, TikTok, Shorts" },
  horizontal: { ancho: 1920, alto: 1080, uso: "16:9 · YouTube, web, VSL" },
  cuadrado: { ancho: 1080, alto: 1080, uso: "1:1 · feed" },
  retrato: { ancho: 1080, alto: 1350, uso: "4:5 · feed de Instagram" },
} as const;

export type Formato = keyof typeof FORMATOS;

/** Segundos a cuadros. */
export const cuadros = (segundos: number) => Math.round(segundos * FPS);
