import { useCallback, useState } from "react";
import { Spinner } from "reactstrap";
import type { GuideSide } from "../../nucleo/vision/document-model.config";
import { useDocumentGuide } from "../../nucleo/hooks/use-document-guide";
import { describeGuide } from "../../nucleo/vision/document-guide";
import "@styles/documento-guia.css";

interface Props {
  active: boolean;
  country: string;
  tipoDocumento: string;
  lado: GuideSide;
  onCapture: (dataUrl: string) => void;
  onFallback: (reason?: string) => void;
}

const CONSENT_KEY = "ekyc_document_guide_consent";

const modelSizeLabel = (country: string): string =>
  country === "HND" ? "~97 MB" : "~77 MB";

const readConsent = (): boolean => {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
};

export const CapturaDocumentoGuiada: React.FC<Props> = ({
  active,
  country,
  tipoDocumento,
  lado,
  onCapture,
  onFallback,
}) => {
  const [consent, setConsent] = useState(readConsent);
  const consentGiven = active && consent;
  const {
    phase,
    progress,
    guide,
    checklist,
    provider,
    error,
    inferenceMs,
    videoRef,
    captureNow,
    retry,
  } = useDocumentGuide({
    active: consentGiven,
    country,
    tipoDocumento,
    lado,
    onCapture,
  });

  const accept = useCallback(() => {
    try {
      sessionStorage.setItem(CONSENT_KEY, "1");
    } catch {
      // La sesión es opcional.
    }
    setConsent(true);
  }, []);

  const decline = useCallback(() => {
    onFallback("El usuario prefirió la captura normal.");
  }, [onFallback]);

  if (!active) return null;

  if (!consent) {
    return (
      <section
        className="document-guide-card"
        aria-labelledby="document-guide-consent-title"
      >
        <h3 id="document-guide-consent-title" className="document-guide-title">
          Guía con IA para colocar el documento
        </h3>
        <p className="document-guide-text">
          Podemos indicarte en tiempo real si el documento está bien alineado,
          iluminado y si ya se ven los datos. Para eso se descarga un modelo de{" "}
          <strong>{modelSizeLabel(country)}</strong> solo la primera vez.
        </p>
        <div className="document-guide-actions">
          <button type="button" className="document-guide-primary" onClick={accept}>
            Activar guía
          </button>
          <button
            type="button"
            className="document-guide-secondary"
            onClick={decline}
          >
            Usar cámara normal
          </button>
        </div>
      </section>
    );
  }

  const isRunning = phase === "running";
  const isCapturing = phase === "capturing";
  const isLoading = phase === "idle" || phase === "loading";
  const isError = phase === "error" || phase === "unavailable";
  const videoWidth = videoRef.current?.videoWidth ?? 0;
  const videoHeight = videoRef.current?.videoHeight ?? 0;
  const boxes = guide?.containerBoxes ?? [];
  const guideText = isRunning
    ? describeGuide(guide)
    : {
        message: isCapturing
          ? "Procesando la captura..."
          : "Preparando la cámara...",
        hint: isCapturing
          ? "Estamos validando la imagen con el servidor."
          : "En un momento podrás alinear el documento.",
      };

  return (
    <section className="document-guide" aria-label="Guía para capturar el documento">
      <div
        className={`document-guide-frame${isRunning || isCapturing ? "" : " is-offscreen"}`}
        style={
          videoWidth > 0 && videoHeight > 0
            ? { aspectRatio: `${videoWidth} / ${videoHeight}` }
            : undefined
        }
      >
        <video
          ref={videoRef}
          className="document-guide-video"
          muted
          playsInline
          autoPlay
        />
        {(isRunning || isCapturing) && (
          <>
            <div className="document-guide-overlay" aria-hidden="true">
              {boxes.map((box, index) =>
                videoWidth > 0 && videoHeight > 0 ? (
                  <div
                    key={`${box.label}-${index}`}
                    className={`document-guide-box${
                      guide?.code === "ready" ? " is-ready" : ""
                    }`}
                    style={{
                      left: `${(box.box.x1 / videoWidth) * 100}%`,
                      top: `${(box.box.y1 / videoHeight) * 100}%`,
                      width: `${((box.box.x2 - box.box.x1) / videoWidth) * 100}%`,
                      height: `${((box.box.y2 - box.box.y1) / videoHeight) * 100}%`,
                    }}
                  />
                ) : null
              )}
              <div className="document-guide-target" />
            </div>
            <div className="document-guide-badge">
              {isCapturing ? "Procesando..." : "Guía activa"}
            </div>
          </>
        )}
      </div>

      {isLoading && (
        <section className="document-guide-card" aria-live="polite">
          <div className="document-guide-loading">
            <Spinner color="primary" />
            <div>
              <p className="document-guide-title">Descargando el modelo...</p>
              <div
                className="document-guide-progress"
                role="progressbar"
                aria-label="Descarga del modelo de documentos"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <div
                  className="document-guide-progress-fill"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="document-guide-hint">
                {Math.round(progress * 100)}% · Solo se descarga una vez.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="document-guide-secondary"
            onClick={() => onFallback("Descarga del modelo cancelada.")}
          >
            Prefiero la cámara normal
          </button>
        </section>
      )}

      {isError && (
        <section
          className="document-guide-card document-guide-error"
          role="alert"
        >
          <h3 className="document-guide-title">No pudimos iniciar la guía</h3>
          <p className="document-guide-text">
            {error ?? "Ocurrió un problema con el modelo o con la cámara."}
          </p>
          <div className="document-guide-actions">
            {phase === "error" && (
              <button
                type="button"
                className="document-guide-primary"
                onClick={retry}
              >
                Reintentar
              </button>
            )}
            <button
              type="button"
              className="document-guide-secondary"
              onClick={() => onFallback(error ?? "Guía no disponible.")}
            >
              Usar captura normal
            </button>
          </div>
        </section>
      )}

      {(isRunning || isCapturing) && (
        <div
          className={`document-guide-message${
            guide?.code === "ready" ? " is-ready" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <strong>{guideText.message}</strong>
          <span>{guideText.hint}</span>
        </div>
      )}

      {isRunning && checklist.length > 0 && (
        <ul className="document-guide-checklist" aria-label="Campos detectados">
          {checklist.map((item) => (
            <li
              key={item.label}
              className={`${item.detected ? "is-detected" : ""}${
                item.required ? " is-required" : ""
              }`}
            >
              <span aria-hidden="true">{item.detected ? "✓" : "·"}</span>
              {item.displayName}
            </li>
          ))}
        </ul>
      )}

      {isRunning && (
        <div className="document-guide-actions">
          <button
            type="button"
            className="document-guide-primary"
            onClick={captureNow}
          >
            Capturar ahora
          </button>
          <button
            type="button"
            className="document-guide-secondary"
            onClick={() => onFallback("El usuario prefirió la captura normal.")}
          >
            Usar captura normal
          </button>
        </div>
      )}

      {isRunning && (
        <p className="document-guide-meta">
          {provider ? `Motor: ${provider}` : "Motor: —"}
          {inferenceMs !== null ? ` · ${inferenceMs} ms/frame` : ""}
        </p>
      )}
    </section>
  );
};
