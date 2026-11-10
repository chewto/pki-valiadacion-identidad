import type { LetterboxTransform } from "./document-preprocess";
import { letterboxBoxToSource } from "./document-preprocess";

export interface DetectionBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DocumentDetection {
  classId: number;
  label: string;
  score: number;
  box: DetectionBox;
}

export interface DecodeOptions {
  confidence: number;
  iou: number;
}

export const iou = (a: DetectionBox, b: DetectionBox): number => {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
  const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
  const union = areaA + areaB - intersection;
  return union > 0 ? intersection / union : 0;
};

/**
 * Decodifica la salida de Ultralytics sin NMS: [1, 4 + nc, anchors].
 * Las filas 0..3 son cx, cy, w, h en píxeles del canvas de entrada.
 */
export const decodeYoloOutput = (
  data: Float32Array,
  dimensions: readonly number[],
  labels: readonly string[],
  confidence: number
): DocumentDetection[] => {
  if (dimensions.length !== 3) return [];

  const channels = dimensions[1];
  const anchors = dimensions[2];
  const classCount = Math.max(0, channels - 4);
  const detections: DocumentDetection[] = [];

  for (let anchor = 0; anchor < anchors; anchor += 1) {
    let classId = -1;
    let score = 0;

    for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
      const value = data[(4 + classIndex) * anchors + anchor];
      if (value > score) {
        score = value;
        classId = classIndex;
      }
    }

    if (classId < 0 || score < confidence) continue;

    const cx = data[anchor];
    const cy = data[anchors + anchor];
    const width = data[2 * anchors + anchor];
    const height = data[3 * anchors + anchor];

    if (![cx, cy, width, height].every(Number.isFinite)) continue;

    detections.push({
      classId,
      label: labels[classId] ?? String(classId),
      score,
      box: {
        x1: cx - width / 2,
        y1: cy - height / 2,
        x2: cx + width / 2,
        y2: cy + height / 2,
      },
    });
  }

  return detections;
};

/** NMS por clase. */
export const nonMaxSuppression = (
  detections: readonly DocumentDetection[],
  iouThreshold: number
): DocumentDetection[] => {
  const byClass = new Map<number, DocumentDetection[]>();

  for (const detection of detections) {
    const current = byClass.get(detection.classId) ?? [];
    current.push(detection);
    byClass.set(detection.classId, current);
  }

  const kept: DocumentDetection[] = [];

  byClass.forEach((items) => {
    const pending = [...items].sort((a, b) => b.score - a.score);

    while (pending.length > 0) {
      const head = pending.shift();
      if (!head) break;
      kept.push(head);

      for (let i = pending.length - 1; i >= 0; i -= 1) {
        if (iou(head.box, pending[i].box) > iouThreshold) {
          pending.splice(i, 1);
        }
      }
    }
  });

  return kept;
};

export const mapDetectionsToSource = (
  detections: readonly DocumentDetection[],
  transform: LetterboxTransform
): DocumentDetection[] =>
  detections.map((detection) => ({
    ...detection,
    box: letterboxBoxToSource(detection.box, transform),
  }));

export const decodeAndMap = (
  data: Float32Array,
  dimensions: readonly number[],
  labels: readonly string[],
  transform: LetterboxTransform,
  options: DecodeOptions
): DocumentDetection[] => {
  const raw = decodeYoloOutput(data, dimensions, labels, options.confidence);
  const suppressed = nonMaxSuppression(raw, options.iou);
  return mapDetectionsToSource(suppressed, transform);
};
