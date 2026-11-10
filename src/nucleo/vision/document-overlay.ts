import type { DocumentDetection } from "./document-postprocess";

export interface DrawDetectionsOptions {
  frameWidth: number;
  frameHeight: number;
  clear?: boolean;
}

const LABEL_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
  "#f97316",
  "#14b8a6",
];

export const colorForLabel = (label: string): string => {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
};

const isValidBox = (box: DocumentDetection["box"]): boolean =>
  [box.x1, box.y1, box.x2, box.y2].every(Number.isFinite) &&
  box.x2 - box.x1 > 1 &&
  box.y2 - box.y1 > 1;

/**
 * Dibuja todas las detecciones con su etiqueta y confianza sobre el canvas
 * del tamaño interno del video.
 */
export const drawDetections = (
  ctx: CanvasRenderingContext2D,
  detections: readonly DocumentDetection[],
  options: DrawDetectionsOptions
): void => {
  const { frameWidth, frameHeight, clear = true } = options;
  if (frameWidth <= 0 || frameHeight <= 0) return;

  if (clear) {
    ctx.clearRect(0, 0, frameWidth, frameHeight);
  }

  const scale = Math.max(1, frameWidth / 960);
  const lineWidth = Math.max(2, Math.round(3 * scale));
  const fontSize = Math.max(12, Math.round(17 * scale));
  const padding = Math.max(4, Math.round(6 * scale));
  const labelHeight = fontSize + padding * 2;

  ctx.lineWidth = lineWidth;
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textBaseline = "top";

  for (const detection of detections) {
    if (!isValidBox(detection.box)) continue;

    const { x1, y1, x2, y2 } = detection.box;
    const width = x2 - x1;
    const height = y2 - y1;
    const color = colorForLabel(detection.label);
    const text = `${detection.label} ${Math.round(detection.score * 100)}%`;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x1, y1, width, height);

    const measured = ctx.measureText(text);
    const textWidth = Number.isFinite(measured.width) ? measured.width : 0;
    const labelWidth = textWidth + padding * 2;
    const labelY = y1 > labelHeight ? y1 - labelHeight : y1;

    ctx.fillStyle = color;
    ctx.fillRect(x1, labelY, labelWidth, labelHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x1 + padding, labelY + padding);
  }
};
