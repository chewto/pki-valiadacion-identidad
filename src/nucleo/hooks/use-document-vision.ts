import { useSyncExternalStore } from "react";
import {
  getDocumentVisionSnapshot,
  subscribeDocumentVision,
} from "../vision/document-vision.service";

/**
 * Estado compartido de la precarga del modelo de visión. Se usa únicamente en
 * el paso del documento para mostrar la barra de descarga cuando todavía no
 * está listo.
 */
export const useDocumentVision = () =>
  useSyncExternalStore(
    subscribeDocumentVision,
    getDocumentVisionSnapshot,
    getDocumentVisionSnapshot
  );
