/* eslint-disable @typescript-eslint/no-unused-vars */

import { useRef, useEffect, useState, SetStateAction, Dispatch } from "react";
import * as faceapi from "face-api.js";
// import faceTemplate from "/face_template_OK.png"; // RUTA DE TU IMAGEN
import axios from "axios";
import { URLS } from "@nucleo/api-urls/urls";
import { getCountry } from "@nucleo/hooks/useCountry";
import { PruebaVida } from "@nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "@styles/face-detection.css";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { setFotos } from "@nucleo/redux/slices/informacionSlice";
import {
  setIdCarpetas,
  setMovement,
} from "@nucleo/redux/slices/pruebaVidaSlice";
import { Spinner } from "reactstrap";
import { CameraOverlay } from "@components/validacion-identidad/recuadro";
import { RootState } from "@nucleo/redux/store";
import demoImg from "/demo.png";
import { useMobile } from "@nucleo/hooks/useMobile";
import api from '../nucleo/api-urls/api'
// --- Interfaces ---
// interface ImageDrawing {
//   img: HTMLImageElement | null;
//   isLoaded: boolean;
// }

interface Styles {
  [key: string]: React.CSSProperties;
}

interface Props {
  label: string;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  setMostrarPreview: Dispatch<SetStateAction<boolean>>;
  setCapturarOtraVez: Dispatch<SetStateAction<boolean>>;
  setSuccess: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<boolean>>;
  idUsuarioFi: number | string | null | undefined;
  setMessages: Dispatch<SetStateAction<string[]>>;
  counter: number;
  setCounter: Dispatch<SetStateAction<number>>;
  tries: number;
  timestampVideo: number;
}

// --- CONFIGURACIÓN ---
  const MODEL_URL = `${import.meta.env.BASE_URL}models`;
// const DRAWING_IMG_URL = "/face_template_OK.png"; // RUTA DE TU IMAGEN
// const BRIGHTNESS_THRESHOLD = 50;

