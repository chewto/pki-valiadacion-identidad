import { Spinner } from "reactstrap";
import type { GuideSide } from "../../nucleo/vision/document-model.config";
import { useDocumentGuide } from "../../nucleo/hooks/use-document-guide";
import { useDocumentVision } from "../../nucleo/hooks/use-document-vision";
import { describeGuide } from "../../nucleo/vision/document-guide";
import "@styles/documento-guia.css";

interface Props {
  country: string;
  tipoDocumento: string;
  lado: GuideSide;
  onCapture: (dataUrl: string) => void;
}

const modelSizeLabel = (country: string): string =>
  country === "HND" ? "~97 MB" : "~77 MB";

export const CapturaDocumentoGuiada: React.FC<Props> = ({
  country,
  tipoDocumento,
  lado,
  onCapture,
}) => {
  // Estado de la precarga que arrancó al iniciar la validación.
  const vision = useDocumentVision();
  const {
    phase,
    guide,
    checklist,
    provider,
    error,
    inferenceMs,
    videoRef,
    captureNow,
    retry,
  } = useDocumentGuide({
    country,
    tipoDocumento,
    lado,
    onCapture,
  });

  const isRunning = phase === "running";
  const isCapturing = phase === "capturing";
  const isError = phase === "error" || phase === "unavailable";
  const isPreparing = !isRunning && !isCapturing && !isError;
  const isModelDownloading = vision.phase === "downloading";
  const isModelInitializing = vision.phase === "initializing";
  const progressPercent = Math.round(vision.progress * 100);

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

      {isPreparing && (
        <section className="document-guide-card" aria-live="polite">
          <div className="document-guide-loading">
            <Spinner color="primary" />
            <div>
              <p className="document-guide-title">
                {isModelDownloading
                  ? "Descargando el modelo..."
                  : isModelInitializing
                    ? "Preparando el motor de visión..."
                    : "Preparando la cámara..."}
              </p>

              {(isModelDownloading || isModelInitializing) && (
                <div
                  className="document-guide-progress"
                  role="progressbar"
                  aria-label="Carga del modelo de documentos"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    isModelDownloading ? progressPercent : undefined
                  }
                >
                  <div
                    className={`document-guide-progress-fill${
                      isModelInitializing ? " is-indeterminate" : ""
                    }`}
                    style={
                      isModelDownloading
                        ? { width: `${progressPercent}%` }
                        : undefined
                    }
                  />
                </div>
              )}

              <p className="document-guide-hint">
                {isModelDownloading
                  ? `${progressPercent}% · ${modelSizeLabel(country)} · Solo se descarga una vez.`
                  : isModelInitializing
                    ? "El modelo ya está descargado, estamos activando la detección."
                    : "En un momento podrás alinear el documento."}
              </p>
            </div>
          </div>
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
          {phase === "error" && (
            <div className="document-guide-actions">
              <button
                type="button"
                className="document-guide-primary"
                onClick={retry}
              >
                Reintentar
              </button>
            </div>
          )}
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
