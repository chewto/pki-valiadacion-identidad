import type { FrameQuality } from "./document-guide";

/**
 * Calcula métricas sencillas de calidad sobre los píxeles RGBA del frame.
 * La nitidez usa la varianza del laplaciano en escala de grises.
 */
export const computeFrameQuality = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): FrameQuality => {
  const pixelCount = Math.max(1, width * height);
  const gray = new Uint8ClampedArray(pixelCount);
  let luminanceTotal = 0;
  let glarePixels = 0;

  for (let i = 0; i < pixelCount; i += 1) {
    const offset = i * 4;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = luminance;
    luminanceTotal += luminance;

    if (r > 245 && g > 245 && b > 245) {
      glarePixels += 1;
    }
  }

  const step = 2;
  let laplacianSum = 0;
  let laplacianSquareSum = 0;
  let laplacianCount = 0;
  const stride = width;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const index = y * stride + x;
      const laplacian =
        -4 * gray[index] +
        gray[index - 1] +
        gray[index + 1] +
        gray[index - stride] +
        gray[index + stride];
      laplacianSum += laplacian;
      laplacianSquareSum += laplacian * laplacian;
      laplacianCount += 1;
    }
  }

  const mean =
    laplacianCount > 0 ? laplacianSum / laplacianCount : 0;
  const variance =
    laplacianCount > 0
      ? laplacianSquareSum / laplacianCount - mean * mean
      : 0;

  return {
    luminance: luminanceTotal / pixelCount,
    glareRatio: glarePixels / pixelCount,
    sharpness: variance,
    sampleSize: pixelCount,
  };
};
