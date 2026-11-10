/**
 * Ruta base de los archivos WASM de onnxruntime-web. Se calcula desde el
 * documento actual para funcionar tanto en dev (`/`) como en builds con
 * `--base=/validacion/`.
 */
export const getDocumentWasmPaths = (): string => {
  if (typeof window === "undefined") return "/ort/";
  return new URL(
    `${import.meta.env.BASE_URL}ort/`,
    window.location.href
  ).toString();
};
