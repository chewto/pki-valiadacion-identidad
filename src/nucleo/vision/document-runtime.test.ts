import { describe, expect, it } from "vitest";
import { resolveDocumentWasmPaths } from "./document-runtime";

const VALIDACION_BASE =
  "https://pki.test/validacion/ort/ort-wasm-simd-threaded.jsep";
const ROOT_BASE = "https://pki.test/ort/ort-wasm-simd-threaded.jsep";

describe("resolveDocumentWasmPaths", () => {
  it("resuelve las rutas con base relativa y HashRouter", () => {
    const paths = resolveDocumentWasmPaths(
      "./",
      "https://pki.test/validacion/#/test/documento-vision"
    );

    expect(paths.mjs).toBe(`${VALIDACION_BASE}.js`);
    expect(paths.wasm).toBe(`${VALIDACION_BASE}.wasm`);
    expect(paths.mjs?.endsWith(".mjs")).toBe(false);
  });

  it("resuelve las rutas con base raíz", () => {
    const paths = resolveDocumentWasmPaths(
      "/",
      "https://pki.test/#/test/documento-vision"
    );

    expect(paths.mjs).toBe(`${ROOT_BASE}.js`);
    expect(paths.wasm).toBe(`${ROOT_BASE}.wasm`);
  });

  it("respeta los builds con base absoluta /validacion/", () => {
    const paths = resolveDocumentWasmPaths(
      "/validacion/",
      "https://pki.test/validacion/index.html#/test/documento-vision"
    );

    expect(paths.mjs).toBe(`${VALIDACION_BASE}.js`);
    expect(paths.wasm).toBe(`${VALIDACION_BASE}.wasm`);
  });
});
