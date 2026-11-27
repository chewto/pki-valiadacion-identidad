import { describe, expect, it } from "vitest";
import {
  assessDocumentFit,
  DEFAULT_SCALE_TOLERANCE,
  normalizeScaleTolerance,
  NO_FIT,
} from "./document-fit";

// Frame de 1000×1000: el recuadro va de (60, 80) a (940, 920),
// es decir 880 px de ancho por 840 px de alto.
const base = {
  frameWidth: 1000,
  frameHeight: 1000,
};

describe("document-fit", () => {
  it("devuelve un estado desconocido sin dimensiones de frame", () => {
    const fit = assessDocumentFit({
      ...base,
      frameWidth: 0,
      frameHeight: 0,
      box: { x1: 100, y1: 100, x2: 900, y2: 900 },
    });
    expect(fit).toEqual(NO_FIT);
  });

  it("devuelve un estado desconocido con una caja inválida", () => {
    const fit = assessDocumentFit({
      ...base,
      box: { x1: 500, y1: 500, x2: 500, y2: 500 },
    });
    expect(fit.state).toBe("unknown");
  });

  it("pide acercar cuando el documento es menor que el recuadro", () => {
    const fit = assessDocumentFit({
      ...base,
      box: { x1: 300, y1: 350, x2: 700, y2: 650 },
    });
    expect(fit.state).toBe("too_far");
    expect(fit.scalePercent).toBe(45);
    expect(fit.closeness).toBeGreaterThan(0);
    expect(fit.closeness).toBeLessThan(0.5);
  });

  it("marca el tamaño ideal cuando el eje dominante llena el recuadro", () => {
    const fit = assessDocumentFit({
      ...base,
      box: { x1: 100, y1: 150, x2: 900, y2: 800 },
    });
    expect(fit.state).toBe("aligned");
    expect(fit.scalePercent).toBe(91);
    expect(fit.closeness).toBeGreaterThan(0.7);
    expect(fit.overflow).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
  });

  it("considera el límite exacto de la tolerancia como alineado", () => {
    const fit = assessDocumentFit({
      ...base,
      tolerance: 0.2,
      box: { x1: 100, y1: 300, x2: 804, y2: 700 },
    });
    expect(fit.scaleRatio).toBeCloseTo(0.8);
    expect(fit.state).toBe("aligned");
  });

  it("pide alejar cuando el documento sobresale del recuadro", () => {
    const fit = assessDocumentFit({
      ...base,
      box: { x1: 100, y1: 25, x2: 900, y2: 975 },
    });
    expect(fit.state).toBe("too_close");
    expect(fit.scalePercent).toBe(113);
    expect(fit.overflow.top).toBeGreaterThan(0);
    expect(fit.overflow.bottom).toBeGreaterThan(0);
  });

  it("mide cuánto sobresale la caja por cada borde del recuadro", () => {
    const fit = assessDocumentFit({
      ...base,
      box: { x1: 20, y1: 200, x2: 900, y2: 800 },
    });
    expect(fit.state).toBe("aligned");
    expect(fit.overflow.left).toBeCloseTo(40 / 880);
    expect(fit.overflow.right).toBe(0);
  });

  it("usa el eje dominante con documentos anchos o altos", () => {
    const wide = assessDocumentFit({
      ...base,
      box: { x1: 100, y1: 300, x2: 900, y2: 600 },
    });
    expect(wide.state).toBe("aligned");

    const tall = assessDocumentFit({
      ...base,
      box: { x1: 500, y1: 100, x2: 580, y2: 900 },
    });
    expect(tall.state).toBe("aligned");
  });

  it("permite sobrescribir la tolerancia", () => {
    const box = { x1: 170, y1: 300, x2: 830, y2: 700 };
    expect(assessDocumentFit({ ...base, box }).state).toBe("too_far");
    expect(
      assessDocumentFit({ ...base, box, tolerance: 0.3 }).state
    ).toBe("aligned");
  });

  it("normaliza tolerancias en fracción o porcentaje", () => {
    expect(normalizeScaleTolerance("0.2")).toBe(0.2);
    expect(normalizeScaleTolerance("15")).toBe(0.15);
    expect(normalizeScaleTolerance(0.12)).toBe(0.12);
    expect(normalizeScaleTolerance("abc")).toBe(DEFAULT_SCALE_TOLERANCE);
    expect(normalizeScaleTolerance("-1")).toBe(DEFAULT_SCALE_TOLERANCE);
    expect(normalizeScaleTolerance("")).toBe(DEFAULT_SCALE_TOLERANCE);
    expect(normalizeScaleTolerance("0.001")).toBe(0.01);
    expect(normalizeScaleTolerance(0.9)).toBe(0.5);
  });
});
