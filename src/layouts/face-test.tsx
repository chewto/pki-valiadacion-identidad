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
import { Alert, Spinner } from "reactstrap";
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
const MODEL_URL = "/models";
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
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(true);
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
      setIsModelLoaded(true);
      try {
        // await Promise.all([
        //   faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        // ]);

        // Cargar imagen en memoria para el Canvas
        // const imgObj = new Image();
        // imgObj.src = faceTemplate;
        // imgObj.onload = () => {
        //   drawingImageRef.current = { img: imgObj, isLoaded: true };
        //   startVideo();
        // };
        // imgObj.onerror = () => {
        //   drawingImageRef.current = { img: null, isLoaded: false };
        // };
        startVideo();
      } catch (error) {
        console.error("Error cargando modelos:", error);
        setIsModelLoaded(false);
      }
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
            // handleDetectionLoop();
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
    const filename = `${getCountry()}/evidencia_${idUser}_${timestampVideo}_${counter + 1}.${ext}`;
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
          className="flex justify-center md:items-center xsm:items-start md:p-16 xsm:p-2" // Se agrega scroll al contenedor externo
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 200
          }}
          onClick={() => {
            setShowAdvice(false);
            setEnableButton(true);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              color: "#000",
              padding: "20px 24px",
              borderRadius: 12,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              // --- CAMBIOS PARA SCROLL INTERNO ---
              maxHeight: "calc(100vh - 40px)", // Evita que sea más alto que la pantalla
              overflowY: "auto",               // Habilita el scroll interno
              display: "flex",                 // Asegura que el contenido fluya bien
              flexDirection: "column"
            }}
          >
            <div className="flex flex-col items-center md:p-3 xsm:px-1 xsm:py-0">
              <Alert color="info" className="md:text-sm xsm:text-base text-center w-full">
                <strong>Recomendaciones Clave</strong> para una Validación
                Exitosa
              </Alert>
              <ul className="text-justify flex flex-col gap-1 md:px-3 xsm:px-1 m-0 list-disc xsm:text-xs md:text-sm font-bold">
                <li>
                  Coloque su rostro dentro del recuadro y presione "Grabar
                  video" para iniciar la grabación.
                </li>
                <li>
                  Evita la luz solar directa o lámparas muy potentes cerca de la
                  cara.
                </li>
                <li>
                  Mantenga el teléfono firme y limpie el lente de la cámara.
                </li>
                <li>Ubíquese en un área con buena iluminación frontal.</li>
              </ul>
              <img
                src={demoImg}
                alt="demostracion"
                className="md:w-8/12 xsm:w-9/12 my-2 xsm:my-3 rounded-md object-contain"
              />
              <div className="mt-auto"> {/* mt-auto empuja el botón al final si hay espacio */}
                <button
                  onClick={() => {
                    setShowAdvice(false);
                    setEnableButton(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-400 transition-all text-white px-3 py-2 rounded-lg"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {blockReason && (
        <div className="w-11/12 my-2">
          <Alert color="danger" className="m-0 text-center text-sm font-bold shadow-md flex flex-col items-center gap-1">
            <span>⚠️ Acceso a Cámara Bloqueado</span>
            <span className="text-xs font-normal">{blockReason}</span>
            <span className="text-xs font-normal mt-1">Por favor, habilite la cámara, retire cualquier cubierta física o desactive el modo privacidad para poder continuar.</span>
          </Alert>
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
        <div className="flex flex-col justify-center items-center text-center my-4 border-gray-200 bg-slate-100 border-2 rounded-lg p-4 shadow-lg">
          <span>{sendingMessages[currentMessageIndex]}</span>
          <Spinner color="primary" />
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
