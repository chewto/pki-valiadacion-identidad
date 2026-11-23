import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getGuideProfile, isDocumentGuideEnabled } from "../vision/document-model.config";
import {
  GUIDE_THRESHOLDS,
  type GuideSide,
} from "../vision/document-model.config";
import { buildGuideState, getFieldChecklist, type FieldChecklistItem, type GuideState } from "../vision/document-guide";
import {
  ensureDocumentVision,
  getDocumentVisionSnapshot,
  retryDocumentVision,
} from "../vision/document-vision.service";
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
  country: string;
  tipoDocumento: string;
  lado: GuideSide;
  onCapture: (dataUrl: string) => void;
}

export const useDocumentGuide = ({
  country,
  tipoDocumento,
  lado,
  onCapture,
}: UseDocumentGuideOptions) => {
  const camera = useDocumentCamera();
  const { start: startCamera, stop: stopCamera, capture, videoRef } = camera;

  const [phase, setPhase] = useState<DocumentGuidePhase>("idle");
  const [guide, setGuide] = useState<GuideState | null>(null);
  const [checklist, setChecklist] = useState<FieldChecklistItem[]>([]);
  const [detections, setDetections] = useState<DocumentDetection[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [restartKey, setRestartKey] = useState(0);

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
    capturingRef.current = false;
    inferenceInFlightRef.current = false;
    stableSinceRef.current = null;
    setGuide(null);
    setChecklist([]);
    setDetections([]);
    setError(null);

    if (getDocumentVisionSnapshot().phase === "error") {
      void retryDocumentVision()?.catch(() => {
        // El error se refleja en el estado compartido al montar de nuevo.
      });
    }

    setRestartKey((value) => value + 1);
  }, [stopLoop]);

  useEffect(() => {
    if (!isDocumentGuideEnabled()) {
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

    let cancelled = false;
    let consecutiveFrameErrors = 0;

    const finishWithError = (message: string) => {
      if (cancelled) return;
      stopLoop();
      setPhase("error");
      setError(message);
      stopCamera();
    };

    const start = async () => {
      setPhase("loading");
      setError(null);
      setGuide(null);
      setDetections([]);
      setChecklist([]);
      setProvider(null);
      capturingRef.current = false;
      stableSinceRef.current = null;

      let session;
      try {
        // La descarga puede haber empezado al iniciar la validación; aquí solo
        // se espera a que el detector compartido esté listo.
        session = await ensureDocumentVision(country);
      } catch (visionError) {
        if (cancelled) return;
        const visionState = getDocumentVisionSnapshot();
        setPhase(visionState.error ? "error" : "unavailable");
        setError(
          visionError instanceof Error
            ? visionError.message
            : visionState.error ??
                "No se pudo cargar el modelo para la guía del documento."
        );
        return;
      }

      if (cancelled) return;

      if (session.country !== country) {
        finishWithError(
          "El país cambió durante la carga del modelo. Inténtalo de nuevo."
        );
        return;
      }

      const detector = session.client;
      setProvider(session.provider);

      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        finishWithError(
          "No pudimos abrir la cámara. Revisa los permisos del navegador e inténtalo de nuevo."
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
          const result = await detector.detect(
            bitmap,
            GUIDE_THRESHOLDS.confidence,
            GUIDE_THRESHOLDS.iou
          );
          if (!result || cancelled) return;
          consecutiveFrameErrors = 0;
          setInferenceMs(Math.round(result.inferenceMs));
          setDetections(result.detections);
          setChecklist(getFieldChecklist(profile, result.detections));

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
    };

    void start();

    return () => {
      // El detector es compartido y sobrevive al desmontaje (anverso → reverso).
      cancelled = true;
      stopLoop();
      stopCamera();
    };
  }, [
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
