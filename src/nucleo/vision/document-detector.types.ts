import type { FrameQuality } from "./document-guide";
import type { DocumentDetection } from "./document-postprocess";

export interface DetectorWasmPaths {
  /** URL del factory `.js` de onnxruntime-web (antes `.mjs`). */
  mjs?: string;
  /** URL del binario `.wasm`. */
  wasm?: string;
}

export interface DetectorInitMessage {
  type: "init";
  modelBytes: ArrayBuffer;
  labels: readonly string[];
  inputSize: number;
  wasmPaths: DetectorWasmPaths;
}

export interface DetectorFrameMessage {
  type: "frame";
  frameId: number;
  bitmap: ImageBitmap;
  confidence: number;
  iou: number;
}

export interface DetectorDisposeMessage {
  type: "dispose";
}

export type DetectorRequest =
  | DetectorInitMessage
  | DetectorFrameMessage
  | DetectorDisposeMessage;

export interface DetectorReadyMessage {
  type: "ready";
  provider: string;
}

export interface DetectorErrorMessage {
  type: "error";
  message: string;
  frameId?: number;
}

export interface DetectorResultMessage {
  type: "result";
  frameId: number;
  detections: DocumentDetection[];
  quality: FrameQuality;
  width: number;
  height: number;
  inferenceMs: number;
}

export type DetectorResponse =
  | DetectorReadyMessage
  | DetectorErrorMessage
  | DetectorResultMessage;
