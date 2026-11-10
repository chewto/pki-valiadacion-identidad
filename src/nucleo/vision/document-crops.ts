import type { DocumentDetection } from "./document-postprocess";

export interface DocumentCrop {
  id: string;
  label: string;
  score: number;
  box: { x1: number; y1: number; x2: number; y2: number };
  dataUrl: string;
  width: number;
  height: number;
}

export interface CropOptions {
  maxCrops?: number;
  minSize?: number;
  maxDimension?: number;
  quality?: number;
}

interface ClippedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const clipBoxToFrame = (
  box: DocumentDetection["box"],
  frameWidth: number,
  frameHeight: number,
  minSize: number
): ClippedBox | null => {
  if (
    frameWidth <= 0 ||
    frameHeight <= 0 ||
    box.x2 <= box.x1 ||
    box.y2 <= box.y1 ||
    ![box.x1, box.y1, box.x2, box.y2].every(Number.isFinite)
  ) {
    return null;
  }

  const x1 = Math.max(0, box.x1);
  const y1 = Math.max(0, box.y1);
  const x2 = Math.min(frameWidth, box.x2);
  const y2 = Math.min(frameHeight, box.y2);
  const width = Math.floor(x2 - x1);
  const height = Math.floor(y2 - y1);

  if (width < minSize || height < minSize) return null;

  return { x: Math.floor(x1), y: Math.floor(y1), width, height };
};

const createCropCanvas = (
  source: HTMLCanvasElement,
  clipped: ClippedBox,
  maxDimension: number
): HTMLCanvasElement | null => {
  const scale = Math.min(
    1,
    maxDimension / Math.max(clipped.width, clipped.height)
  );
  const width = Math.max(1, Math.round(clipped.width * scale));
  const height = Math.max(1, Math.round(clipped.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });

  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    clipped.x,
    clipped.y,
    clipped.width,
    clipped.height,
    0,
    0,
    width,
    height
  );

  return canvas;
};

/**
 * Recorta cada detección del frame actual y devuelve data URLs JPEG.
 * Las cajas se recortan al tamaño del frame y se descartan las degeneradas.
 */
export const cropDetections = (
  source: HTMLCanvasElement,
  detections: readonly DocumentDetection[],
  options: CropOptions = {}
): DocumentCrop[] => {
  const {
    maxCrops = 24,
    minSize = 12,
    maxDimension = 240,
    quality = 0.78,
  } = options;

  if (source.width <= 0 || source.height <= 0) return [];

  const ordered = [...detections].sort((a, b) => b.score - a.score);
  const crops: DocumentCrop[] = [];

  for (const detection of ordered) {
    if (crops.length >= maxCrops) break;

    const clipped = clipBoxToFrame(
      detection.box,
      source.width,
      source.height,
      minSize
    );
    if (!clipped) continue;

    const canvas = createCropCanvas(source, clipped, maxDimension);
    if (!canvas) continue;

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (!dataUrl.startsWith("data:image")) continue;

      crops.push({
        id: `${detection.label}-${crops.length}`,
        label: detection.label,
        score: detection.score,
        box: detection.box,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
      });
    } catch {
      // Un canvas contaminado no puede exportarse; se omite el recorte.
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  }

  return crops;
};
