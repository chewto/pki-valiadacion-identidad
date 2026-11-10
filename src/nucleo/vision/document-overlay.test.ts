import { describe, expect, it, vi } from "vitest";
import { colorForLabel, drawDetections } from "./document-overlay";
import type { DocumentDetection } from "./document-postprocess";

const createContext = () => {
  const ctx = {
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 80 })),
    lineWidth: 1,
    font: "",
    textBaseline: "top",
    strokeStyle: "#000",
    fillStyle: "#000",
  } as unknown as CanvasRenderingContext2D;
  return ctx;
};

const detection = (label: string, score = 0.91): DocumentDetection => ({
  classId: 0,
  label,
  score,
  box: { x1: 100, y1: 120, x2: 300, y2: 260 },
});

describe("document-overlay", () => {
  it("dibuja caja, etiqueta y porcentaje de confianza", () => {
    const ctx = createContext();
    drawDetections(ctx, [detection("NOMBRES")], {
      frameWidth: 1280,
      frameHeight: 720,
    });

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1280, 720);
    expect(ctx.strokeRect).toHaveBeenCalledWith(100, 120, 200, 140);
    expect(ctx.fillText).toHaveBeenCalledWith(
      "NOMBRES 91%",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("ignora cajas degeneradas y frames sin tamaño", () => {
    const ctx = createContext();
    drawDetections(
      ctx,
      [
        {
          ...detection("VACIA"),
          box: { x1: 10, y1: 10, x2: 10, y2: 10 },
        },
      ],
      { frameWidth: 1280, frameHeight: 720 }
    );
    expect(ctx.strokeRect).not.toHaveBeenCalled();

    vi.mocked(ctx.clearRect).mockClear();
    drawDetections(ctx, [detection("NOMBRES")], {
      frameWidth: 0,
      frameHeight: 0,
    });
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it("asigna un color estable por etiqueta", () => {
    expect(colorForLabel("NOMBRES")).toBe(colorForLabel("NOMBRES"));
    expect(colorForLabel("NOMBRES")).not.toBe(colorForLabel("APELLIDOS"));
  });
});
