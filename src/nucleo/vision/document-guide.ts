import type { GuideSideProfile } from "./document-model.config";
import {
  DOCUMENT_CONTAINERS,
  FIELD_DISPLAY_NAMES,
  GUIDE_SCALE_TOLERANCE,
  GUIDE_THRESHOLDS,
  isDocumentCountry,
  normalizeDocumentType,
} from "./document-model.config";
import type { DocumentDetection } from "./document-postprocess";
import type { DocumentFit } from "./document-fit";
import {
  assessDocumentFit,
  GUIDE_TARGET_RECT,
  NO_FIT,
} from "./document-fit";

export interface FrameQuality {
  luminance: number;
  glareRatio: number;
  sharpness: number;
  sampleSize: number;
}

export type GuideCode =
  | "starting"
  | "no_document"
  | "wrong_side"
  | "wrong_document"
  | "multiple_documents"
  | "out_of_frame"
  | "too_far"
  | "too_close"
  | "off_center"
  | "blurry"
  | "dark"
  | "bright"
  | "glare"
  | "ready";

export interface GuideState {
  code: GuideCode;
  message: string;
  hint: string;
  canCapture: boolean;
  /**
   * Campos del perfil que el modelo no alcanzó a ver. Es informativo: ya no
   * bloquean la captura, porque el tamaño y el encuadre son lo único que el
   * front necesita para tomar la foto que procesará el backend.
   */
  missing: string[];
  detectedLabels: string[];
  /** Encaje del documento contra el recuadro (tamaño y bordes). */
  fit: DocumentFit;
  containerBoxes: Array<{
    label: string;
    box: { x1: number; y1: number; x2: number; y2: number };
  }>;
}

export interface GuideInput {
  country: string;
  tipoDocumento: string;
  side: "anverso" | "reverso";
  detections: readonly DocumentDetection[];
  profile: GuideSideProfile;
  quality: FrameQuality | null;
  frameWidth: number;
  frameHeight: number;
  /** Sobrescribe la tolerancia de entorno (útil en pruebas). */
  tolerance?: number;
}

export interface FieldChecklistItem {
  label: string;
  displayName: string;
  detected: boolean;
  required: boolean;
}

const getUnionBox = (detections: readonly DocumentDetection[]) => {
  if (detections.length === 0) return null;
  let x1 = Number.POSITIVE_INFINITY;
  let y1 = Number.POSITIVE_INFINITY;
  let x2 = Number.NEGATIVE_INFINITY;
  let y2 = Number.NEGATIVE_INFINITY;

  for (const detection of detections) {
    x1 = Math.min(x1, detection.box.x1);
    y1 = Math.min(y1, detection.box.y1);
    x2 = Math.max(x2, detection.box.x2);
    y2 = Math.max(y2, detection.box.y2);
  }

  return { x1, y1, x2, y2 };
};

const getWrongSide = (
  detected: readonly string[],
  expectedSide: "anverso" | "reverso"
): GuideState | null => {
  const looksLikeBack =
    detected.some((label) => /REVERSO$/i.test(label)) ||
    detected.includes("dni_reverso");
  const looksLikeFront =
    detected.some((label) => /FRONTAL$/i.test(label)) ||
    detected.includes("dni_anverso");

  if (expectedSide === "anverso" && looksLikeBack) {
    return {
      code: "wrong_side",
      message: "Estás mostrando el reverso.",
      hint: "Voltea el documento y enséñanos el anverso.",
      canCapture: false,
      missing: [],
      detectedLabels: [...detected],
      fit: NO_FIT,
      containerBoxes: [],
    };
  }

  if (expectedSide === "reverso" && looksLikeFront) {
    return {
      code: "wrong_side",
      message: "Estás mostrando el anverso.",
      hint: "Voltea el documento y enséñanos el reverso.",
      canCapture: false,
      missing: [],
      detectedLabels: [...detected],
      fit: NO_FIT,
      containerBoxes: [],
    };
  }

  return null;
};

