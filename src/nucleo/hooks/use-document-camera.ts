import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "starting" | "ready" | "error";

const cameraErrorMessage = (error: unknown): string => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Permiso de cámara denegado. Habilítalo en el navegador para usar la cámara.";
    }
    if (error.name === "NotFoundError") {
      return "No se encontró una cámara disponible.";
    }
    if (error.name === "NotReadableError") {
      return "La cámara está siendo usada por otra aplicación.";
    }
  }

  return "No se pudo acceder a la cámara.";
};

export const useDocumentCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Este navegador no permite abrir la cámara desde la página.");
      setStatus("error");
      return false;
    }

    setStatus("starting");
    setError(null);

    const attempts: MediaStreamConstraints[] = [
      {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
    ];

    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // El navegador puede requerir una interacción del usuario.
          }
        }

        setStatus("ready");
        return true;
      } catch (attemptError) {
        if (constraints === attempts[attempts.length - 1]) {
          setError(cameraErrorMessage(attemptError));
          setStatus("error");
          return false;
        }
      }
    }

    return false;
  }, []);

  const capture = useCallback((maxWidth = 1600): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const scale = Math.min(1, maxWidth / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) return null;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(video, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, status, error, start, stop, capture };
};
