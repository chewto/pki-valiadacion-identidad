import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useDocumentCamera, type CameraStatus } from "./use-document-camera";
import { DocumentDetectorClient } from "../vision/document-detector.client";
import { loadDocumentModel } from "../vision/document-model.loader";
import { getDocumentWasmPaths } from "../vision/document-runtime";
import { cropDetections, type DocumentCrop } from "../vision/document-crops";
import type { DocumentDetection } from "../vision/document-postprocess";
import type { FrameQuality } from "../vision/document-guide";

export type DocumentReaderPhase =
  | "idle"
  | "loading"
  | "running"
  | "error"
  | "unsupported";

export interface UseDocumentReaderOptions {
  country: string;
  active: boolean;
  frozen: boolean;
  confidence: number;
  iou: number;
  intervalMs?: number;
  maxCrops?: number;
}

export interface DocumentReaderResult {
  phase: DocumentReaderPhase;
  progress: number;
  provider: string | null;
  error: string | null;
  detections: DocumentDetection[];
  crops: DocumentCrop[];
  quality: FrameQuality | null;
  inferenceMs: number | null;
  frameSize: { width: number; height: number } | null;
  cameraStatus: CameraStatus;
  cameraError: string | null;
  videoRef: RefObject<HTMLVideoElement>;
  retry: () => void;
  clear: () => void;
}

const resetResults = (
  setDetections: (value: DocumentDetection[]) => void,
  setCrops: (value: DocumentCrop[]) => void,
  setQuality: (value: FrameQuality | null) => void,
  setInferenceMs: (value: number | null) => void,
  setFrameSize: (value: { width: number; height: number } | null) => void
) => {
  setDetections([]);
  setCrops([]);
  setQuality(null);
  setInferenceMs(null);
  setFrameSize(null);
};

export type { DocumentCrop };

export const useDocumentReader = ({
  country,
  active,
  frozen,
  confidence,
  iou,
  intervalMs = 850,
  maxCrops = 24,
}: UseDocumentReaderOptions): DocumentReaderResult => {
  const camera = useDocumentCamera();
  const { start: startCamera, stop: stopCamera, videoRef } = camera;

  const [phase, setPhase] = useState<DocumentReaderPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<DocumentDetection[]>([]);
  const [crops, setCrops] = useState<DocumentCrop[]>([]);
  const [quality, setQuality] = useState<FrameQuality | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [frameSize, setFrameSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const detectorRef = useRef<DocumentDetectorClient | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inFlightRef = useRef(false);
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;

  const clear = useCallback(() => {
    resetResults(
      setDetections,
      setCrops,
      setQuality,
      setInferenceMs,
      setFrameSize
    );
  }, []);

  const retry = useCallback(() => {
    setRetryKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!active) return;

    void startCamera();

    return () => {
      stopCamera();
    };
  }, [active, startCamera, stopCamera]);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      setProgress(0);
      setError(null);
      setProvider(null);
      resetResults(
        setDetections,
        setCrops,
        setQuality,
        setInferenceMs,
        setFrameSize
      );
      return;
    }

    if (!DocumentDetectorClient.isSupported()) {
      setPhase("unsupported");
      setError(
        "Este navegador no soporta Worker + OffscreenCanvas para inferir en tiempo real."
      );
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    detectorRef.current?.dispose();
    detectorRef.current = null;
    setPhase("loading");
    setProgress(0);
    setError(null);
    setProvider(null);
    resetResults(
      setDetections,
      setCrops,
      setQuality,
      setInferenceMs,
      setFrameSize
    );

    const startModel = async () => {
      try {
        const model = await loadDocumentModel(country, {
          onProgress: setProgress,
          signal: abortController.signal,
        });
        if (cancelled) return;

        const detector = new DocumentDetectorClient();
        detectorRef.current = detector;
        await detector.init({
          modelBytes: model.modelBytes,
          labels: model.labels,
          inputSize: model.inputSize,
          wasmPaths: getDocumentWasmPaths(),
        });

        if (cancelled) {
          detector.dispose();
          if (detectorRef.current === detector) {
            detectorRef.current = null;
          }
          return;
        }

        setProvider(detector.getProvider());
        setPhase("running");
      } catch (modelError) {
        if (cancelled) return;
        detectorRef.current?.dispose();
        detectorRef.current = null;
        setPhase("error");
        setError(
          modelError instanceof Error
            ? modelError.message
            : "No se pudo cargar el modelo."
        );
      }
    };

    void startModel();

    return () => {
      cancelled = true;
      abortController.abort();
      const detector = detectorRef.current;
      detectorRef.current = null;
      detector?.dispose();
    };
  }, [active, country, retryKey]);

  const cameraStatus = camera.status;

  useEffect(() => {
    if (
      !active ||
      phase !== "running" ||
      frozen ||
      cameraStatus !== "ready"
    ) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (cancelled || inFlightRef.current) return;

      const video = videoRef.current;
      const detector = detectorRef.current;

      if (
        !video ||
        !detector ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      inFlightRef.current = true;

      try {
        let canvas = frameCanvasRef.current;
        if (!canvas) {
          canvas = document.createElement("canvas");
          frameCanvasRef.current = canvas;
        }

        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
        }
        if (canvas.height !== video.videoHeight) {
          canvas.height = video.videoHeight;
        }

        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const bitmap = await createImageBitmap(canvas);
        const result = await detector.detect(bitmap, confidence, iou);

        if (
          !result ||
          cancelled ||
          frozenRef.current ||
          detectorRef.current !== detector
        ) {
          return;
        }

        setError(null);
        setDetections(result.detections);
        setQuality(result.quality);
        setInferenceMs(Math.round(result.inferenceMs));
        setFrameSize({ width: result.width, height: result.height });

        try {
          setCrops(
            cropDetections(canvas, result.detections, {
              maxCrops,
              maxDimension: 240,
              quality: 0.78,
            })
          );
        } catch {
          setCrops([]);
        }
      } catch (frameError) {
        if (cancelled || detectorRef.current !== detector) return;
        setError(
          frameError instanceof Error
            ? frameError.message
            : "No se pudo procesar el frame."
        );
      } finally {
        inFlightRef.current = false;
      }
    };

    void run();
    const timer = setInterval(() => {
      void run();
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    active,
    phase,
    frozen,
    country,
    cameraStatus,
    confidence,
    iou,
    intervalMs,
    maxCrops,
    videoRef,
  ]);

  return {
    phase,
    progress,
    provider,
    error,
    detections,
    crops,
    quality,
    inferenceMs,
    frameSize,
    cameraStatus: camera.status,
    cameraError: camera.error,
    videoRef,
    retry,
    clear,
  };
};