const FaceDetection: React.FC<Props> = ({
  label,
  setMostrarPreview,
  setCapturarOtraVez,
  setSuccess,
  setError,
  setMessages,
  counter,
  setCounter,
  tries,
  timestampVideo,
}) => {

  const dispatch = useDispatch();

  const overlaySize = useSelector((state: RootState) => state.pruebaVida);

  const overlaySizeRef = useRef(overlaySize);

  const isMobile = useMobile();

  useEffect(() => {
    console.log("isMobile:", isMobile);
    console.log(handleDetectionLoop, MODEL_URL);
  }, [isMobile]);

  useEffect(() => {
    overlaySizeRef.current = overlaySize;
    console.log(overlaySize);
  }, [overlaySize]);

  const [params] = useSearchParams();

  const idUser = params.get("idUsuario");
  // 1. REFS
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const maskImgRef = useRef<HTMLImageElement>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  // const drawingImageRef = useRef<ImageDrawing>({ img: null, isLoaded: false });

  // 2. ESTADOS
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  // const [isCenteredAndOk, setIsCenteredAndOk] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  // const [message, setMessage] = useState<string>("ESPERANDO ROSTRO");
  const [timer, setTimer] = useState<number>(4);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const sendingMessages = [
    "aplicando filtros",
    "obteniendo frames",
    "validando rostro",
  ];

  const adviceSeconds = 100 * 5;
  const [showAdvice, setShowAdvice] = useState(false);
  const [enableButton, setEnableButton] = useState(false);

  useEffect(() => {
    if (!loading) {
      setCurrentMessageIndex(0);
      return;
    }
    if (currentMessageIndex >= sendingMessages.length - 1) return;

    const min = 1800,
      max = 4000;
    const timeout = setTimeout(
      () => {
        setCurrentMessageIndex((prev) =>
          prev < sendingMessages.length - 1 ? prev + 1 : prev,
        );
      },
      Math.floor(Math.random() * (max - min + 1)) + min,
    );

    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [loading, currentMessageIndex]);

  // --- ESTADOS Y REFS PARA BLOQUEO DE CÁMARA (HARDWARE / PRIVACIDAD) ---
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraMuted, setIsCameraMuted] = useState<boolean>(false);
  const [isCameraBlack, setIsCameraBlack] = useState<boolean>(false);
  const [isCameraFrozen, setIsCameraFrozen] = useState<boolean>(false);

  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const frozenFramesCountRef = useRef<number>(0);

  // activar boton manual
  useEffect(() => {
    setTimeout(() => {
      setShowAdvice(true);
    }, adviceSeconds);
    // if (!isCenteredAndOk) {
    // }
  }, []);

  // 3. CARGA INICIAL
  useEffect(() => {
    const init = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Error cargando modelos:", error);
        setIsModelLoaded(false);
      }
      startVideo();
    };

    init();

    window.addEventListener("resize", handleResize);
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      window.removeEventListener("resize", handleResize);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // useEffect(() => {
  //   if (isCenteredAndOk) recordVideo();
  // }, [isCenteredAndOk]);

  // 4. INICIAR CÁMARA
  const startVideo = () => {
    setCameraError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        // Verificar estado de mute en la pista de video (para interruptores de hardware)
        const videoTrack = currentStream.getVideoTracks()[0];
        if (videoTrack) {
          setIsCameraMuted(videoTrack.muted);
          videoTrack.onmute = () => {
            console.log("Pista de video silenciada por hardware");
            setIsCameraMuted(true);
          };
          videoTrack.onunmute = () => {
            console.log("Pista de video reactivada");
            setIsCameraMuted(false);
          };
        }

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          videoRef.current.onloadedmetadata = () => {
            handleResize();
            videoRef.current?.play();
            if (faceapi.nets.tinyFaceDetector.isLoaded) {
              handleDetectionLoop();
            }
          };
        }
      })
      .catch((err) => {
        console.error("Error cámara:", err);
        setIsModelLoaded(false);
        if (err.name === "NotAllowedError") {
          setCameraError("Permiso de cámara denegado por el usuario o el sistema.");
        } else if (err.name === "NotFoundError") {
          setCameraError("No se encontró ninguna cámara conectada.");
        } else if (err.name === "NotReadableError") {
          setCameraError("La cámara está bloqueada por hardware o en uso por otra aplicación.");
        } else {
          setCameraError(`No se pudo acceder a la cámara (${err.message}).`);
        }
      });
  };

  const handleResize = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const videoRatio = video.videoWidth / video.videoHeight;
    const windowRatio = window.innerWidth / window.innerHeight;

    let finalW, finalH;
    if (windowRatio > videoRatio) {
      finalH = window.innerHeight;
      finalW = finalH * videoRatio;
    } else {
      finalW = window.innerWidth;
      finalH = finalW / videoRatio;
    }
    setVideoDimensions({ width: finalW, height: finalH });
  };

  const prevPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleDetectionLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    // Clear interval if it exists to avoid memory leaks
    if (detectionInterval.current) clearInterval(detectionInterval.current);

    // Crear canvas offscreen para análisis de pixeles (detección de cubierta negra o imagen congelada)
    const checkCanvas = document.createElement("canvas");
    checkCanvas.width = 64;
    checkCanvas.height = 64;
    const checkCtx = checkCanvas.getContext("2d", { willReadFrequently: true });

    detectionInterval.current = setInterval(async () => {
      if (!video || video.paused || video.ended) return;

      // --- ANÁLISIS DE PIXELES (HARDWARE SHUTTER / STATIC PLACEHOLDER) ---
      if (checkCtx && video.videoWidth > 0) {
        try {
          checkCtx.drawImage(video, 0, 0, 64, 64);
          const frameData = checkCtx.getImageData(0, 0, 64, 64).data;

          // 1. Cálculo de Luminancia (Detección de pantalla negra / cubierta física)
          let totalLuminance = 0;
          for (let i = 0; i < frameData.length; i += 4) {
            const r = frameData[i];
            const g = frameData[i + 1];
            const b = frameData[i + 2];
            totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
          }
          const avgLuminance = totalLuminance / (64 * 64);
          if (avgLuminance < 5) {
            setIsCameraBlack(true);
          } else {
            setIsCameraBlack(false);
          }

          // 2. Comparación de Frames (Detección de imagen estática de reemplazo del driver ej. Lenovo Vantage)
          let isFrozen = false;
          if (prevFrameDataRef.current) {
            let identicalPixels = 0;
            for (let i = 0; i < frameData.length; i++) {
              if (frameData[i] === prevFrameDataRef.current[i]) {
                identicalPixels++;
              }
            }
            if (identicalPixels === frameData.length) {
              frozenFramesCountRef.current += 1;
              if (frozenFramesCountRef.current > 5) {
                isFrozen = true;
              }
            } else {
              frozenFramesCountRef.current = 0;
              isFrozen = false;
            }
          }
          prevFrameDataRef.current = new Uint8ClampedArray(frameData);
          setIsCameraFrozen(isFrozen);
        } catch (e) {
          console.error("Error en análisis de pixeles de video:", e);
        }
      }

      // Detect a single face
      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions(),
      );

      if (detection) {
        // 2. Map detection to display size
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        const { x, y, width, height } = resizedDetection.box;

        const currentCenter = {
          x: x + width / 2,
          y: y + height / 2,
        };

        if (prevPosRef.current) {
          // 3. Calculate distance (Movement Test)
          const distance = Math.sqrt(
            Math.pow(currentCenter.x - prevPosRef.current.x, 2) +
            Math.pow(currentCenter.y - prevPosRef.current.y, 2),
          );

          // A threshold of 5-10 pixels is usually enough to filter out camera noise
          const MOVEMENT_THRESHOLD = 7;

          if (distance > MOVEMENT_THRESHOLD) {
            // setMessage("MOVIMIENTO DETECTADO ✅");
            dispatch(setMovement("OK"));
            // Optional: Auto-start recording if movement is detected
            // if (!isRecording) recordVideo();
          } else {
            // setMessage("POR FAVOR, MUEVA SU ROSTRO");
          }
        }

        prevPosRef.current = currentCenter;
      } else {
        // No face in frame
        prevPosRef.current = null;
        // setMessage("ROSTRO NO DETECTADO");
      }
    }, 150); // 150ms is a good balance for performance and responsiveness
  };

  // 6. GRABACIÓN
  useEffect(() => {
    if (!stream || typeof MediaRecorder === "undefined") return;
    let chunks: Blob[] = [];
    const mimeType =
      ["video/webm; codecs=vp9", "video/webm", "video/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      ) || "";

    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
    }); // Fallback simple

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      saveMedia(blob);
      setIsRecording(false);
      chunks = [];
    };
    setMediaRecorder(recorder);
  }, [stream]);

  const getBlockReason = () => {
    if (cameraError) return cameraError;
    if (isCameraMuted) return "La cámara está desactivada por un interruptor de hardware o teclado.";
    if (isCameraBlack) return "La lente de la cámara está cubierta o bloqueada (imagen en negro).";
    if (isCameraFrozen) return "La cámara muestra una imagen estática o de bloqueo (ej. modo privacidad activado en ajustes del fabricante).";
    return null;
  };

  const blockReason = getBlockReason();
  const isCameraBlocked = Boolean(blockReason);

  const recordVideo = () => {
    if (!mediaRecorder || isRecording) return;
    setIsRecording(true);
    if (mediaRecorder.state === "inactive") mediaRecorder.start();
    setTimeout(() => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream)
            .getTracks()
            .forEach((t) => t.stop());
        }
      }
    }, 4000);

    let timerCount = timer;

    const recordingTimer = setInterval(() => {
      setTimer((prev) => prev - 1);
      timerCount -= 1;

      if (timerCount < 0) {
        clearInterval(recordingTimer);
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }
    }, 1000);

    const recordingIndicatorTimer = setInterval(() => {
      setIsRecording(true);

      if (timerCount < 0) {
        clearInterval(recordingIndicatorTimer);
      }
    }, 500);
  };

  const saveMedia = async (data: Blob) => {
    setLoading(true);
    setEnableButton(false);
    const formData = new FormData();

    const blobType = data.type || "";
    const ext = blobType.startsWith("video/mp4") ? "mp4" : "webm";
    const filename = `${getCountry()}/video_${idUser}_${timestampVideo}_${counter + 1}.${ext}`;
    formData.append("video_data", data, filename);

    let videoPath = "";

    const savingStart = performance.now();
    await api
      .post(URLS.saveVideo, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
      })
      .then((res) => {
        const path = res.data;
        videoPath = path.ruta;
      });
    const savingEnd = performance.now();
    const savingTime = (savingEnd - savingStart).toFixed(2);

    // Detectar si el dispositivo es móvil o desktop
    const isMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent,
      );
    const deviceType = isMobile ? "MOBILE" : "DESKTOP";

    const detectStart = performance.now();
    await api
      .post(`${URLS.pruebaVida}?path=${videoPath}&device=${deviceType}`)
      .then((res) => {
        console.log(res.data);

        const preview: string = res.data.photo;
        const allFrames: string[] = res.data.allFrames || [];
        const framesCount: number = res.data.framesCount || allFrames.length;

        const data: PruebaVida = {
          movimiento: res.data.movimientoDetectado,
          videoHash: videoPath,
          allFrames: allFrames,
          framesCount: framesCount,
        };

        if (counter < tries - 1) {
          setMessages((prevMessages) => [
            ...prevMessages,
            ...res.data.messages,
          ]);
        }
        if (counter == tries) {
          setMessages([]);
        }

        if (res.status == 200) {
          if (
            !res.data.photoResult.isReal ||
            res.data.movimientoDetectado == "!OK" ||
            res.data.documentDetection?.document_detected
          ) {
            setCounter((state) => state + 1);
            // setTriesCounter((state) => state - 1)
          }

          if (preview.length >= 1) {
            dispatch(setFotos({ labelFoto: label, data: preview }));
            dispatch(setIdCarpetas(data));
          }
          if (preview.length >= 1 && res.data.messages.length <= 0) {
            // setContinuarBoton(true);
            setSuccess(true);
            setMessages([]);
          }
        }

        // if (res.status == 201) {
        //   setIsCorrupted(true);
        // }
      })
      .finally(() => {
        setMostrarPreview(true);
        setCapturarOtraVez(true);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
      });
    const detectEnd = performance.now();
    const detectTime = (detectEnd - detectStart).toFixed(2);

    await axios.post(
      `${URLS.logs}?country=${getCountry()}`,
      {
        message: `el guardado del video ha tardado ${savingTime} ms | la deteccion ha tardado ${detectTime}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  };

  // 7. RENDER
  return (
    <div
      className="py-2 mt-2 bg-white border-slate-200 border-2 rounded-lg shadow-lg  absolute inset-x-0 top-0 flex flex-col justify-start items-center z-100"
      style={{ height: "auto", bottom: "unset" }}
    >
      {showAdvice && (
        <div
          className="fixed inset-0 flex justify-center items-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm z-50 animate-fadeIn"
          onClick={() => {
            setShowAdvice(false);
            setEnableButton(true);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="
              bg-white rounded-2xl shadow-2xl border border-slate-100
              flex flex-col w-full max-w-md
              max-h-[92vh] max-h-[92dvh]
              outline-none overflow-hidden
              animate-scaleIn
            "
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center font-bold flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-slate-800 m-0">Recomendaciones Clave</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 m-0">Para una validación exitosa</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAdvice(false);
                  setEnableButton(true);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Cerrar recomendaciones"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido adaptable */}
            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col items-center gap-3">
              <div className="w-full grid grid-cols-1 gap-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2 bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <span className="text-blue-600 mt-0.5 text-sm">🎯</span>
                  <span className="leading-snug">Coloque su rostro dentro del recuadro y presione <strong>"Grabar video"</strong>.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <span className="text-amber-500 mt-0.5 text-sm">☀️</span>
                  <span className="leading-snug">Ubíquese en un área iluminada de frente, evitando contraluz directo.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <span className="text-emerald-500 mt-0.5 text-sm">📱</span>
                  <span className="leading-snug">Mantenga el dispositivo firme y limpie la lente de la cámara.</span>
                </div>
              </div>

              <div className="w-full flex justify-center py-1">
                <img
                  src={demoImg}
                  alt="Demostración de pose"
                  className="max-h-24 sm:max-h-32 w-auto object-contain rounded-xl border border-slate-200/80 shadow-sm bg-slate-50"
                />
              </div>

              {/* Botón inferior siempre visible */}
              <div className="w-full pt-1 flex justify-center">
                <button
                  onClick={() => {
                    setShowAdvice(false);
                    setEnableButton(true);
                  }}
                  className="w-full sm:w-auto min-w-[150px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {blockReason && (
        <div className="w-11/12 my-2 animate-fadeIn">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 shadow-sm text-center flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-red-700 font-bold text-sm">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Acceso a Cámara Bloqueado</span>
            </div>
            <span className="text-xs text-red-600 font-medium">{blockReason}</span>
            <span className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Por favor, habilite la cámara en los permisos de su navegador, retire cualquier cubierta física o desactive el modo privacidad para continuar.
            </span>
          </div>
        </div>
      )}

      {!loading ? (
        <div
          style={styles.mainContainer}
          className={`${!isMobile ? "w-5/12" : "w-full"}`}
        >
          {!isRecording ? (
            // <div style={styles.statusIndicator}>{message}</div>
            <></>
          ) : (
            <div style={styles.statusIndicator}>Mantengase quieto.</div>
          )}

          {!isModelLoaded && !cameraError && (
            <div style={styles.loadingOverlay}>Cargando IA...</div>
          )}

          <div
            style={{
              ...styles.videoWrapper,
              // width: isMobile ? "100%" : "80%",
              opacity: videoDimensions.width ? 1 : 0,
            }}
          >
            {isRecording && (
              <div className="text-sm font-semibold opacity-90 absolute top-2 left-4 flex justify-center items-center gap-2 my-2 px-2 py-1 bg-white rounded-lg indicator z-50">
                Grabando {timer} s
                <div className="w-3 h-3 transition-colors duration-300 rounded-xl bg-red-600"></div>
              </div>
            )}
            <video ref={videoRef} muted playsInline style={styles.fullSize} />
            <canvas ref={canvasRef} style={styles.fullSizeAbsolute} />
            {/* REFERENCIA ESTÁTICA CENTRAL (SEMI-TRANSPARENTE) */}
            {/* <img
              ref={maskImgRef}
              src={faceTemplate}
              alt="Guía"
              className="mask-detection"
              // style={styles.maskImage}
            /> */}
            <CameraOverlay />
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center text-center my-4 border border-slate-200 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-sm w-11/12 gap-3 animate-scaleIn">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Spinner color="primary" size="sm" />
          </div>
          <span className="text-sm font-semibold text-slate-700 leading-snug">
            {sendingMessages[currentMessageIndex]}
          </span>
        </div>
      )}

      {enableButton && (
        <div className="w-full flex justify-center items-center">
          <button
            onClick={() => recordVideo()}
            className={`mt-2 px-4 py-2 text-white rounded-lg ${
              isCameraBlocked
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : isRecording
                ? "bg-blue-600 opacity-50 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg transition-all"
            }`}
            disabled={isRecording || isCameraBlocked}
          >
            Grabar video
          </button>
        </div>
      )}
    </div>
  );
};

// --- ESTILOS ---
const styles: Styles = {
  mainContainer: {
    backgroundColor: "#111",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    borderRadius: "12px",
  },
  videoWrapper: {
    position: "relative",
    backgroundColor: "#000",
    boxShadow: "0 0 50px rgba(0,0,0,0.8)",
  },
  fullSize: {
    width: "100%",
    height: "100%",
    objectFit: "fill",
    display: "block",
    transform: "scaleX(-1)",
  },
  fullSizeAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    transform: "scaleX(-1)",
  },
  maskImage: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "70%",
    maxWidth: "350px",
    opacity: 0.3, // Más transparente para que no estorbe
    pointerEvents: "none",
    zIndex: 10,
    filter: "grayscale(100%)", // Guía en gris para diferenciarla de la activa
  },
  statusIndicator: {
    position: "absolute",
    top: 25,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "8px 16px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "white",
    borderRadius: "20px",
    fontWeight: "bold",
    zIndex: 20,
    fontFamily: "sans-serif",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.9)",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
};

export default FaceDetection;
