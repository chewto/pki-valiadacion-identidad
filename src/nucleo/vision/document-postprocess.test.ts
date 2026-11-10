import { describe, expect, it } from "vitest";
import {
  decodeYoloOutput,
  nonMaxSuppression,
  type DocumentDetection,
} from "./document-postprocess";

const makeOutput = (
  anchors: number,
  classes: Array<{ cls: number; score: number; box: number[] }>
): Float32Array => {
  const channels = 4 + 2;
  const data = new Float32Array(channels * anchors);

  classes.forEach((item, anchor) => {
    data[anchor] = item.box[0];
    data[anchors + anchor] = item.box[1];
    data[2 * anchors + anchor] = item.box[2];
    data[3 * anchors + anchor] = item.box[3];
    data[(4 + item.cls) * anchors + anchor] = item.score;
  });

  return data;
};

describe("document-postprocess", () => {
  it("decodifica cajas y clases del formato [1, 4+nc, anchors]", () => {
    const data = makeOutput(2, [
      { cls: 0, score: 0.9, box: [100, 100, 50, 40] },
      { cls: 1, score: 0.8, box: [300, 200, 60, 20] },
    ]);
    const detections = decodeYoloOutput(
      data,
      [1, 6, 2],
      ["documento", "campo"],
      0.25
    );

    expect(detections).toHaveLength(2);
    expect(detections[0].label).toBe("documento");
    expect(detections[0].box).toEqual({ x1: 75, y1: 80, x2: 125, y2: 120 });
    expect(detections[1].label).toBe("campo");
  });

  it("descarta detecciones por debajo de la confianza", () => {
    const data = makeOutput(1, [
      { cls: 0, score: 0.1, box: [100, 100, 50, 40] },
    ]);
    expect(decodeYoloOutput(data, [1, 6, 1], ["a", "b"], 0.25)).toEqual([]);
  });

  it("aplica NMS por clase y conserva la mejor caja", () => {
    const detection = (
      classId: number,
      score: number,
      box: DocumentDetection["box"]
    ): DocumentDetection => ({ classId, label: `c${classId}`, score, box });

    const kept = nonMaxSuppression(
      [
        detection(0, 0.9, { x1: 0, y1: 0, x2: 100, y2: 100 }),
        detection(0, 0.8, { x1: 5, y1: 5, x2: 105, y2: 105 }),
        detection(1, 0.7, { x1: 0, y1: 0, x2: 100, y2: 100 }),
      ],
      0.45
    );

    expect(kept).toHaveLength(2);
    expect(kept.filter((item) => item.classId === 0)).toHaveLength(1);
    expect(kept.filter((item) => item.classId === 1)).toHaveLength(1);
  });
});
