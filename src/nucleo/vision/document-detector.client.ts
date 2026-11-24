import type { FrameQuality } from "./document-guide";
import type { DocumentDetection } from "./document-postprocess";
import type {
  DetectorRequest,
  DetectorResponse,
  DetectorWasmPaths,
} from "./document-detector.types";

export interface DetectorFrameResult {
  detections: DocumentDetection[];
  quality: FrameQuality;
  width: number;
  height: number;
  inferenceMs: number;
}

export interface DetectorInitOptions {
  modelBytes: ArrayBuffer;
  labels: readonly string[];
  inputSize: number;
  wasmPaths: DetectorWasmPaths;
}

interface PendingFrame {
  resolve: (result: DetectorFrameResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const INIT_TIMEOUT_MS = 180_000;
const FRAME_TIMEOUT_MS = 20_000;

export class DocumentDetectorClient {
  private worker: Worker | null = null;
  private ready = false;
  private providerName = "wasm";
  private initResolve: (() => void) | null = null;
  private initReject: ((error: Error) => void) | null = null;
  private initTimeout: ReturnType<typeof setTimeout> | null = null;
  private pending = new Map<number, PendingFrame>();
  private nextFrameId = 1;

  static isSupported(): boolean {
    return (
      typeof Worker !== "undefined" &&
      typeof OffscreenCanvas !== "undefined" &&
      typeof createImageBitmap === "function"
    );
  }

  getProvider(): string {
    return this.providerName;
  }

  async init(options: DetectorInitOptions): Promise<void> {
    if (!DocumentDetectorClient.isSupported()) {
      throw new Error("Este navegador no soporta la inferencia en segundo plano.");
    }

    this.worker = new Worker(
      new URL("./document-detector.worker.ts", import.meta.url),
      { type: "module" }
    );

    this.worker.onmessage = (event: MessageEvent<DetectorResponse>) => {
      this.handleMessage(event.data);
    };

    this.worker.onerror = () => {
      this.failAll(new Error("El motor de visión se detuvo inesperadamente."));
    };

    await new Promise<void>((resolve, reject) => {
      this.initResolve = resolve;
      this.initReject = reject;
      this.initTimeout = setTimeout(() => {
        reject(new Error("La carga del modelo excedió el tiempo máximo."));
      }, INIT_TIMEOUT_MS);

      const message: DetectorRequest = {
        type: "init",
        modelBytes: options.modelBytes,
        labels: options.labels,
        inputSize: options.inputSize,
        wasmPaths: options.wasmPaths,
      };

      this.worker?.postMessage(message, [options.modelBytes]);
    });
  }

  async detect(
    bitmap: ImageBitmap,
    confidence: number,
    iou: number
  ): Promise<DetectorFrameResult> {
    if (!this.worker || !this.ready) {
      bitmap.close();
      throw new Error("El detector todavía no está listo.");
    }

    const frameId = this.nextFrameId;
    this.nextFrameId += 1;

    return new Promise<DetectorFrameResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(frameId);
        bitmap.close();
        reject(new Error("La inferencia tardó demasiado."));
      }, FRAME_TIMEOUT_MS);

      this.pending.set(frameId, { resolve, reject, timeout });

      const message: DetectorRequest = {
        type: "frame",
        frameId,
        bitmap,
        confidence,
        iou,
      };

      this.worker?.postMessage(message, [bitmap]);
    });
  }

  dispose(): void {
    this.failAll(new Error("El detector fue cerrado."));
    this.worker?.postMessage({ type: "dispose" } satisfies DetectorRequest);
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }

  private handleMessage(message: DetectorResponse): void {
    if (message.type === "ready") {
      this.ready = true;
      this.providerName = message.provider;
      if (this.initTimeout) clearTimeout(this.initTimeout);
      this.initTimeout = null;
      this.initResolve?.();
      this.initResolve = null;
      this.initReject = null;
      return;
    }

    if (message.type === "error") {
      const error = new Error(message.message);
      if (typeof message.frameId === "number") {
        const pending = this.pending.get(message.frameId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pending.delete(message.frameId);
          pending.reject(error);
        }
      } else {
        if (this.initTimeout) clearTimeout(this.initTimeout);
        this.initTimeout = null;
        this.initReject?.(error);
        this.initResolve = null;
        this.initReject = null;
      }
      return;
    }

    const pending = this.pending.get(message.frameId);
    if (!pending) return;
    clearTimeout(pending.timeout);
    this.pending.delete(message.frameId);
    pending.resolve({
      detections: message.detections,
      quality: message.quality,
      width: message.width,
      height: message.height,
      inferenceMs: message.inferenceMs,
    });
  }

  private failAll(error: Error): void {
    if (this.initTimeout) clearTimeout(this.initTimeout);
    this.initTimeout = null;
    this.initReject?.(error);
    this.initResolve = null;
    this.initReject = null;

    this.pending.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(error);
    });
    this.pending.clear();
  }
}
