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

describe("document-guide", () => {
  it("pide colocar el documento cuando no hay detecciones", () => {
    const state = buildGuideState({ ...baseInput(), detections: [] });
    expect(state.code).toBe("no_document");
    expect(state.canCapture).toBe(false);
  });

  it("detecta cuando el usuario muestra el reverso por error", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [detection("CEDULA_CIUDADANIA_REVERSO")],
    });
    expect(state.code).toBe("wrong_side");
    expect(state.message).toContain("reverso");
  });

  it("indica los campos que faltan", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [detection("CEDULA_CIUDADANIA_FRONTAL")],
    });
    expect(state.code).toBe("missing_fields");
    expect(state.missing).toEqual([
      "Nombres",
      "Apellidos",
      "N.º de documento",
    ]);
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
  });

  it("marca listo cuando el documento y los campos están completos", () => {
    const state = buildGuideState({
      ...baseInput(),
      detections: [
        detection("CEDULA_CIUDADANIA_FRONTAL"),
        detection("NOMBRES"),
        detection("APELLIDOS"),
        detection("NUMERO_DOCUMENTO"),
      ],
    });
    expect(state.code).toBe("ready");
    expect(state.canCapture).toBe(true);
    expect(state.containerBoxes).toHaveLength(1);
  });
});
