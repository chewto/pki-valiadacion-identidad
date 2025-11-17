import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import faceTemplate from "/face_template_OK.png";
import "@styles/selfie.css";
import axios from "axios";
import { URLS } from "@nucleo/api-urls/urls";
import { PruebaVida } from "@nucleo/interfaces/validacion-identidad/informacion-identidad.interface";

// --- Interfaces de Soporte ---
interface ImageDrawing {
  img: HTMLImageElement | null;
  isLoaded: boolean;
}

interface Styles {
  [key: string]: React.CSSProperties;
}

// --- CONSTANTES DE CONFIGURACIÓN ---
const MODEL_URL = "/models";
const DRAWING_IMG_URL = "/face_template_OK.png";
const IDEAL_MIN_WIDTH = 120;
const IDEAL_MAX_WIDTH = 240;
const CENTER_TOLERANCE_PX = 40;
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
// NUEVA CONSTANTE: Umbral de Brillo (0=Negro, 255=Blanco).
// Un valor por debajo de 50-60 suele ser muy oscuro.
const BRIGHTNESS_THRESHOLD = 50;

const FaceDetection: React.FC = () => {
  // 1. REFS Y ESTADOS
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const drawingImageRef = useRef<ImageDrawing>({ img: null, isLoaded: false });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCenteredAndOk, setIsCenteredAndOk] = useState<boolean>(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);

  const [img, setImg] = useState<string>('')

  const [timer, setTimer] = useState<number>(4);
  // 2. FUNCIÓN PRINCIPAL DE EFECTO (sin cambios)
  useEffect(() => {
    const loadModelsAndImage = async () => {
      setIsLoading(true);

      try {
        console.log("Cargando modelos...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Modelos cargados exitosamente.");

        const img = new Image();
        img.src = DRAWING_IMG_URL;
        img.onload = () => {
          drawingImageRef.current = { img: img, isLoaded: true };
          console.log("Imagen de dibujo flotante cargada.");
          startVideo();
        };
        img.onerror = (e) => {
          console.error("Error al cargar la imagen de dibujo flotante.", e);
          drawingImageRef.current = { img: null, isLoaded: false };
          startVideo();
        };
      } catch (error) {
        console.error("Error al cargar modelos o imagen:", error);
        setIsLoading(false);
      }
    };

    loadModelsAndImage();

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if(isCenteredAndOk){
        recordVideo()
    }
  }, [isCenteredAndOk]);

  // 3. INICIAR LA CÁMARA (sin cambios)
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } })
      .then((stream: MediaStream) => {
        setStream(stream)
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.addEventListener("playing", handleVideoPlay);
        }
      })
      .catch((err) => console.error("Error al acceder a la cámara:", err));
  };

  // 4. MANEJAR LA DETECCIÓN (¡LÓGICA DE BRILLO AÑADIDA!)
  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    const FIXED_CENTER_X = canvas.width / 2;
    const FIXED_CENTER_Y = canvas.height / 2;

    setIsLoading(false);

    detectionInterval.current = setInterval(async () => {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const context = canvas.getContext("2d");

      if (context) {
        // --- CÁLCULO DE BRILLO (NUEVO) ---
        let avgBrightness = 255; // Asumir brillo por defecto si no hay cara

        // 1. Dibuja el video en el canvas (temporalmente) para leer los píxeles
        context.drawImage(video, 0, 0, displaySize.width, displaySize.height);

        if (resizedDetections.length > 0) {
          const box = resizedDetections[0].box;

          // 2. Extrae los datos de píxeles SÓLO del recuadro del rostro
          // (Asegurándonos de no salirnos del borde del canvas)
          const x = Math.max(box.x, 0);
          const y = Math.max(box.y, 0);
          const w = Math.min(box.width, canvas.width - x);
          const h = Math.min(box.height, canvas.height - y);

          if (w > 0 && h > 0) {
            const imageData = context.getImageData(x, y, w, h);
            const data = imageData.data;
            let sum = 0;
            let count = 0;
            const skip = 4; // Muestrear 1 de cada 4 píxeles (para rendimiento)

            for (let i = 0; i < data.length; i += 4 * skip) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              // Fórmula de Luminancia (Brillo percibido)
              sum += 0.299 * r + 0.587 * g + 0.114 * b;
              count++;
            }
            avgBrightness = count > 0 ? sum / count : 255;
          }
        }

        // 3. Limpia el canvas para que vuelva a ser transparente
        context.clearRect(0, 0, canvas.width, canvas.height);

        // --- FIN CÁLCULO DE BRILLO ---

        // --- LÓGICA DE FEEDBACK (ACTUALIZADA) ---
        let feedbackMessage = "🟡 Esperando detección de rostro...";
        let feedbackColor = "yellow";


        if (resizedDetections.length > 0) {
          const detection = resizedDetections[0];
          const box = detection.box;
          const faceWidth = box.width;

          // --- Comprobaciones en orden de prioridad ---
          if (avgBrightness < BRIGHTNESS_THRESHOLD) {
            feedbackMessage = "🌑 ¡Muy Oscuro! Busca más luz.";
            feedbackColor = "gray"; // Un color tenue
          } else {
            const isWidthOk =
              faceWidth >= IDEAL_MIN_WIDTH && faceWidth <= IDEAL_MAX_WIDTH;
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const isCenteredX =
              Math.abs(faceCenterX - FIXED_CENTER_X) < CENTER_TOLERANCE_PX;
            const isCenteredY =
              Math.abs(faceCenterY - FIXED_CENTER_Y) < CENTER_TOLERANCE_PX;
            const isPositionOk = isCenteredX && isCenteredY;

            if (isWidthOk && isPositionOk) {
              feedbackMessage = "🟢 ¡Perfecto! Rostro centrado.";
              feedbackColor = "green";
                setIsCenteredAndOk(true);
            } else if (isWidthOk && !isPositionOk) {
              feedbackMessage = "🟠 Centra tu rostro en el marco.";
              feedbackColor = "orange";
            } else if (faceWidth < IDEAL_MIN_WIDTH) {
              feedbackMessage = "🔴 ¡Demasiado Lejos! Acércate.";
              feedbackColor = "red";
            } else {
              feedbackMessage = "🔴 ¡Demasiado Cerca! Aléjate.";
              feedbackColor = "red";
            }
          }

          // Dibujar Borde de Feedback (FLOTANTE)
          context.strokeStyle = feedbackColor;
          context.lineWidth = 4;
          context.strokeRect(box.x, box.y, box.width, box.height);

          // Dibujar la Imagen FLOTANTE
          if (drawingImageRef.current.isLoaded && drawingImageRef.current.img) {
            const drawingImg = drawingImageRef.current.img;
            const scale = 1.2;
            const drawWidth = box.width * scale;
            const drawHeight = box.height * scale;
            const drawX = box.x - (drawWidth - box.width) / 2;
            const drawY = box.y - (drawHeight - box.height) / 2;
            context.drawImage(drawingImg, drawX, drawY, drawWidth, drawHeight);
          } else {
            faceapi.draw.drawDetections(canvas, resizedDetections);
          }
        }

        // Dibujar el Texto de Retroalimentación
        context.font = "bold 24px Arial";
        context.fillStyle = feedbackColor;
        context.textAlign = "center";
        context.fillText(feedbackMessage, canvas.width / 2, 30);
      }
    }, 100);
  };

  useEffect(() => {
    console.log(stream)
    if (!stream) return;
    if (typeof MediaRecorder === "undefined") {
      return;
    }

    let chunks: Blob[] = [];

    // Detect Safari (iOS) vs otros
    const ua = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    // Priorizar tipos compatibles con Safari y otros
    const candidateTypes = isSafari
      ? [
          "video/mp4; codecs=avc1.42E01E",
          "video/mp4",
          "video/webm; codecs=vp9",
          "video/webm; codecs=vp8",
          "video/webm",
        ]
      : [
          "video/webm; codecs=vp9",
          "video/webm; codecs=vp8",
          "video/webm",
          "video/mp4; codecs=avc1.42E01E",
          "video/mp4",
        ];
    const mimeType =
      candidateTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (e) {
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blobType = mimeType || "application/octet-stream";
      const videoBlob = new Blob(chunks, { type: blobType });
      // const videoURL = URL.createObjectURL(videoBlob);

      if (videoRef.current) {
        // videoRef.current.srcObject = null;
        // videoRef.current.src = videoURL;
        videoRef.current.controls = false;
        videoRef.current.classList.remove("live-stream");
        videoRef.current.play().catch((e) => console.log(e));
      }

      saveMedia(videoBlob);

      setIsRecording(false);

      chunks = [];
    };

    setMediaRecorder(recorder);
    // eslint-disable-next-line
  }, [stream]);

  const saveMedia = async (data: Blob) => {
    // setLoading(true);
    const formData = new FormData();

    const blobType = data.type || "";
    const ext = blobType.startsWith("video/mp4") ? "mp4" : "webm";
    const filename = `video_.${ext}`;
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

        //   if (counter < tries - 1) {
        //     setMessages((prevMessages) => [
        //     ...prevMessages,
        //     ...res.data.messages,
        //     ]);
        //   }
        //   if (counter == tries) {
        //     setMessages([]);
        //   }

        // if (res.status == 200) {
        //   if (
        //     !res.data.photoResult.isReal ||
        //     res.data.movimientoDetectado == "!OK"
        //   ) {
        //     setCounter((state) => state + 1);
        //     // setTriesCounter((state) => state - 1)
        //   }

        //   if (preview.length >= 1) {
        //     dispatch(setFotos({ labelFoto: label, data: preview }));
        //     dispatch(setIdCarpetas(data));
        //   }
        //   if (preview.length >= 1 && res.data.messages.length <= 0) {
        //     // setContinuarBoton(true);
        //     setSuccess(true);
        //     setMessages([]);
        //   }
        // }

        // if (res.status == 201) {
        //   setIsCorrupted(true);
        // }
      })
      .finally(() => {
        // setMostrarPreview(true);
        // setCapturarOtraVez(true);
        // setLoading(false);
      })
      .catch((e) => {
        console.error(e)
        // setError(true);
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

  const recordVideo = () => {

        console.log('grabando')
      if (!mediaRecorder) return;
      setIsRecording(true);
      mediaRecorder.start();
      setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          if (videoRef.current) {
          const stream = videoRef.current.srcObject as MediaStream;
          const tracks = stream.getTracks();
          tracks.forEach((track) => {
              track.stop();
          });
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

  // 5. RENDERIZAR (sin cambios)
  return (
    <div
      style={{ ...styles.container, width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}
    >
      <div style={styles.booleanIndicator}>
        {isCenteredAndOk ? "TRUE" : "FALSE"}
      </div>

      {isLoading && (
        <div style={styles.loadingBox}>
          Cargando modelos de IA y recursos...
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        style={styles.video}
      />

      <img
        src={faceTemplate}
        alt="Marco de referencia"
        className="mask"
        style={styles.mask}
      />

      <canvas ref={canvasRef} style={styles.overlay} />

      <div>
        <img src={img} alt="" />
      </div>
    </div>
  );
};

// --- Estilos CSS (sin cambios) ---
const styles: Styles = {
  container: { position: "relative" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  mask: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 5,
  },
  booleanIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: "5px 10px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "white",
    fontSize: "1.5em",
    fontWeight: "bold",
    zIndex: 20,
  },
  loadingBox: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "white",
    fontSize: "1.2em",
    zIndex: 10,
  },
};

export default FaceDetection;
