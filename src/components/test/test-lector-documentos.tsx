import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentReader } from "@nucleo/hooks/use-document-reader";
import { colorForLabel, drawDetections } from "@nucleo/vision/document-overlay";
import "@styles/documento-lector.css";

const MODEL_OPTIONS = [
  { value: "COL", label: "Colombia · 33 clases" },
  { value: "HND", label: "Honduras · 18 clases" },
] as const;

const PHASE_LABELS: Record<string, string> = {
  idle: "Inactivo",
  loading: "Cargando modelo",
  running: "Leyendo",
  error: "Error",
  unsupported: "No soportado",
};

const formatBox = (box: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) =>
  `${Math.round(box.x1)}, ${Math.round(box.y1)} → ${Math.round(
    box.x2
  )}, ${Math.round(box.y2)}`;

const TestLectorDocumentos: React.FC = () => {
  const [country, setCountry] = useState<"COL" | "HND">("COL");
  const [active, setActive] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [confidence, setConfidence] = useState(0.25);
  const [iou, setIou] = useState(0.45);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const {
    phase,
    progress,
    provider,
    error,
    detections,
    crops,
    quality,
    inferenceMs,
    frameSize,
    cameraStatus,
    cameraError,
    videoRef,
    retry,
    clear,
  } = useDocumentReader({
    country,
    active,
    frozen,
    confidence,
    iou,
  });

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || !frameSize) return;

    if (canvas.width !== frameSize.width) {
      canvas.width = frameSize.width;
    }
    if (canvas.height !== frameSize.height) {
      canvas.height = frameSize.height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawDetections(ctx, detections, {
      frameWidth: frameSize.width,
      frameHeight: frameSize.height,
    });
  }, [detections, frameSize]);

  const sortedDetections = [...detections].sort(
    (a, b) => b.score - a.score
  );
  const aspectRatio = frameSize
    ? `${frameSize.width} / ${frameSize.height}`
    : "16 / 9";

  return (
    <div className="max-w-6xl mx-auto my-6 px-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Lector de etiquetas con cámara
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl">
            Prueba directa del ONNX: cajas, etiquetas, confianza y recortes.
            No usa el backend de validación.
          </p>
        </div>
        <Link
          to="/test/documento-vision"
          className="text-sm font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2"
        >
          Abrir guía completa →
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs font-bold text-slate-700">
            Modelo
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value as "COL" | "HND");
                setFrozen(false);
              }}
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold text-slate-700">
            Confianza mínima: {confidence.toFixed(2)}
            <input
              className="mt-2 w-full accent-blue-600"
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={confidence}
              onChange={(event) =>
                setConfidence(Number(event.target.value))
              }
            />
          </label>

          <label className="text-xs font-bold text-slate-700">
            IoU NMS: {iou.toFixed(2)}
            <input
              className="mt-2 w-full accent-blue-600"
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={iou}
              onChange={(event) => setIou(Number(event.target.value))}
            />
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={() => setActive((value) => !value)}
            >
              {active ? "Detener" : "Iniciar cámara"}
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200 disabled:opacity-50"
              onClick={() => setFrozen((value) => !value)}
              disabled={!active || phase !== "running"}
            >
              {frozen ? "Reanudar" : "Congelar"}
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200 disabled:opacity-50"
              onClick={clear}
              disabled={!active || detections.length === 0}
            >
              Limpiar
            </button>
          </div>
        </div>

        {phase === "loading" && (
          <div className="mt-4" aria-live="polite">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Descargando / cargando modelo...</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {(error || cameraError) && (
          <div
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {cameraError ?? error}
            {phase === "error" && (
              <button
                type="button"
                className="ml-3 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800"
                onClick={retry}
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Modelo: {country === "COL" ? "Colombia" : "Honduras"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Estado: {PHASE_LABELS[phase] ?? phase}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Motor: {provider ?? "—"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Inferencia: {inferenceMs !== null ? `${inferenceMs} ms` : "—"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Detecciones: {detections.length}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Frame:{" "}
            {frameSize ? `${frameSize.width}×${frameSize.height}` : "—"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Cámara: {cameraStatus}
          </span>
          {quality && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              Luz: {Math.round(quality.luminance)} · Nitidez:{" "}
              {Math.round(quality.sharpness)}
            </span>
          )}
          {frozen && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
              Congelado
            </span>
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div
            className="reader-video-shell"
            style={{ aspectRatio }}
          >
            <video
              ref={videoRef}
              className="reader-video"
              muted
              playsInline
              autoPlay
            />
            <canvas ref={overlayRef} className="reader-overlay" />

            {!active && (
              <div className="reader-placeholder">
                <p>Pulsa “Iniciar cámara” para cargar el modelo y leer.</p>
              </div>
            )}

            {active && phase === "loading" && (
              <div className="reader-placeholder">
                <p>Cargando modelo {country === "COL" ? "Colombia" : "Honduras"}...</p>
              </div>
            )}

            {active && phase === "unsupported" && (
              <div className="reader-placeholder">
                <p>Este navegador no soporta la inferencia en tiempo real.</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Los recuadros y las etiquetas se dibujan sobre el video. El recorte
            se toma del mismo frame que se analizó.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-800">
              Detecciones
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">
              {sortedDetections.length} etiquetas
            </span>
          </div>

          {sortedDetections.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sin detecciones todavía. Mueve el documento frente a la cámara.
            </p>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-1.5">Etiqueta</th>
                    <th className="px-2 py-1.5">Conf.</th>
                    <th className="px-2 py-1.5">Caja</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDetections.map((detection, index) => (
                    <tr
                      key={`${detection.label}-${index}`}
                      className="border-t border-slate-100"
                    >
                      <td className="px-2 py-1.5">
                        <span
                          className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm"
                          style={{
                            backgroundColor: colorForLabel(detection.label),
                          }}
                        />
                        <span className="font-semibold text-slate-800">
                          {detection.label}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">
                        {Math.round(detection.score * 100)}%
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[10px] text-slate-500">
                        {formatBox(detection.box)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800">Recortes</h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {crops.length} recortes
          </span>
        </div>

        {crops.length === 0 ? (
          <p className="text-sm text-slate-500">
            Cuando haya detecciones, aquí aparecerán los recortes de cada
            etiqueta.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {crops.map((crop, index) => (
              <article
                key={crop.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-1.5"
              >
                <img
                  src={crop.dataUrl}
                  alt={`Recorte ${crop.label}`}
                  className="h-20 w-full rounded-lg bg-white object-contain"
                />
                <p className="mt-1 truncate text-[10px] font-bold text-slate-800" title={crop.label}>
                  {crop.label}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{Math.round(crop.score * 100)}%</span>
                  <a
                    className="font-semibold text-blue-700 hover:text-blue-800"
                    href={crop.dataUrl}
                    download={`${crop.label}-${index + 1}.jpg`}
                  >
                    Descargar
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TestLectorDocumentos;
