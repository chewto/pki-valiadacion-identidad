import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clipBoxToFrame, cropDetections } from "./document-crops";
import type { DocumentDetection } from "./document-postprocess";

const detection = (
  label: string,
  score: number,
  box: DocumentDetection["box"]
): DocumentDetection => ({
  classId: 0,
  label,
  score,
  box,
});

describe("document-crops", () => {
  beforeEach(() => {
    const context = {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as never
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/jpeg;base64,AAAA"
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("recorta y limita las detecciones por confianza", () => {
    const source = document.createElement("canvas");
    source.width = 1000;
    source.height = 800;

    const crops = cropDetections(
      source,
      [
        detection("BAJA", 0.4, { x1: 10, y1: 10, x2: 200, y2: 150 }),
        detection("ALTA", 0.95, { x1: 100, y1: 100, x2: 500, y2: 400 }),
      ],
      { maxCrops: 1, maxDimension: 240 }
    );

    expect(crops).toHaveLength(1);
    expect(crops[0].label).toBe("ALTA");
    expect(crops[0].width).toBeLessThanOrEqual(240);
    expect(crops[0].height).toBeLessThanOrEqual(240);
    expect(crops[0].dataUrl.startsWith("data:image/jpeg")).toBe(true);
  });

  it("descarta cajas pequeñas o degeneradas", () => {
    const source = document.createElement("canvas");
    source.width = 500;
    source.height = 500;

    const crops = cropDetections(source, [
      detection("MINI", 0.9, { x1: 10, y1: 10, x2: 15, y2: 15 }),
      detection("INVERTIDA", 0.8, { x1: 100, y1: 100, x2: 50, y2: 50 }),
    ]);

    expect(crops).toHaveLength(0);
  });

  it("recorta cajas que se salen del frame", () => {
    const clipped = clipBoxToFrame(
      { x1: -20, y1: -30, x2: 1200, y2: 900 },
      800,
      600,
      12
    );
    expect(clipped).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });
});