export const getFieldChecklist = (
  profile: GuideSideProfile,
  detections: readonly DocumentDetection[]
): FieldChecklistItem[] => {
  const detectedLabels = new Set(detections.map((detection) => detection.label));
  const labels = [...new Set([...profile.required, ...profile.recommended])];

  return labels.map((label) => ({
    label,
    displayName: FIELD_DISPLAY_NAMES[label] ?? label,
    detected: detectedLabels.has(label),
    required: profile.required.includes(label),
  }));
};

export const getMissingRequiredLabels = (
  profile: GuideSideProfile,
  detectedLabels: ReadonlySet<string>
): string[] =>
  profile.required.filter((label) => !detectedLabels.has(label));

export const buildGuideState = (input: GuideInput): GuideState => {
  const {
    country,
    side,
    detections,
    profile,
    quality,
    frameWidth,
    frameHeight,
  } = input;
  const detectedLabels = detections.map((detection) => detection.label);
  const detectedSet = new Set(detectedLabels);
  const expectedContainers = new Set(profile.containers);
  const expectedDetections = detections.filter((detection) =>
    expectedContainers.has(detection.label)
  );
  const allContainers = isDocumentCountry(country)
    ? new Set(DOCUMENT_CONTAINERS[country])
    : new Set<string>();
  const anyContainerDetections = detections.filter((detection) =>
    allContainers.has(detection.label)
  );
  const containerBoxes = anyContainerDetections.map((detection) => ({
    label: detection.label,
    box: detection.box,
  }));

  if (expectedDetections.length === 0) {
    if (anyContainerDetections.length > 0) {
      const wrongSide = getWrongSide(detectedLabels, side);
      if (wrongSide) return { ...wrongSide, containerBoxes };

      const detectedDescription = anyContainerDetections
        .map((detection) => detection.label)
        .join(", ");
      return {
        code: "wrong_document",
        message: "Este documento no coincide con el que necesitamos.",
        hint: `Detectamos ${detectedDescription}. Verifica el tipo de documento seleccionado.`,
        canCapture: false,
        missing: [],
        detectedLabels,
        fit: NO_FIT,
        containerBoxes,
      };
    }

    return {
      code: "no_document",
      message: "Coloca el documento dentro del marco.",
      hint: "Muestra el documento completo, sin taparlo con los dedos.",
      canCapture: false,
      missing: [],
      detectedLabels,
      fit: NO_FIT,
      containerBoxes,
    };
  }

  if (expectedDetections.length > 1) {
    return {
      code: "multiple_documents",
      message: "Muestra solo un documento.",
      hint: "Retira otros documentos o tarjetas de la vista.",
      canCapture: false,
      missing: [],
      detectedLabels,
      fit: NO_FIT,
      containerBoxes,
    };
  }

  const union = getUnionBox(expectedDetections);
  if (!union) {
    return {
      code: "no_document",
      message: "Coloca el documento dentro del marco.",
      hint: "Muestra el documento completo, sin taparlo con los dedos.",
      canCapture: false,
      missing: [],
      detectedLabels,
      fit: NO_FIT,
      containerBoxes,
    };
  }

  const fit = assessDocumentFit({
    box: union,
    frameWidth,
    frameHeight,
    tolerance: input.tolerance ?? GUIDE_SCALE_TOLERANCE,
  });

  const centerX = (union.x1 + union.x2) / 2;
  const centerY = (union.y1 + union.y2) / 2;
  const targetCenterX = ((GUIDE_TARGET_RECT.x1 + GUIDE_TARGET_RECT.x2) / 2) *
    Math.max(frameWidth, 1);
  const targetCenterY = ((GUIDE_TARGET_RECT.y1 + GUIDE_TARGET_RECT.y2) / 2) *
    Math.max(frameHeight, 1);
  const offsetX = Math.abs(centerX - targetCenterX) / Math.max(frameWidth, 1);
  const offsetY = Math.abs(centerY - targetCenterY) / Math.max(frameHeight, 1);
  const touchesEdge =
    union.x1 < frameWidth * 0.01 ||
    union.y1 < frameHeight * 0.01 ||
    union.x2 > frameWidth * 0.99 ||
    union.y2 > frameHeight * 0.99;

  if (touchesEdge) {
    // Con los bordes del frame cortados la distancia no es la instrucción
    // útil, así que el recuadro se mantiene neutro.
    return {
      code: "out_of_frame",
      message: "Muestra todo el documento.",
      hint: "Acércalo un poco sin cortar los bordes.",
      canCapture: false,
      missing: [],
      detectedLabels,
      fit: NO_FIT,
      containerBoxes,
    };
  }

  if (fit.state === "too_far") {
    return {
      code: "too_far",
      message: "Acerca el documento.",
      hint: `Ocupa el ${fit.scalePercent}% del recuadro; acércalo hasta llenarlo.`,
      canCapture: false,
      missing: [],
      detectedLabels,
      fit,
      containerBoxes,
    };
  }

  if (fit.state === "too_close") {
    return {
      code: "too_close",
      message: "Aleja un poco el documento.",
      hint: `Ocupa el ${fit.scalePercent}% del recuadro; aléjalo un poco para que quepa completo.`,
      canCapture: false,
      missing: [],
      detectedLabels,
      fit,
      containerBoxes,
    };
  }

  if (
    offsetX > GUIDE_THRESHOLDS.maxCenterOffset ||
    offsetY > GUIDE_THRESHOLDS.maxCenterOffset
  ) {
    return {
      code: "off_center",
      message: "Centra el documento.",
      hint: "Alinea el documento con el recuadro.",
      canCapture: false,
      missing: [],
      detectedLabels,
      fit,
      containerBoxes,
    };
  }

  if (quality) {
    if (quality.luminance < GUIDE_THRESHOLDS.minLuminance) {
      return {
        code: "dark",
        message: "Hay poca luz.",
        hint: "Busca una zona mejor iluminada y evita el contraluz.",
        canCapture: false,
        missing: [],
        detectedLabels,
        fit,
        containerBoxes,
      };
    }

    if (quality.luminance > GUIDE_THRESHOLDS.maxLuminance) {
      return {
        code: "bright",
        message: "Hay demasiada luz.",
        hint: "Evita la luz directa sobre el documento.",
        canCapture: false,
        missing: [],
        detectedLabels,
        fit,
        containerBoxes,
      };
    }

    if (quality.glareRatio > GUIDE_THRESHOLDS.maxGlareRatio) {
      return {
        code: "glare",
        message: "Evita los reflejos.",
        hint: "Inclina un poco el documento o cambia la fuente de luz.",
        canCapture: false,
        missing: [],
        detectedLabels,
        fit,
        containerBoxes,
      };
    }

    if (
      Number.isFinite(quality.sharpness) &&
      quality.sharpness < GUIDE_THRESHOLDS.minSharpness
    ) {
      return {
        code: "blurry",
        message: "La imagen está borrosa.",
        hint: "Mantén el pulso firme y toca la pantalla para enfocar.",
        canCapture: false,
        missing: [],
        detectedLabels,
        fit,
        containerBoxes,
      };
    }
  }

  // Los campos no bloquean: si el documento está alineado y del tamaño del
  // recuadro se captura igual. El backend se encarga de leer y validar los
  // datos; el front solo necesita la imagen en el tamaño correcto.
  const missing = getMissingRequiredLabels(profile, detectedSet).map(
    (label) => FIELD_DISPLAY_NAMES[label] ?? label
  );

  return {
    code: "ready",
    message: "Perfecto, no muevas.",
    hint: "Tamaño y encuadre correctos. Capturaremos la foto automáticamente.",
    canCapture: true,
    missing,
    detectedLabels,
    fit,
    containerBoxes,
  };
};

export const describeGuide = (
  state: GuideState | null | undefined
): { message: string; hint: string } => {
  if (!state) {
    return {
      message: "Preparando la cámara...",
      hint: "En un momento podrás alinear el documento.",
    };
  }
  return { message: state.message, hint: state.hint };
};

export const getDocumentGuideKey = (
  country: string,
  tipoDocumento: string
): string => `${country}:${normalizeDocumentType(tipoDocumento)}`;
