import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadDocumentModel: vi.fn(),
  isSupported: vi.fn(() => true),
  clients: [] as Array<{ disposed: boolean }>,
}));

vi.mock("./document-model.loader", () => ({
  loadDocumentModel: mocks.loadDocumentModel,
}));

vi.mock("./document-runtime", () => ({
  getDocumentWasmPaths: () => ({
    mjs: "/ort/ort-wasm-simd-threaded.jsep.js",
    wasm: "/ort/ort-wasm-simd-threaded.jsep.wasm",
  }),
}));

vi.mock("./document-detector.client", () => {
  class DocumentDetectorClient {
    static isSupported() {
      return mocks.isSupported();
    }

    readonly providerName = "wasm";
    disposed = false;

    constructor() {
      mocks.clients.push(this);
    }

    async init(): Promise<void> {
      return undefined;
    }

    getProvider(): string {
      return this.providerName;
    }

    async detect(): Promise<unknown> {
      return null;
    }

    dispose(): void {
      this.disposed = true;
    }
  }

  return { DocumentDetectorClient };
});

import {
  __resetDocumentVisionForTests,
  ensureDocumentVision,
  getDocumentVisionSnapshot,
  retryDocumentVision,
  subscribeDocumentVision,
} from "./document-vision.service";

const createModel = (country: string) => ({
  country,
  fileName: `${country}.onnx`,
  labels: ["LABEL"] as readonly string[],
  inputSize: 640,
  modelBytes: new ArrayBuffer(8),
  sha256: null,
});

describe("document-vision.service", () => {
  beforeEach(() => {
    __resetDocumentVisionForTests();
    mocks.loadDocumentModel.mockReset();
    mocks.isSupported.mockReset();
    mocks.isSupported.mockReturnValue(true);
    mocks.clients.length = 0;
    mocks.loadDocumentModel.mockImplementation(
      async (country: string, options?: { onProgress?: (value: number) => void }) => {
        options?.onProgress?.(1);
        return createModel(country);
      }
    );
  });

  afterEach(() => {
    __resetDocumentVisionForTests();
  });

  it("deduplica la carga y deja la sesión lista con su proveedor", async () => {
    const first = ensureDocumentVision("COL");
    const second = ensureDocumentVision("COL");

    await expect(first).resolves.toBeTruthy();
    await expect(second).resolves.toBeTruthy();

    expect(mocks.loadDocumentModel).toHaveBeenCalledTimes(1);
    expect(getDocumentVisionSnapshot()).toMatchObject({
      country: "COL",
      phase: "ready",
      progress: 1,
      provider: "wasm",
      error: null,
    });

    // Una llamada posterior reutiliza la sesión ya inicializada.
    await ensureDocumentVision("COL");
    expect(mocks.loadDocumentModel).toHaveBeenCalledTimes(1);
    expect(mocks.clients).toHaveLength(1);
  });

  it("publica el progreso de la descarga y notifica a los suscriptores", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDocumentVision(listener);

    let progressAtMidway: number | null = null;
    mocks.loadDocumentModel.mockImplementation(
      async (country: string, options?: { onProgress?: (value: number) => void }) => {
        options?.onProgress?.(0.5);
        progressAtMidway = getDocumentVisionSnapshot().progress;
        options?.onProgress?.(1);
        return createModel(country);
      }
    );

    await ensureDocumentVision("COL");

    expect(progressAtMidway).toBe(0.5);
    expect(getDocumentVisionSnapshot().phase).toBe("ready");
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });

  it("marca el error y permite reintentar la carga", async () => {
    mocks.loadDocumentModel.mockRejectedValueOnce(new Error("CDN caído"));

    await expect(ensureDocumentVision("COL")).rejects.toThrow("CDN caído");
    expect(getDocumentVisionSnapshot()).toMatchObject({
      country: "COL",
      phase: "error",
      error: "CDN caído",
    });
    expect(mocks.clients).toHaveLength(0);

    mocks.loadDocumentModel.mockImplementationOnce(
      async (country: string, options?: { onProgress?: (value: number) => void }) => {
        options?.onProgress?.(1);
        return createModel(country);
      }
    );

    const retried = retryDocumentVision();
    expect(retried).not.toBeNull();
    await expect(retried).resolves.toBeTruthy();

    expect(getDocumentVisionSnapshot().phase).toBe("ready");
    expect(mocks.loadDocumentModel).toHaveBeenCalledTimes(2);
  });

  it("reemplaza la sesión cuando cambia el país", async () => {
    await ensureDocumentVision("COL");
    const firstClient = mocks.clients[0];

    await ensureDocumentVision("HND");

    expect(firstClient.disposed).toBe(true);
    expect(mocks.loadDocumentModel).toHaveBeenLastCalledWith(
      "HND",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(getDocumentVisionSnapshot()).toMatchObject({
      country: "HND",
      phase: "ready",
    });
    expect(mocks.clients).toHaveLength(2);
  });

  it("no descarga nada si el navegador no soporta la detección", async () => {
    mocks.isSupported.mockReturnValue(false);

    await expect(ensureDocumentVision("COL")).rejects.toThrow(
      /no soporta la detección/
    );
    expect(mocks.loadDocumentModel).not.toHaveBeenCalled();
    expect(getDocumentVisionSnapshot()).toMatchObject({
      country: "COL",
      phase: "error",
    });
  });

  it("rechaza países sin modelo sin tocar la red", async () => {
    await expect(ensureDocumentVision("MEX")).rejects.toThrow(
      /No hay modelo de visión configurado/
    );
    expect(mocks.loadDocumentModel).not.toHaveBeenCalled();
  });
});
