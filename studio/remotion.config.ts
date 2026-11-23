import { Config } from "@remotion/cli/config";

// Entrega en H.264 yuv420p (se abre en cualquier red y reproductor). Los cuadros intermedios en JPEG
// de alta calidad: más rápido que PNG y sin pérdida visible. Para capas con alfa, render a ProRes 4444.
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
