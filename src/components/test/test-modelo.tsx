import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";
const MANIFESTS = [
  "tiny_face_detector_model-weights_manifest.json",
  "ssd_mobilenetv1_model-weights_manifest.json",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_recognition_model-weights_manifest.json",
  "age_gender_model-weights_manifest.json",
  "face_expression_model-weights_manifest.json",
  "mtcnn_model-weights_manifest.json",
];

type EstadoCarga = "pendiente" | "cargando" | "ok" | "error";

interface ResultadoModelo {
  nombre: string;
  estado: EstadoCarga;
  httpStatus: number | null;
  tiempoMs: number | null;
  error: string | null;
}

interface ResultadoDeteccion {
  detector: string;
  estado: EstadoCarga;
  rostros: number | null;
  error: string | null;
}

const MODELOS: { nombre: string; net: { loadFromUri: (url: string) => Promise<unknown> }; manifest: string }[] = [
  { nombre: "Tiny Face Detector", net: faceapi.nets.tinyFaceDetector, manifest: MANIFESTS[0] },
  { nombre: "SSD MobileNet v1", net: faceapi.nets.ssdMobilenetv1, manifest: MANIFESTS[1] },
  { nombre: "Face Landmark 68", net: faceapi.nets.faceLandmark68Net, manifest: MANIFESTS[2] },
  { nombre: "Face Landmark 68 Tiny", net: faceapi.nets.faceLandmark68TinyNet, manifest: MANIFESTS[3] },
  { nombre: "Face Recognition", net: faceapi.nets.faceRecognitionNet, manifest: MANIFESTS[4] },
  { nombre: "Age / Gender", net: faceapi.nets.ageGenderNet, manifest: MANIFESTS[5] },
  { nombre: "Face Expression", net: faceapi.nets.faceExpressionNet, manifest: MANIFESTS[6] },
  { nombre: "MTCNN", net: faceapi.nets.mtcnn, manifest: MANIFESTS[7] },
];

const resultadoInicial = (): ResultadoModelo[] =>
  MODELOS.map((m) => ({
    nombre: m.nombre,
    estado: "pendiente",
    httpStatus: null,
    tiempoMs: null,
    error: null,
  }));

