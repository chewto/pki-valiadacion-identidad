import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getGuideProfile, isDocumentGuideEnabled } from "../vision/document-model.config";
import {
  GUIDE_THRESHOLDS,
  type GuideSide,
} from "../vision/document-model.config";
import { buildGuideState, getFieldChecklist, type FieldChecklistItem, type GuideState } from "../vision/document-guide";
import { DocumentDetectorClient } from "../vision/document-detector.client";
import { loadDocumentModel } from "../vision/document-model.loader";
import { getDocumentWasmPaths } from "../vision/document-runtime";
import { useDocumentCamera } from "./use-document-camera";
import type { DocumentDetection } from "../vision/document-postprocess";

export type DocumentGuidePhase =
  | "idle"
  | "loading"
  | "running"
  | "capturing"
  | "error"
  | "unavailable";

interface UseDocumentGuideOptions {
  active: boolean;
  country: string;
  tipoDocumento: string;
  lado: GuideSide;
  onCapture: (dataUrl: string) => void;
}

export const useDocumentGuide = ({
  active,
  country,
  tipoDocumento,
  lado,
  onCapture,
}: UseDocumentGuideOptions) => {
  const camera = useDocumentCamera();
  const { start: startCamera, stop: stopCamera, capture, videoRef } = camera;

  const [phase, setPhase] = useState<DocumentGuidePhase>("idle");
  const [progress, setProgress] = useState(0);
  const [guide, setGuide] = useState<GuideState | null>(null);
  const [checklist, setChecklist] = useState<FieldChecklistItem[]>([]);
  const [detections, setDetections] = useState<DocumentDetection[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  const detectorRef = useRef<DocumentDetectorClient | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stableSinceRef = useRef<number | null>(null);
  const capturingRef = useRef(false);
  const inferenceInFlightRef = useRef(false);
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;

  const profile = useMemo(
    () => getGuideProfile(country, tipoDocumento, lado),
    [country, tipoDocumento, lado]
  );

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  const captureNow = useCallback(() => {
    if (capturingRef.current) return;
    const dataUrl = capture();
    if (!dataUrl) return;
    capturingRef.current = true;
    stopLoop();
    stopCamera();
    setPhase("capturing");
    onCaptureRef.current(dataUrl);
  }, [capture, stopCamera, stopLoop]);

  const retry = useCallback(() => {
    stopLoop();
    detectorRef.current?.dispose();
    detectorRef.current = null;
    capturingRef.current = false;
    inferenceInFlightRef.current = false;
    stableSinceRef.current = null;
    setGuide(null);
    setChecklist([]);
    setDetections([]);
    setError(null);
    setProgress(0);
    setRestartKey((value) => value + 1);
  }, [stopLoop]);

  useEffect(() => {
    if (!active || !isDocumentGuideEnabled()) {
      setPhase("idle");
      return;
    }

    if (!profile) {
      setPhase("unavailable");
      setError(
        "La guía con modelo no está disponible para este tipo de documento."
      );
      return;
    }

    if (!DocumentDetectorClient.isSupported()) {
      setPhase("unavailable");
      setError(
        "Este navegador no soporta la detección en tiempo real. Puedes subir la foto igualmente."
      );
      return;
    }

    let cancelled = false;
    let detector: DocumentDetectorClient | null = null;
    let consecutiveFrameErrors = 0;
    const abortController = new AbortController();

    const finishWithError = (message: string) => {
      if (cancelled) return;
      stopLoop();
      detector?.dispose();
      detectorRef.current = null;
      setPhase("error");
      setError(message);
      stopCamera();
    };

    const start = async () => {
      setPhase("loading");
      setProgress(0);
      setError(null);
      setGuide(null);
      setDetections([]);
      setChecklist([]);
      capturingRef.current = false;
      stableSinceRef.current = null;

      try {
        const model = await loadDocumentModel(country, {
          onProgress: setProgress,
          signal: abortController.signal,
        });
        if (cancelled) return;

        detector = new DocumentDetectorClient();
        detectorRef.current = detector;
        await detector.init({
          modelBytes: model.modelBytes,
          labels: model.labels,
          inputSize: model.inputSize,
          wasmPaths: getDocumentWasmPaths(),
        });
        if (cancelled) return;
        setProvider(detector.getProvider());

        const cameraStarted = await startCamera();
        if (!cameraStarted) {
          finishWithError(
            "No pudimos abrir la cámara. Revisa los permisos o usa la captura normal."
          );
          return;
        }
        if (cancelled) return;

        setPhase("running");

        const runFrame = async () => {
          if (
            cancelled ||
            capturingRef.current ||
            inferenceInFlightRef.current
          ) {
            return;
          }
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;

          inferenceInFlightRef.current = true;

          try {
            const bitmap = await createImageBitmap(video);
            const result = await detector?.detect(
              bitmap,
              GUIDE_THRESHOLDS.confidence,
              GUIDE_THRESHOLDS.iou
            );
            if (!result || cancelled) return;
            consecutiveFrameErrors = 0;
            setInferenceMs(Math.round(result.inferenceMs));
            setDetections(result.detections);
            setChecklist(
              getFieldChecklist(profile, result.detections)
            );

            const nextGuide = buildGuideState({
              country,
              tipoDocumento,
              side: lado,
              detections: result.detections,
              profile,
              quality: result.quality,
              frameWidth: result.width,
              frameHeight: result.height,
            });
            setGuide(nextGuide);

            if (nextGuide.canCapture) {
              if (stableSinceRef.current === null) {
                stableSinceRef.current = Date.now();
              } else if (
                Date.now() - stableSinceRef.current >=
                GUIDE_THRESHOLDS.stableMs
              ) {
                captureNow();
              }
            } else {
              stableSinceRef.current = null;
            }
          } catch (frameError) {
            if (cancelled) return;
            consecutiveFrameErrors += 1;
            const message =
              frameError instanceof Error
                ? frameError.message
                : "No se pudo analizar el frame.";
            if (consecutiveFrameErrors >= 3) {
              finishWithError(message);
            } else {
              setError(message);
            }
          } finally {
            inferenceInFlightRef.current = false;
          }
        };

        loopRef.current = setInterval(() => {
          void runFrame();
        }, GUIDE_THRESHOLDS.inferenceIntervalMs);
      } catch (startError) {
        const message =
          startError instanceof Error
            ? startError.message
            : "No se pudo iniciar la guía con modelo.";
        finishWithError(
          message.includes("repositorio")
            ? `${message} Verifica que los modelos de Hugging Face sean públicos.`
            : message
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      abortController.abort();
      stopLoop();
      detector?.dispose();
      detectorRef.current = null;
      stopCamera();
    };
  }, [
    active,
    country,
    tipoDocumento,
    lado,
    profile,
    restartKey,
    startCamera,
    stopCamera,
    stopLoop,
    videoRef,
    captureNow,
  ]);

  return {
    phase,
    progress,
    guide,
    checklist,
    detections,
    provider,
    error,
    inferenceMs,
    videoRef,
    cameraStatus: camera.status,
    cameraError: camera.error,
    captureNow,
    retry,
  };
};
