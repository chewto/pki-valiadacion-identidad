import type { DetectorWasmPaths } from "./document-detector.types";

/**
 * Archivos del runtime WASM de onnxruntime-web que genera `copy-ort-wasm.mjs`.
 *
 * El factory se publica como `.js` (no `.mjs`) para que nginx y BunkerWeb lo
 * entreguen con `Content-Type: application/javascript`. El `.wasm` se resuelve
 * a partir de la URL del factory.
 */
const ORT_FACTORY_FILE = "ort-wasm-simd-threaded.jsep.js";
const ORT_BINARY_FILE = "ort-wasm-simd-threaded.jsep.wasm";

/**
 * Calcula las rutas absolutas de los archivos de ORT. Se separa de
 * `getDocumentWasmPaths` para poder probar los distintos `base` de Vite
 * (dev con `/`, build con `./` o `--base=/validacion/`).
 */
export const resolveDocumentWasmPaths = (
  baseUrl: string,
  href: string
): DetectorWasmPaths => {
  const ortBase = new URL(`${baseUrl}ort/`, href);

  return {
    mjs: new URL(ORT_FACTORY_FILE, ortBase).toString(),
    wasm: new URL(ORT_BINARY_FILE, ortBase).toString(),
  };
};

/**
 * Rutas de los archivos WASM de onnxruntime-web. Se calculan desde el
 * documento actual para funcionar tanto en dev (`/`) como en builds con
 * `--base=/validacion/`.
 */
export const getDocumentWasmPaths = (): DetectorWasmPaths => {
  const baseUrl = import.meta.env.BASE_URL;
  const href =
    typeof window === "undefined" ? "http://localhost/" : window.location.href;

  return resolveDocumentWasmPaths(baseUrl, href);
};