const estadoColor: Record<EstadoCarga, string> = {
  pendiente: "bg-gray-200 text-gray-700",
  cargando: "bg-yellow-100 text-yellow-800",
  ok: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

const TestModelo: React.FC = () => {
  const [resultados, setResultados] = useState<ResultadoModelo[]>(resultadoInicial);
  const [detecciones, setDetecciones] = useState<ResultadoDeteccion[]>([]);
  const [cargandoTodo, setCargandoTodo] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const log = useCallback((msg: string) => {
    const linea = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(linea);
    setLogs((prev) => [...prev.slice(-49), linea]);
  }, []);

  const actualizar = useCallback((indice: number, cambios: Partial<ResultadoModelo>) => {
    setResultados((prev) => prev.map((r, i) => (i === indice ? { ...r, ...cambios } : r)));
  }, []);

  const ejecutarPruebas = useCallback(async () => {
    setCargandoTodo(true);
    setResultados(resultadoInicial());
    setDetecciones([]);
    setLogs([]);
    log("Inicio de pruebas de modelos");

    // Fase 1: verificar disponibilidad HTTP de cada manifest
    const fallosHttp = new Set<number>();
    for (let i = 0; i < MODELOS.length; i++) {
      const m = MODELOS[i];
      try {
        const resp = await fetch(`${MODEL_URL}/${m.manifest}`);
        actualizar(i, { httpStatus: resp.status });
        log(`HTTP ${resp.status} — ${m.manifest}`);
        if (!resp.ok) {
          fallosHttp.add(i);
          actualizar(i, { estado: "error", error: `Manifest no disponible (HTTP ${resp.status})` });
          continue;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fallosHttp.add(i);
        actualizar(i, { httpStatus: null, estado: "error", error: `Fallo de red: ${msg}` });
        log(`ERROR fetch ${m.manifest}: ${msg}`);
      }
    }

    // Fase 2: carga real de cada modelo
    for (let i = 0; i < MODELOS.length; i++) {
      const m = MODELOS[i];
      if (fallosHttp.has(i)) continue;
      actualizar(i, { estado: "cargando" });
      const inicio = performance.now();
      try {
        await m.net.loadFromUri(MODEL_URL);
        const tiempo = Math.round(performance.now() - inicio);
        actualizar(i, { estado: "ok", tiempoMs: tiempo });
        log(`OK ${m.nombre} en ${tiempo} ms`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        actualizar(i, { estado: "error", error: msg, tiempoMs: Math.round(performance.now() - inicio) });
        log(`ERROR cargando ${m.nombre}: ${msg}`);
      }
    }

    // Fase 3: detección real sobre una imagen
    if (!imgRef.current) {
      log("No hay imagen de prueba disponible");
      setCargandoTodo(false);
      return;
    }
    await new Promise<void>((resolve) => {
      const img = imgRef.current!;
      if (img.complete && img.naturalWidth > 0) resolve();
      else {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }
    });

    const img = imgRef.current;
    if (!img || img.naturalWidth === 0) {
      log("Error: la imagen /demo.png no se pudo cargar");
      setCargandoTodo(false);
      return;
    }

    const descriptores: {
      detector: string;
      resultado: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>[];
    }[] = [];
    if (faceapi.nets.tinyFaceDetector.isLoaded) {
      setDetecciones((prev) => [...prev, { detector: "Tiny Face Detector", estado: "cargando", rostros: null, error: null }]);
      try {
        const r = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        descriptores.push({ detector: "Tiny Face Detector", resultado: r });
        log(`Detección TinyFaceDetector: ${r.length} rostro(s)`);
        setDetecciones((prev) =>
          prev.map((d) => (d.detector === "Tiny Face Detector" ? { ...d, estado: "ok", rostros: r.length } : d))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`ERROR detección TinyFaceDetector: ${msg}`);
        setDetecciones((prev) =>
          prev.map((d) => (d.detector === "Tiny Face Detector" ? { ...d, estado: "error", error: msg } : d))
        );
      }
    }
    if (faceapi.nets.ssdMobilenetv1.isLoaded) {
      setDetecciones((prev) => [...prev, { detector: "SSD MobileNet v1", estado: "cargando", rostros: null, error: null }]);
      try {
        const r = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
        descriptores.push({ detector: "SSD MobileNet v1", resultado: r });
        log(`Detección SSD MobileNet: ${r.length} rostro(s)`);
        setDetecciones((prev) =>
          prev.map((d) => (d.detector === "SSD MobileNet v1" ? { ...d, estado: "ok", rostros: r.length } : d))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`ERROR detección SSD MobileNet: ${msg}`);
        setDetecciones((prev) =>
          prev.map((d) => (d.detector === "SSD MobileNet v1" ? { ...d, estado: "error", error: msg } : d))
        );
      }
    }

    // Dibujar resultados sobre el canvas (dimensiones naturales de la imagen)
    const canvas = canvasRef.current;
    if (canvas && descriptores.length > 0) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        descriptores.forEach(({ resultado }) => {
          resultado.forEach((d) => {
            const { x, y, width, height } = d.detection.box;
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = Math.max(3, Math.round(img.naturalWidth / 300));
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = "#ef4444";
            d.landmarks.positions.forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            });
          });
        });
      }
    }

    log("Pruebas finalizadas");
    setCargandoTodo(false);
  }, [actualizar, log]);

  useEffect(() => {
    ejecutarPruebas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      <h1 className="text-2xl font-bold mb-2">Prueba de modelos face-api.js</h1>
      <p className="text-sm text-gray-600 mb-4">
        Ruta base: <code className="bg-gray-100 px-1">{MODEL_URL}</code> — se verifica el manifest por HTTP, se carga
        cada modelo y se ejecuta una detección real sobre <code className="bg-gray-100 px-1">/demo.png</code>.
      </p>

      <button
        onClick={ejecutarPruebas}
        disabled={cargandoTodo}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {cargandoTodo ? "Ejecutando..." : "Reintentar pruebas"}
      </button>

      <h2 className="text-lg font-semibold mb-2">1. Carga de modelos</h2>
      <table className="w-full border-collapse text-sm mb-6">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">Modelo</th>
            <th className="border p-2">HTTP manifest</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Tiempo</th>
            <th className="border p-2">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {resultados.map((r) => (
            <tr key={r.nombre}>
              <td className="border p-2 font-medium">{r.nombre}</td>
              <td className="border p-2">{r.httpStatus ?? "—"}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${estadoColor[r.estado]}`}>{r.estado}</span>
              </td>
              <td className="border p-2">{r.tiempoMs != null ? `${r.tiempoMs} ms` : "—"}</td>
              <td className="border p-2 text-xs break-all">{r.error ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mb-2">2. Detección sobre imagen de prueba</h2>
      {detecciones.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">Sin resultados de detección.</p>
      ) : (
        <table className="w-full border-collapse text-sm mb-4">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border p-2">Detector</th>
              <th className="border p-2">Estado</th>
              <th className="border p-2">Rostros detectados</th>
              <th className="border p-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {detecciones.map((d) => (
              <tr key={d.detector}>
                <td className="border p-2 font-medium">{d.detector}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${estadoColor[d.estado]}`}>{d.estado}</span>
                </td>
                <td className="border p-2">{d.rostros ?? "—"}</td>
                <td className="border p-2 text-xs break-all">{d.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="relative inline-block mb-4">
        <img ref={imgRef} src="demo.png" alt="Imagen de prueba" className="max-w-full max-h-80 border" crossOrigin="anonymous" />
        <canvas ref={canvasRef} className="absolute top-0 left-0 max-w-full max-h-80" />
      </div>

      <h2 className="text-lg font-semibold mb-2">3. Log</h2>
      <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded max-h-64 overflow-auto whitespace-pre-wrap">
        {logs.join("\n") || "(vacío)"}
      </pre>
    </div>
  );
};

export default TestModelo;
