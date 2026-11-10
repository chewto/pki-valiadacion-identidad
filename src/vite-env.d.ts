/// <reference types="vite/client" />

declare module "onnxruntime-web/webgpu" {
  export * from "onnxruntime-web";
}

interface ImportMetaEnv {
  readonly VITE_DOCUMENT_GUIDE_ENABLED?: string;
  readonly VITE_DOCUMENT_MODEL_BASE_URL?: string;
  readonly VITE_DOCUMENT_MODEL_VERIFY_HASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
