import * as ort from "onnxruntime-web/webgpu";
import { computeLetterbox, rgbaToNchwTensor } from "./document-preprocess";
import { decodeAndMap } from "./document-postprocess";
import { computeFrameQuality } from "./document-quality";
import type {
  DetectorRequest,
  DetectorResponse,
} from "./document-detector.types";

interface WorkerScope {
  postMessage: (message: DetectorResponse, transfer?: Transferable[]) => void;
  onmessage:
    | ((event: MessageEvent<DetectorRequest>) => void)
    | null;
}

const scope = self as unknown as WorkerScope;

let session: ort.InferenceSession | null = null;
let inputName = "images";
let outputName = "output0";
let labels: readonly string[] = [];
let inputSize = 640;
let provider = "wasm";

const postError = (message: string, frameId?: number) => {
  scope.postMessage({
    type: "error",
    message,
    ...(typeof frameId === "number" ? { frameId } : {}),
  });
};

const initSession = async (
  message: Extract<DetectorRequest, { type: "init" }>
): Promise<void> => {
  labels = message.labels;
  inputSize = message.inputSize;

  ort.env.wasm.wasmPaths = message.wasmPaths;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;

  try {
    session = await ort.InferenceSession.create(message.modelBytes, {
      executionProviders: ["webgpu", "wasm"],
      graphOptimizationLevel: "all",
    });
    provider =
      typeof navigator !== "undefined" && "gpu" in navigator
        ? "webgpu"
        : "wasm";
  } catch {
    session = await ort.InferenceSession.create(message.modelBytes, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    provider = "wasm";
  }

  inputName = session.inputNames[0] ?? "images";
  outputName = session.outputNames[0] ?? "output0";

  scope.postMessage({ type: "ready", provider });
};

const runFrame = async (
  message: Extract<DetectorRequest, { type: "frame" }>
): Promise<void> => {
  if (!session) {
    postError("El modelo todavía no está cargado.", message.frameId);
    return;
  }

  const { bitmap, frameId } = message;
  const startedAt = performance.now();

  try {
    const transform = computeLetterbox(
      bitmap.width,
      bitmap.height,
      inputSize
    );

    const canvas = new OffscreenCanvas(inputSize, inputSize);
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("No se pudo crear el contexto 2D del canvas.");
    }

    context.fillStyle = "rgb(114,114,114)";
    context.fillRect(0, 0, inputSize, inputSize);
    context.drawImage(
      bitmap,
      transform.dx,
      transform.dy,
      transform.drawWidth,
      transform.drawHeight
    );

    const imageData = context.getImageData(0, 0, inputSize, inputSize);
    const tensorData = rgbaToNchwTensor(imageData.data, inputSize);
    const tensor = new ort.Tensor("float32", tensorData, [
      1,
      3,
      inputSize,
      inputSize,
    ]);

    const outputs = await session.run({ [inputName]: tensor });
    const output = outputs[outputName] ?? Object.values(outputs)[0];

    if (!output) {
      throw new Error("El modelo no devolvió una salida válida.");
    }

    const detections = decodeAndMap(
      output.data as Float32Array,
      output.dims,
      labels,
      transform,
      {
        confidence: message.confidence,
        iou: message.iou,
      }
    );
    const quality = computeFrameQuality(
      imageData.data,
      inputSize,
      inputSize
    );

    scope.postMessage({
      type: "result",
      frameId,
      detections,
      quality,
      width: bitmap.width,
      height: bitmap.height,
      inferenceMs: performance.now() - startedAt,
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Fallo de inferencia.";
    postError(reason, frameId);
  } finally {
    bitmap.close();
  }
};

scope.onmessage = (event) => {
  const message = event.data;

  if (message.type === "init") {
    void initSession(message).catch((error) => {
      postError(
        error instanceof Error ? error.message : "No se pudo cargar el modelo."
      );
    });
    return;
  }

  if (message.type === "frame") {
    void runFrame(message);
    return;
  }

  if (message.type === "dispose") {
    session = null;
  }
};
