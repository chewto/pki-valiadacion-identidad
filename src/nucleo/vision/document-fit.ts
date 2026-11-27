import type { DetectionBox } from "./document-postprocess";

/**
 * Rectángulo objetivo (el recuadro punteado) en coordenadas normalizadas del
 * frame de la cámara. Es la única fuente de verdad: tanto la lógica de guía
 * como el estilo del recuadro usan estos valores.
 */
export interface GuideTargetRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const GUIDE_TARGET_RECT: GuideTargetRect = {
  x1: 0.06,
  y1: 0.08,
  x2: 0.94,
  y2: 0.92,
};

export const DEFAULT_SCALE_TOLERANCE = 0.12;
export const MIN_SCALE_TOLERANCE = 0.01;
export const MAX_SCALE_TOLERANCE = 0.5;

export type DocumentFitState =
  | "unknown"
  | "too_far"
  | "too_close"
  | "aligned";

export interface DocumentFit {
  state: DocumentFitState;
  /** 1 = el documento llena el recuadro en su eje dominante. */
  scaleRatio: number;
  /** Porcentaje redondeado para la interfaz. */
  scalePercent: number;
  /** 0..1, para el brillo progresivo del recuadro. */
  closeness: number;
  /** Tolerancia efectivamente aplicada. */
  tolerance: number;
  /** Cuánto sobresale la caja fuera del recuadro, relativo a su tamaño. */
  overflow: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

const EMPTY_OVERFLOW = { left: 0, right: 0, top: 0, bottom: 0 };

export const NO_FIT: DocumentFit = {
  state: "unknown",
  scaleRatio: 0,
  scalePercent: 0,
  closeness: 0,
  tolerance: DEFAULT_SCALE_TOLERANCE,
  overflow: EMPTY_OVERFLOW,
};

/**
 * Normaliza la tolerancia de tamaño. Acepta fracciones (`0.12`) o porcentajes
 * (`12`) y la limita a un rango que mantiene la guía usable.
 */
export const normalizeScaleTolerance = (value: unknown): number => {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_SCALE_TOLERANCE;
  }

  const fraction = numeric > 1 ? numeric / 100 : numeric;
  return Math.min(MAX_SCALE_TOLERANCE, Math.max(MIN_SCALE_TOLERANCE, fraction));
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isValidBox = (box: DetectionBox): boolean =>
  [box.x1, box.y1, box.x2, box.y2].every(Number.isFinite) &&
  box.x2 - box.x1 > 1 &&
  box.y2 - box.y1 > 1;

export interface AssessDocumentFitInput {
  box: DetectionBox;
  frameWidth: number;
  frameHeight: number;
  tolerance?: number;
  target?: GuideTargetRect;
}

/**
 * Compara los bordes del documento detectado con los bordes del recuadro.
 *
 * Se usa el eje dominante (`max`) porque la relación de aspecto del documento
 * no coincide con la del recuadro: así basta con llenar un eje y no se le pide
 * al usuario acercarse indefinidamente.
 */
export const assessDocumentFit = (
  input: AssessDocumentFitInput
): DocumentFit => {
  const { box, frameWidth, frameHeight } = input;
  const tolerance = normalizeScaleTolerance(
    input.tolerance ?? DEFAULT_SCALE_TOLERANCE
  );
  const target = input.target ?? GUIDE_TARGET_RECT;

  const frameValid =
    Number.isFinite(frameWidth) &&
    Number.isFinite(frameHeight) &&
    frameWidth > 0 &&
    frameHeight > 0;
  if (!frameValid || !isValidBox(box)) return NO_FIT;

  const targetW = (target.x2 - target.x1) * frameWidth;
  const targetH = (target.y2 - target.y1) * frameHeight;
  if (!(targetW > 0) || !(targetH > 0)) return NO_FIT;

  const docWidth = box.x2 - box.x1;
  const docHeight = box.y2 - box.y1;
  const scaleRatio = Math.max(docWidth / targetW, docHeight / targetH);
  const scalePercent = Math.round(scaleRatio * 100);

  const state: DocumentFitState =
    scaleRatio < 1 - tolerance
      ? "too_far"
      : scaleRatio > 1 + tolerance
        ? "too_close"
        : "aligned";

  const closeness = clamp(
    1 - Math.abs(scaleRatio - 1) / (1 - tolerance),
    0,
    1
  );

  const targetX1 = target.x1 * frameWidth;
  const targetY1 = target.y1 * frameHeight;
  const targetX2 = target.x2 * frameWidth;
  const targetY2 = target.y2 * frameHeight;

  const overflow = {
    left: Math.max(0, targetX1 - box.x1) / targetW,
    right: Math.max(0, box.x2 - targetX2) / targetW,
    top: Math.max(0, targetY1 - box.y1) / targetH,
    bottom: Math.max(0, box.y2 - targetY2) / targetH,
  };

  return { state, scaleRatio, scalePercent, closeness, tolerance, overflow };
};
