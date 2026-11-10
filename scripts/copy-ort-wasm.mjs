import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve("onnxruntime-web"));
const targetDir = resolve("public", "ort");

mkdirSync(targetDir, { recursive: true });

const files = readdirSync(distDir).filter(
  (file) =>
    file.startsWith("ort-wasm-simd-threaded.jsep") &&
    /\.(mjs|wasm)$/.test(file)
);

for (const file of files) {
  copyFileSync(join(distDir, file), join(targetDir, file));
}

console.log(`[copy-ort-wasm] ${files.length} archivos copiados a public/ort`);
