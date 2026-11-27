import { describe, expect, it } from "vitest";
import { buildGuideState, type FrameQuality } from "./document-guide";
import { getGuideProfile } from "./document-model.config";
import type { DocumentDetection } from "./document-postprocess";

const quality: FrameQuality = {
  luminance: 120,
  glareRatio: 0,
  sharpness: 200,
  sampleSize: 1000,
};

// Caja del contenedor que llena el recuadro en un frame de 1000×1000.
const ALIGNED_BOX = { x1: 100, y1: 150, x2: 900, y2: 800 };

const detection = (
  label: string,
  box = { x1: 200, y1: 250, x2: 800, y2: 750 }
): DocumentDetection => ({
  classId: 0,
  label,
  score: 0.9,
  box,
});

const baseInput = () => ({
  country: "COL",
  tipoDocumento: "CEDULA DE CIUDADANIA",
  side: "anverso" as const,
  profile: getGuideProfile("COL", "CEDULA DE CIUDADANIA", "anverso")!,
  quality,
  frameWidth: 1000,
  frameHeight: 1000,
});

const withFields = (box = ALIGNED_BOX): DocumentDetection[] => [
  detection("CEDULA_CIUDADANIA_FRONTAL", box),
  detection("NOMBRES"),
  detection("APELLIDOS"),
  detection("NUMERO_DOCUMENTO"),
];

describe("document-guide", () => {
  it("pide colocar el documento cuando no hay detecciones", () => {
    const state = buildGuideState({ ...baseInput(), detections: [] });
    expect(state.code).toBe("no_document");
    expect(state.canCapture).toBe(false);
    expect(state.fit.state).toBe("unknown");
  });

  it("detecta cuando el usuario muestra el reverso por error", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [detection("CEDULA_CIUDADANIA_REVERSO")],
    });
    expect(state.code).toBe("wrong_side");
    expect(state.message).toContain("reverso");
    expect(state.fit.state).toBe("unknown");
  });

  it("indica los campos que faltan", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [detection("CEDULA_CIUDADANIA_FRONTAL", ALIGNED_BOX)],
    });
    expect(state.code).toBe("missing_fields");
    expect(state.missing).toEqual([
      "Nombres",
      "Apellidos",
      "N.º de documento",
    ]);
    expect(state.fit.state).toBe("aligned");
  });

  it("pide acercar cuando el documento se ve demasiado pequeño", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [
        detection("CEDULA_CIUDADANIA_FRONTAL", {
          x1: 400,
          y1: 400,
          x2: 600,
          y2: 600,
        }),
      ],
    });
    expect(state.code).toBe("too_far");
    expect(state.fit.state).toBe("too_far");
    expect(state.fit.scalePercent).toBe(24);
    expect(state.hint).toContain("24%");
    expect(state.hint).toContain("recuadro");
  });

  it("pide alejar cuando el documento sobresale del recuadro", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [
        detection("CEDULA_CIUDADANIA_FRONTAL", {
          x1: 100,
          y1: 25,
          x2: 900,
          y2: 975,
        }),
      ],
    });
    expect(state.code).toBe("too_close");
    expect(state.fit.state).toBe("too_close");
    expect(state.hint).toContain("113%");
    expect(state.hint).toContain("recuadro");
  });

  it("marca listo cuando el documento y los campos están completos", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: withFields(),
    });
    expect(state.code).toBe("ready");
    expect(state.canCapture).toBe(true);
    expect(state.containerBoxes).toHaveLength(1);
    expect(state.fit.state).toBe("aligned");
    expect(state.fit.scalePercent).toBe(91);
  });

  it("respeta una tolerancia sobrescrita en la entrada", () => {
    const smaller = { x1: 170, y1: 300, x2: 830, y2: 700 };

    const strict = buildGuideState({
      ...baseInput(),
      detections: withFields(smaller),
    });
    expect(strict.code).toBe("too_far");
    expect(strict.fit.tolerance).toBe(0.12);

    const relaxed = buildGuideState({
      ...baseInput(),
      tolerance: 0.3,
      detections: withFields(smaller),
    });
    expect(relaxed.code).toBe("ready");
    expect(relaxed.fit.state).toBe("aligned");
    expect(relaxed.fit.tolerance).toBe(0.3);
  });

  it("mantiene el recuadro neutro cuando el documento corta el frame", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [
        detection("CEDULA_CIUDADANIA_FRONTAL", {
          x1: 0,
          y1: 100,
          x2: 900,
          y2: 900,
        }),
      ],
    });
    expect(state.code).toBe("out_of_frame");
    expect(state.fit.state).toBe("unknown");
  });
});
