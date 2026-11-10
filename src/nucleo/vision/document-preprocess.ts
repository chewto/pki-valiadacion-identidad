export interface LetterboxTransform {
  targetSize: number;
  sourceWidth: number;
  sourceHeight: number;
  scale: number;
  dx: number;
  dy: number;
  drawWidth: number;
  drawHeight: number;
}

export const LETTERBOX_PADDING = 114;

export const computeLetterbox = (
  sourceWidth: number,
  sourceHeight: number,
  targetSize: number
): LetterboxTransform => {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetSize <= 0) {
    return {
      targetSize,
      sourceWidth,
      sourceHeight,
      scale: 1,
      dx: 0,
      dy: 0,
      drawWidth: 0,
      drawHeight: 0,
    };
  }

  const scale = Math.min(targetSize / sourceWidth, targetSize / sourceHeight);
  const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
  const drawHeight = Math.max(1, Math.round(sourceHeight * scale));

  return {
    targetSize,
    sourceWidth,
    sourceHeight,
    scale,
    dx: Math.floor((targetSize - drawWidth) / 2),
    dy: Math.floor((targetSize - drawHeight) / 2),
    drawWidth,
    drawHeight,
  };
};

/**
 * Convierte RGBA intercalado a un tensor NCHW float32 normalizado a [0, 1].
 * El canvas ya debe incluir el relleno del letterbox.
 */
export const rgbaToNchwTensor = (
  pixels: Uint8ClampedArray,
  targetSize: number
): Float32Array => {
  const plane = targetSize * targetSize;
  const data = new Float32Array(3 * plane);

  for (let i = 0; i < plane; i += 1) {
    const offset = i * 4;
    data[i] = pixels[offset] / 255;
    data[plane + i] = pixels[offset + 1] / 255;
    data[2 * plane + i] = pixels[offset + 2] / 255;
  }

  return data;
};

export const letterboxBoxToSource = (
  box: { x1: number; y1: number; x2: number; y2: number },
  transform: LetterboxTransform
): { x1: number; y1: number; x2: number; y2: number } => {
  const { scale, dx, dy, sourceWidth, sourceHeight } = transform;
  if (scale <= 0) return box;

  const x1 = Math.max(0, (box.x1 - dx) / scale);
  const y1 = Math.max(0, (box.y1 - dy) / scale);
  const x2 = Math.min(sourceWidth, (box.x2 - dx) / scale);
  const y2 = Math.min(sourceHeight, (box.y2 - dy) / scale);

  return { x1, y1, x2, y2 };
};
