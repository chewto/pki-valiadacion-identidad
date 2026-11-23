import {
  isDocumentCountry,
  type DocumentCountry,
} from "./document-model.config";
import { DocumentDetectorClient } from "./document-detector.client";
import { loadDocumentModel } from "./document-model.loader";
import { getDocumentWasmPaths } from "./document-runtime";

/**
 * Estado compartido del motor de visión de documentos.
 *
 * La precarga se dispara al iniciar la validación y es independiente de los
 * componentes: el paso del documento solo se suscribe al estado. La sesión
 * ONNX (worker) también se comparte entre el anverso y el reverso para que el
 * segundo lado arranque sin volver a inicializar el modelo.
 */

export type DocumentVisionPhase =
  | "idle"
  | "downloading"
  | "initializing"
  | "ready"
  | "error";

export interface DocumentVisionSnapshot {
  country: DocumentCountry | null;
  phase: DocumentVisionPhase;
  progress: number;
  error: string | null;
  provider: string | null;
}

export interface DocumentVisionSession {
  country: DocumentCountry;
  client: DocumentDetectorClient;
  provider: string;
}

const SUPPORT_ERROR =
  "Este navegador no soporta la detección en tiempo real. Actualiza el navegador para continuar con la validación del documento.";

const initialState: DocumentVisionSnapshot = {
  country: null,
  phase: "idle",
  progress: 0,
  error: null,
  provider: null,
};

let snapshot: DocumentVisionSnapshot = initialState;
const listeners = new Set<() => void>();

let session: DocumentVisionSession | null = null;
let pending: {
  country: DocumentCountry;
  promise: Promise<DocumentVisionSession>;
} | null = null;
let controller: AbortController | null = null;
// Identifica la carga vigente para descartar resultados de cargas anteriores.
let generation = 0;

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

const update = (patch: Partial<DocumentVisionSnapshot>): void => {
  snapshot = { ...snapshot, ...patch };
  emit();
};

const toErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "No se pudo iniciar la detección con el modelo.";
  }

  return error.message.includes("repositorio")
    ? `${error.message} Verifica que los modelos de Hugging Face sean públicos.`
    : error.message;
};

const releaseCurrent = (): void => {
  generation += 1;
  controller?.abort();
  controller = null;
  session?.client.dispose();
  session = null;
  pending = null;
};

export const getDocumentVisionSnapshot = (): DocumentVisionSnapshot =>
  snapshot;

export const subscribeDocumentVision = (
  listener: () => void
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Garantiza que el modelo del país esté descargado y la sesión ONNX lista.
 * Deduplica llamadas concurrentes y reemplaza la carga si cambia el país.
 */
export const ensureDocumentVision = (
  country: string
): Promise<DocumentVisionSession> => {
  if (!isDocumentCountry(country)) {
    return Promise.reject(
      new Error(`No hay modelo de visión configurado para el país ${country}.`)
    );
  }

  if (session && session.country === country) {
    return Promise.resolve(session);
  }

  if (pending?.country === country) {
    return pending.promise;
  }

  // Cambió el país o quedó una sesión anterior: se descarta sin UI.
  if (pending || session) {
    releaseCurrent();
  }

  if (!DocumentDetectorClient.isSupported()) {
    update({
      country,
      phase: "error",
      progress: 0,
      error: SUPPORT_ERROR,
      provider: null,
    });
    return Promise.reject(new Error(SUPPORT_ERROR));
  }

  generation += 1;
  const currentGeneration = generation;
  const abortController = new AbortController();
  controller = abortController;

  update({
    country,
    phase: "downloading",
    progress: 0,
    error: null,
    provider: null,
  });

  const load = (async (): Promise<DocumentVisionSession> => {
    let client: DocumentDetectorClient | null = null;

    try {
      const model = await loadDocumentModel(country, {
        onProgress: (progress) => {
          if (generation !== currentGeneration) return;
          update({ progress: Math.min(1, Math.max(0, progress)) });
        },
        signal: abortController.signal,
      });

      if (generation !== currentGeneration) {
        throw new Error("La carga del modelo fue reemplazada.");
      }

      update({ phase: "initializing", progress: 1 });

      client = new DocumentDetectorClient();
      await client.init({
        modelBytes: model.modelBytes,
        labels: model.labels,
        inputSize: model.inputSize,
        wasmPaths: getDocumentWasmPaths(),
      });

      if (generation !== currentGeneration) {
        client.dispose();
        throw new Error("La carga del modelo fue reemplazada.");
      }

      const provider = client.getProvider();
      session = { country, client, provider };
      update({
        country,
        phase: "ready",
        progress: 1,
        error: null,
        provider,
      });
      return session;
    } catch (error) {
      client?.dispose();

      if (generation === currentGeneration) {
        update({
          country,
          phase: "error",
          error: toErrorMessage(error),
          provider: null,
        });
      }

      throw error instanceof Error
        ? error
        : new Error(toErrorMessage(error));
    } finally {
      if (generation === currentGeneration) {
        pending = null;
        controller = null;
      }
    }
  })();

  pending = { country, promise: load };

  return load;
};

/**
 * Vuelve a iniciar la carga para el último país solicitado. Pensado para el
 * botón "Reintentar" cuando la descarga o la inicialización fallaron.
 */
export const retryDocumentVision = (): Promise<DocumentVisionSession> | null => {
  const country = snapshot.country;
  if (!country) return null;

  releaseCurrent();
  update({
    country,
    phase: "downloading",
    progress: 0,
    error: null,
    provider: null,
  });

  return ensureDocumentVision(country);
};

/** Libera el worker y el estado compartido (recarga de página o limpieza). */
export const disposeDocumentVision = (): void => {
  releaseCurrent();
  snapshot = initialState;
  emit();
};

/** Solo para pruebas: deja el módulo en su estado inicial. */
export const __resetDocumentVisionForTests = (): void => {
  disposeDocumentVision();
  listeners.clear();
};
