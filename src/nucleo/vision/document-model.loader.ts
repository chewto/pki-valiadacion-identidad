import {
  DOCUMENT_MODEL_MANIFEST_URL,
  FALLBACK_LABELS,
  FALLBACK_MODEL_BYTES,
  FALLBACK_MODEL_SHA256,
  getCountryModelFile,
  getModelUrl,
  type DocumentCountry,
} from "./document-model.config";

export interface DocumentModelManifestEntry {
  sha256?: string;
  bytes?: number;
  nc?: number;
  names?: Record<string, string>;
  input?: { shape?: number[] };
  output?: { shape?: number[] };
}

interface DocumentModelManifest {
  models?: Record<string, DocumentModelManifestEntry>;
}

export interface LoadedDocumentModel {
  country: DocumentCountry;
  fileName: string;
  labels: readonly string[];
  inputSize: number;
  modelBytes: ArrayBuffer;
  sha256: string | null;
}

export interface LoadModelOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

const CACHE_NAME = "document-models-v1";

let manifestPromise: Promise<DocumentModelManifest | null> | null = null;

const labelsFromNames = (
  names: Record<string, string> | undefined
): string[] | null => {
  if (!names) return null;
  const entries = Object.entries(names)
    .map(([key, value]) => [Number(key), value] as const)
    .filter(([key, value]) => Number.isInteger(key) && typeof value === "string")
    .sort((a, b) => a[0] - b[0]);

  if (entries.length === 0) return null;
  const labels = entries.map(([, value]) => value);
  return labels.every((value) => value.length > 0) ? labels : null;
};

const fetchManifest = async (): Promise<DocumentModelManifest | null> => {
  if (!manifestPromise) {
    manifestPromise = fetch(DOCUMENT_MODEL_MANIFEST_URL, {
      mode: "cors",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as DocumentModelManifest;
      })
      .catch(() => null);
  }

  return manifestPromise;
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const sha256 = async (buffer: ArrayBuffer): Promise<string | null> => {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  try {
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return toHex(digest);
  } catch {
    return null;
  }
};

const openModelCache = async (): Promise<Cache | null> => {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
};

const fetchModelBytes = async (
  url: string,
  options: LoadModelOptions
): Promise<Uint8Array> => {
  const cache = await openModelCache();
  if (cache) {
    try {
      const cached = await cache.match(url);
      if (cached) {
        options.onProgress?.(1);
        return new Uint8Array(await cached.arrayBuffer());
      }
    } catch {
      // Si la caché falla, seguimos con la red.
    }
  }

  const response = await fetch(url, {
    mode: "cors",
    signal: options.signal,
  });

  if (!response.ok) {
    const reason =
      response.status === 401 || response.status === 403
        ? "El repositorio de modelos no es público."
        : `No se pudo descargar el modelo (HTTP ${response.status}).`;
    throw new Error(reason);
  }

  const total = Number(response.headers.get("content-length") ?? 0);
  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    options.onProgress?.(1);
    if (cache) {
      try {
        await cache.put(url, new Response(buffer));
      } catch {
        // La caché es opcional.
      }
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let reading = true;

  while (reading) {
    const { done, value } = await reader.read();
    if (done) {
      reading = false;
      break;
    }
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (total > 0) {
        options.onProgress?.(Math.min(1, received / total));
      }
    }
  }

  const combined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  options.onProgress?.(1);

  if (cache) {
    try {
      await cache.put(url, new Response(combined.slice()));
    } catch {
      // La cuota de la caché puede estar llena.
    }
  }

  return combined;
};

const resolveInputSize = (
  entry: DocumentModelManifestEntry | undefined
): number => {
  const shape = entry?.input?.shape;
  const height = shape?.[2];
  return typeof height === "number" && height > 0 ? height : 640;
};

const resolveLabels = (
  country: DocumentCountry,
  entry: DocumentModelManifestEntry | undefined
): readonly string[] => {
  const fromManifest = labelsFromNames(entry?.names);
  if (fromManifest) {
    const outputChannels = entry?.output?.shape?.[1];
    if (
      typeof outputChannels !== "number" ||
      outputChannels === fromManifest.length + 4
    ) {
      return fromManifest;
    }
  }
  return FALLBACK_LABELS[country];
};

export const loadDocumentModel = async (
  country: string,
  options: LoadModelOptions = {}
): Promise<LoadedDocumentModel> => {
  const config = getCountryModelFile(country);
  if (!config) {
    throw new Error(`No hay modelo configurado para el país ${country}.`);
  }

  const manifest = await fetchManifest();
  const manifestEntry = manifest?.models?.[config.fileName];
  const entry: DocumentModelManifestEntry | undefined =
    manifestEntry ?? {
      sha256: FALLBACK_MODEL_SHA256[config.country],
      bytes: FALLBACK_MODEL_BYTES[config.country],
    };
  const configuredUrl = getModelUrl(country);

  if (!configuredUrl) {
    throw new Error(`No hay URL de modelo configurada para ${country}.`);
  }

  const modelUrl = new URL(
    configuredUrl,
    typeof window !== "undefined" ? window.location.href : "http://localhost/"
  ).toString();

  const bytes = await fetchModelBytes(modelUrl, options);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );

  if (entry?.bytes && buffer.byteLength !== entry.bytes) {
    throw new Error(
      `El modelo descargado tiene un tamaño inesperado (${buffer.byteLength} bytes).`
    );
  }

  let hashCode: string | null = null;
  const shouldVerify =
    import.meta.env.VITE_DOCUMENT_MODEL_VERIFY_HASH !== "false";

  if (shouldVerify && entry?.sha256) {
    hashCode = await sha256(buffer);
    if (hashCode && hashCode !== entry.sha256.toLowerCase()) {
      try {
        const cache = await openModelCache();
        await cache?.delete(modelUrl);
      } catch {
        // La caché es opcional.
      }
      throw new Error(
        "El hash del modelo no coincide con el manifiesto. Se canceló la carga."
      );
    }
  }

  return {
    country: config.country,
    fileName: config.fileName,
    labels: resolveLabels(config.country, entry),
    inputSize: resolveInputSize(entry),
    modelBytes: buffer,
    sha256: hashCode,
  };
};
