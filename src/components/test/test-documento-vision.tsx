import { useState } from "react";
import { Link } from "react-router-dom";
import { CapturaDocumentoGuiada } from "@components/validacion-identidad/captura-documento-guiada";
import type { GuideSide } from "@nucleo/vision/document-model.config";

const DOCUMENT_OPTIONS = {
  COL: ["CEDULA DE CIUDADANIA", "CEDULA DE EXTRANJERIA", "CEDULA DIGITAL", "PASAPORTE"],
  HND: ["DNI"],
} as const;

const TestDocumentoVision: React.FC = () => {
  const [country, setCountry] = useState<"COL" | "HND">("COL");
  const [tipoDocumento, setTipoDocumento] = useState("CEDULA DE CIUDADANIA");
  const [lado, setLado] = useState<GuideSide>("anverso");
  const [captures, setCaptures] = useState<string[]>([]);

  return (
    <div className="max-w-2xl mx-auto my-6 px-4">
      <h1 className="text-2xl font-bold mb-1">Diagnóstico de guía de documentos</h1>
      <p className="text-sm text-gray-600 mb-4">
        Carga el ONNX desde Hugging Face, abre la cámara y valida las detecciones
        sin pasar por el backend de validación.
      </p>
      <Link
        to="/test/lector"
        className="inline-block mb-4 text-sm font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2"
      >
        Abrir lector de etiquetas y recortes →
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <label className="text-sm font-semibold text-slate-700">
          País
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            value={country}
            onChange={(event) => {
              const next = event.target.value as "COL" | "HND";
              setCountry(next);
              setTipoDocumento(DOCUMENT_OPTIONS[next][0]);
            }}
          >
            <option value="COL">Colombia</option>
            <option value="HND">Honduras</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Documento
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            value={tipoDocumento}
            onChange={(event) => setTipoDocumento(event.target.value)}
          >
            {DOCUMENT_OPTIONS[country].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Lado
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            value={lado}
            onChange={(event) => setLado(event.target.value as GuideSide)}
          >
            <option value="anverso">Anverso</option>
            <option value="reverso">Reverso</option>
          </select>
        </label>
      </div>

      <CapturaDocumentoGuiada
        key={`${country}-${tipoDocumento}-${lado}`}
        active
        country={country}
        tipoDocumento={tipoDocumento}
        lado={lado}
        onCapture={(dataUrl) => {
          setCaptures((previous) => [dataUrl, ...previous].slice(0, 3));
        }}
        onFallback={(reason) => console.log("Guía desactivada:", reason)}
      />

      {captures.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Últimas capturas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {captures.map((capture, index) => (
              <img
                key={index}
                src={capture}
                alt={`Captura de prueba ${index + 1}`}
                className="w-full rounded-lg border border-slate-200"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDocumentoVision;
