# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
   parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
   },
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

---

## Guía de documentos con ONNX en el navegador

La captura de documentos puede usar los modelos YOLO de Colombia y Honduras para
guiar al usuario en tiempo real y marcar los campos que ya se ven.

### Modelos

| País | Archivo | Clases | Entrada | Salida |
|---|---|---|---|---|
| Colombia | `colombia-v0.1.onnx` | 33 | `1×3×640×640` | `[1,37,8400]` |
| Honduras | `honduras-v0.1.onnx` | 18 | `1×3×640×640` | `[1,22,8400]` |

Se sirven desde Hugging Face y el repositorio debe ser **público**:

```text
https://huggingface.co/chuito1503/noaexport-modelos/resolve/main/colombia-v0.1.onnx
https://huggingface.co/chuito1503/noaexport-modelos/resolve/main/honduras-v0.1.onnx
https://huggingface.co/chuito1503/noaexport-modelos/resolve/main/metadata.json
```

Los enlaces `/blob/main/...` no sirven el binario; se usa `/resolve/main/...`.
El `metadata.json` es opcional: si no está publicado, la app usa los labels,
tamaños y hashes de respaldo que coinciden con estos dos ONNX.

### Variables de entorno

```bash
VITE_DOCUMENT_GUIDE_ENABLED=true
VITE_DOCUMENT_GUIDE_SCALE_TOLERANCE=0.12
VITE_DOCUMENT_MODEL_BASE_URL=https://huggingface.co/chuito1503/noaexport-modelos/resolve/main
VITE_DOCUMENT_MODEL_VERIFY_HASH=true
```

- `VITE_DOCUMENT_GUIDE_ENABLED`: activa la guía. También se puede forzar con
  `?guia=1` o desactivar con `?guia=0`.
- `VITE_DOCUMENT_GUIDE_SCALE_TOLERANCE`: tolerancia de tamaño entre el documento
  y el recuadro, como fracción entre `0.01` y `0.5` (por defecto `0.12`, es
  decir ±12 %). Un valor mayor que `1` se interpreta como porcentaje
  (`15` = 15 %). Dentro de la tolerancia el recuadro se ilumina en verde.
- `VITE_DOCUMENT_MODEL_BASE_URL`: base de los ONNX y del `metadata.json`.
- `VITE_DOCUMENT_MODEL_VERIFY_HASH`: valida el SHA-256 del modelo contra el
  manifiesto o contra los hashes de respaldo. Desactívalo solo si cambias de
  modelo/CDN y actualizas los hashes.

### Funcionamiento

1. El modelo se descarga e inicializa en segundo plano al iniciar la
   validación, sin mostrar progreso. La primera descarga pesa ~77 MB
   (Colombia) o ~97 MB (Honduras).
2. La barra de carga aparece únicamente al llegar al paso del documento y solo
   si el modelo todavía no está listo; si ya se descargó, la cámara guiada
   arranca de inmediato. La sesión ONNX se reutiliza entre el anverso y el
   reverso.
3. Con la guía habilitada la captura guiada es obligatoria: no se muestra el
   consentimiento ni se ofrece subir una imagen.
4. La cámara muestra solo el video con los recuadros de detección y las
   instrucciones para centrar, iluminar, voltear o acercar el documento. No se
   muestran checklist de campos ni datos leídos del documento. El recuadro guía
   compara los bordes del documento con los suyos: indica el porcentaje que
   ocupa (`Acerca · N%` / `Aleja · N%`) y se ilumina en verde cuando el tamaño
   entra en `VITE_DOCUMENT_GUIDE_SCALE_TOLERANCE`.
5. La captura se dispara automáticamente, en segundo plano, en cuanto el
   documento está estable y alineado al recuadro (tamaño y encuadre correctos).
   No se espera a que el modelo reconozca todos los campos: esos datos los lee y
   valida el backend. No hay botón manual en el proceso real.
6. La imagen capturada sigue el flujo existente de OCR, detección y validación,
   pero no se muestra en pantalla.
7. Los datos de OCR/MRZ se guardan para la validación, pero no se muestran ni se
   editan en el paso del documento.
8. Si el modelo, el CDN o la cámara fallan, se bloquea el paso con un mensaje y
   la opción de reintentar; no hay captura alternativa.
9. El modelo se ejecuta en un Web Worker con `onnxruntime-web` (WebGPU si está
   disponible; si no, WASM) y se cachea para las siguientes validaciones.

Ruta de diagnóstico sin backend: `/#/test/documento-vision` (permite elegir país,
documento y lado, y probar cámara, modelo y detecciones). Esta página conserva el
checklist de campos, el botón de captura manual y la galería de capturas.

Lector de etiquetas con recortes: `/#/test/lector` (selecciona Colombia/Honduras,
dibuja todas las cajas con su nombre y confianza, y genera recortes descargables
de cada etiqueta).

### Desarrollo

```bash
npm install
npm run dev
```

`predev`/`prebuild` copian a `public/ort/` el binario `.wasm` de
`onnxruntime-web` y su factory como `ort-wasm-simd-threaded.jsep.js` (no `.mjs`).
No se versionan los ONNX en el frontend.

### Despliegue y MIME

El factory de ONNX Runtime se publica con extensión `.js` porque nginx (y por
tanto BunkerWeb, que está construido sobre nginx) no mapea `.mjs` en su
`mime.types`: sin esa extensión el archivo se entrega como
`application/octet-stream` y el navegador rechaza el module script con
`Failed to load module script`.

- La app solicita `/<base>/ort/ort-wasm-simd-threaded.jsep.js` y
  `/<base>/ort/ort-wasm-simd-threaded.jsep.wasm`.
- Despliega siempre un `dist/` generado con `npm run build` (incluye el
  `prebuild`) o con el `dockerfile`; no reutilices un `dist/` antiguo.
- Si necesitas desbloquear un servidor nginx/BunkerWeb sin desplegar el build
  nuevo, añade `types { application/javascript mjs; }` a su configuración
  (BunkerWeb: `/etc/bunkerweb/configs/http/*.conf`) y verifica con
  `curl -sI .../ort/ort-wasm-simd-threaded.jsep.mjs`.
