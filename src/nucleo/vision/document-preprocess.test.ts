import { describe, expect, it } from "vitest";
import {
  computeLetterbox,
  letterboxBoxToSource,
  rgbaToNchwTensor,
} from "./document-preprocess";

describe("document-preprocess", () => {
  it("calcula letterbox horizontal con padding vertical", () => {
    const transform = computeLetterbox(1920, 1080, 640);
    expect(transform.scale).toBeCloseTo(1 / 3);
    expect(transform.drawWidth).toBe(640);
    expect(transform.drawHeight).toBe(360);
    expect(transform.dx).toBe(0);
    expect(transform.dy).toBe(140);
  });

  it("calcula letterbox vertical con padding horizontal", () => {
    const transform = computeLetterbox(1080, 1920, 640);
    expect(transform.drawWidth).toBe(360);
    expect(transform.drawHeight).toBe(640);
    expect(transform.dx).toBe(140);
    expect(transform.dy).toBe(0);
  });

  it("convierte RGBA a NCHW normalizado", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255,
    ]);
    const tensor = rgbaToNchwTensor(pixels, 2);

    expect(tensor).toHaveLength(12);
    expect(tensor[0]).toBe(1);
    expect(tensor[1]).toBe(0);
    expect(tensor[2]).toBe(0);
    expect(tensor[3]).toBe(1);
    expect(tensor[4]).toBe(0);
    expect(tensor[5]).toBe(1);
  });

  it("deshace el letterbox y recorta a los límites de la imagen", () => {
    const transform = computeLetterbox(1920, 1080, 640);
    const box = letterboxBoxToSource(
      { x1: 0, y1: 140, x2: 640, y2: 500 },
      transform
    );
    expect(box.x1).toBeGreaterThanOrEqual(0);
    expect(box.y1).toBeGreaterThanOrEqual(0);
    expect(box.x2).toBeLessThanOrEqual(1920);
    expect(box.y2).toBeLessThanOrEqual(1080);
  });
});
