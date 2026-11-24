import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve("onnxruntime-web"));
const targetDir = resolve("public", "ort");

mkdirSync(targetDir, { recursive: true });

const FILE_PREFIX = "ort-wasm-simd-threaded.jsep";
const FACTORY_SOURCE = `${FILE_PREFIX}.mjs`;
// El factory se sirve como .js porque nginx (y BunkerWeb) no mapea .mjs:
// sin esa extensión los servidores lo entregan como octet-stream y el
// navegador rechaza el module script que carga onnxruntime-web.
const FACTORY_TARGET = `${FILE_PREFIX}.js`;
const BINARY_TARGET = `${FILE_PREFIX}.wasm`;
const KEEP = new Set([FACTORY_TARGET, BINARY_TARGET]);

// Limpia artefactos previos (por ejemplo el antiguo .mjs) dentro de public/ort.
for (const file of readdirSync(targetDir)) {
  if (file.startsWith(FILE_PREFIX) && !KEEP.has(file)) {
    rmSync(join(targetDir, file));
  }
}

copyFileSync(join(distDir, FACTORY_SOURCE), join(targetDir, FACTORY_TARGET));
copyFileSync(join(distDir, BINARY_TARGET), join(targetDir, BINARY_TARGET));

console.log(
  `[copy-ort-wasm] ${FACTORY_TARGET} y ${BINARY_TARGET} copiados a public/ort`
);
