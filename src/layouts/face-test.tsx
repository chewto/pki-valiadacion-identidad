/* eslint-disable @typescript-eslint/no-unused-vars */

import { useRef, useEffect, useState, SetStateAction, Dispatch } from "react";
import * as faceapi from "face-api.js";
import faceTemplate from "/face_template_OK.png"; // RUTA DE TU IMAGEN
import axios from "axios";
import { URLS } from "@nucleo/api-urls/urls";
import { PruebaVida } from "@nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "@styles/face-detection.css";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { setFotos } from "@nucleo/redux/slices/informacionSlice";
import { setIdCarpetas } from "@nucleo/redux/slices/pruebaVidaSlice";
import { Spinner } from "reactstrap";

// --- Interfaces ---
interface ImageDrawing {
  img: HTMLImageElement | null;
  isLoaded: boolean;
}

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
}

// --- CONFIGURACIÓN ---
const MODEL_URL = "/models";
// const DRAWING_IMG_URL = "/face_template_OK.png"; // RUTA DE TU IMAGEN
const BRIGHTNESS_THRESHOLD = 50;

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
}) => {
  const dispatch = useDispatch();

  const [params] = useSearchParams();

  const idUser = params.get("idUsuario");
  // 1. REFS
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskImgRef = useRef<HTMLImageElement>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const drawingImageRef = useRef<ImageDrawing>({ img: null, isLoaded: false });

  // 2. ESTADOS
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(true);
  const [isCenteredAndOk, setIsCenteredAndOk] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [message, setMessage] = useState<string>("ESPERANDO ROSTRO");
  const [timer, setTimer] = useState<number>(4);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const sendingMessages = [
    "aplicando filtros",
    "obteniendo frames",
    "validando rostro",
  ];

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
    const timeout = setTimeout(() => {
      setCurrentMessageIndex((prev) =>
        prev < sendingMessages.length - 1 ? prev + 1 : prev
      );
    }, Math.floor(Math.random() * (max - min + 1)) + min);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [loading, currentMessageIndex]);

  // activar boton manual
  useEffect(() => {
    if (!isCenteredAndOk) {
      setTimeout(() => {
        setShowAdvice(true);
      }, 1000);
    }
  }, []);

  // 3. CARGA INICIAL
  useEffect(() => {
    const init = async () => {
      setIsModelLoaded(true);
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        ]);

        // Cargar imagen en memoria para el Canvas
        const imgObj = new Image();
        imgObj.src = faceTemplate;
        imgObj.onload = () => {
          drawingImageRef.current = { img: imgObj, isLoaded: true };
          startVideo();
        };
        imgObj.onerror = () => {
          drawingImageRef.current = { img: null, isLoaded: false };
          startVideo();
        };
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

  useEffect(() => {
    if (isCenteredAndOk && !enableButton) recordVideo();
  }, [isCenteredAndOk]);

  // 4. INICIAR CÁMARA
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          videoRef.current.onloadedmetadata = () => {
            handleResize();
            videoRef.current?.play();
            handleDetectionLoop();
          };
        }
      })
      .catch((err) => {
        console.error("Error cámara:", err);
        setIsModelLoaded(false);
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

  // 5. LOOP DE DETECCIÓN (CANVAS)
  const handleDetectionLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const maskImg = maskImgRef.current;

    if (!video || !canvas || !maskImg) return;

    if (video.videoWidth === 0) {
      setTimeout(handleDetectionLoop, 100);
      return;
    }

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setIsModelLoaded(false);
    if (detectionInterval.current) clearInterval(detectionInterval.current);

    detectionInterval.current = setInterval(async () => {
      if (!video || video.paused || video.ended) return;

      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext("2d");

      // activar primera advertencia

      // if( resizedDetections.length === 0 ){
      //   setTimeout(() => {
      //     setShowAdvice(true);
      //   }, 1000); 
      // }

      if (ctx) {
        // A. CÁLCULO DE BRILLO
        ctx.drawImage(video, 0, 0, displaySize.width, displaySize.height);
        let avgBrightness = 255;

        if (resizedDetections.length > 0) {
          const b = resizedDetections[0].box;
          const sx = Math.max(0, b.x);
          const sy = Math.max(0, b.y);
          const sw = Math.min(b.width, displaySize.width - sx);
          const sh = Math.min(b.height, displaySize.height - sy);
          if (sw > 0 && sh > 0) {
            const data = ctx.getImageData(sx, sy, sw, sh).data;
            let sum = 0,
              count = 0;
            for (let i = 0; i < data.length; i += 32) {
              sum +=
                0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              count++;
            }
            avgBrightness = count ? sum / count : 0;
          }
        }
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);

        // B. LÓGICA DE COORDENADAS
        const vRect = video.getBoundingClientRect();
        const mRect = maskImg.getBoundingClientRect();
        const scaleX = video.videoWidth / vRect.width;
        const scaleY = video.videoHeight / vRect.height;

        // Máscara estática convertida a coordenadas internas
        const maskInternal = {
          x: (mRect.left - vRect.left) * scaleX,
          y: (mRect.top - vRect.top) * scaleY,
          width: mRect.width * scaleX,
          height: mRect.height * scaleY,
        };

        // let feedbackMessage = "🟡 Encuadra tu rostro";
        let feedbackMessage = "";
        let feedbackColor = "#FFD700"; // Amarillo por defecto

        if (resizedDetections.length > 0) {
          const faceBox = resizedDetections[0].box;
          const faceCenterX = faceBox.x + faceBox.width / 2;
          const faceCenterY = faceBox.y + faceBox.height / 2;

          const maskCenterX = maskInternal.x + maskInternal.width / 2;
          const maskCenterY = maskInternal.y + maskInternal.height / 2;

          const toleranceX = maskInternal.width * 0.07;
          const toleranceY = maskInternal.height * 0.07;

          if (avgBrightness < BRIGHTNESS_THRESHOLD) {
            // feedbackMessage = "🌑 Muy oscuro";
            // feedbackColor = "red"; // Rojo para error crítico
          } else {
            const isCenteredX =
              Math.abs(faceCenterX - maskCenterX) < toleranceX;
            const isCenteredY =
              Math.abs(faceCenterY - maskCenterY) < toleranceY;
            const fillRatio = faceBox.width / maskInternal.width;
            const isSizeOk = fillRatio > 0.45 && fillRatio < 0.85;

            if (isCenteredX && isCenteredY && isSizeOk) {
              // feedbackMessage = "🟢 ¡Perfecto!";

              setMessage("✅ VALIDANDO...");
              feedbackColor = "#00FF00"; // Verde
              setIsCenteredAndOk((prev) => (!prev ? true : prev));
            } else {
              setIsCenteredAndOk(false);
              if (!isSizeOk) {
                // feedbackMessage = fillRatio < 0.45 ? "🔴 Acércate" : "🔴 Aléjate";
                // feedbackColor = "orange";
              } else {
                setMessage("centra tu cara");
                // feedbackMessage = "🟠 Centra tu cara";
                feedbackColor = "#ff4d00";
              }
            }
          }

          // --- C. DIBUJADO DE LA IMAGEN EN LA CARA (TINTADA) ---
          if (drawingImageRef.current.isLoaded && drawingImageRef.current.img) {
            const img = drawingImageRef.current.img;

            // 1. Calcular tamaño de la máscara dinámica (un poco más grande que la cara real para que encaje)
            // Multiplicamos por 1.3 para que la máscara sea un "marco" alrededor de la cara detectada
            const scaleFactor = 1.3;
            const drawW = faceBox.width * scaleFactor;
            const drawH = faceBox.height * scaleFactor;
            // Ajustar X e Y para centrar el dibujo expandido
            const drawX = faceBox.x - (drawW - faceBox.width) / 2;
            const drawY = faceBox.y - (drawH - faceBox.height) / 2; // Ajuste vertical a ojo

            ctx.save(); // Guardar estado actual

            // 2. Dibujar la imagen normal
            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            // 3. Aplicar TINTE de color (Feedback Visual)
            // 'source-in' mantiene el dibujo solo donde ya hay píxeles (la imagen)
            // 'source-atop' dibuja el color encima de la imagen existente
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = feedbackColor;
            ctx.globalAlpha = 0.4; // 40% de opacidad del color
            ctx.fillRect(drawX, drawY, drawW, drawH);

            ctx.restore(); // Restaurar para que el texto no se afecte
          } else {
            // Fallback si la imagen falla: dibujar cuadro
            ctx.strokeStyle = feedbackColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
          }
        }

        // TEXTO
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = feedbackColor;
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2;
        ctx.strokeText(feedbackMessage, displaySize.width / 2, 50);
        ctx.fillText(feedbackMessage, displaySize.width / 2, 50);
        ctx.shadowBlur = 0;
      }
    }, 100);
  };

  // 6. GRABACIÓN
  useEffect(() => {
    if (!stream || typeof MediaRecorder === "undefined") return;
    let chunks: Blob[] = [];
    const mimeType =
      ["video/webm; codecs=vp9", "video/webm", "video/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type)
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
    const formData = new FormData();

    const blobType = data.type || "";
    const ext = blobType.startsWith("video/mp4") ? "mp4" : "webm";
    const filename = `video_${idUser}.${ext}`;
    formData.append("video_data", data, filename);

    let videoPath = "";

    const savingStart = performance.now();
    await axios
      .post(URLS.saveVideo, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
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
        navigator.userAgent
      );
    const deviceType = isMobile ? "MOBILE" : "DESKTOP";

    const detectStart = performance.now();
    await axios
      .post(`${URLS.pruebaVida}?path=${videoPath}&device=${deviceType}`)
      .then((res) => {
        console.log(res.data);

        const preview: string = res.data.photo;

        const data: PruebaVida = {
          movimiento: res.data.movimientoDetectado,
          videoHash: videoPath,
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
            res.data.movimientoDetectado == "!OK"
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
      URLS.logs,
      {
        message: `el guardado del video ha tardado ${savingTime} ms | la deteccion ha tardado ${detectTime}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };

  // 7. RENDER
  return (
    <div className="my-2">
      {showAdvice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 200,
            padding: 16,
          }}
          onClick={() =>{setShowAdvice(false) ; setEnableButton(true);}}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(17,17,17,0.95)",
              color: "#fff",
              padding: "20px 24px",
              borderRadius: 12,
              maxWidth: 420,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Se habilitara el boton para la captura del selfie, debido a que no detectamos que su rostro este alineado con el indicador.
            </p>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => {setShowAdvice(false) ; setEnableButton(true);}}
                style={{
                  marginTop: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#fff",
                  color: "#111",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading ? (
        <div style={styles.mainContainer}>
          {!isRecording ? (
            <div style={styles.statusIndicator}>{message}</div>
          ) : (
            <div style={styles.statusIndicator}>Mantengase quieto.</div>
          )}

          {isModelLoaded && (
            <div style={styles.loadingOverlay}>Cargando IA...</div>
          )}

          <div
            style={{
              ...styles.videoWrapper,
              width: videoDimensions.width || "100%",
              // height: videoDimensions.height || '100%',
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
            <canvas ref={canvasRef} style={styles.fullSizeAbsolute} />/
            {/* REFERENCIA ESTÁTICA CENTRAL (SEMI-TRANSPARENTE) */}
            <img
              ref={maskImgRef}
              src={faceTemplate}
              alt="Guía"
              className="mask-detection"
              // style={styles.maskImage}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center">
          <span>{sendingMessages[currentMessageIndex]}</span>
          <Spinner color="primary" />
        </div>
      )}

      {enableButton && (
        <div className="w-full flex justify-center items-center">
            <button onClick={() => setIsCenteredAndOk(true)} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
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
    top: 20,
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
