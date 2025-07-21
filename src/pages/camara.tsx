import { URLS } from "@nucleo/api-urls/validacion-identidad-urls";
import { useEffect, useRef, useState } from "react";

const Camara: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const selfieImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showSelfie, setShowSelfie] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const constraints = { video: { facingMode: "user" }, audio: true };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStatus(null);
      } catch (err: any) {
        setStatus({
          message: `Error: ${err.name}. Asegúrate de permitir el acceso a la cámara y micrófono.`,
          type: "error",
        });
      }
    };
    initCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!stream) return;
    if (typeof MediaRecorder === "undefined") {
      setStatus({ message: "Grabación no soportada", type: "error" });
      return;
    }

    // Local array to accumulate data
    let chunks: Blob[] = [];

    // Determine supported mimeType
    const candidateTypes = [
      "video/webm; codecs=vp9",
      "video/webm; codecs=vp8",
      "video/webm"
    ];
    const mimeType = candidateTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blobType = mimeType || "application/octet-stream";
      const videoBlob = new Blob(chunks, { type: blobType });
      const videoURL = URL.createObjectURL(videoBlob);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = videoURL;
        videoRef.current.controls = true;
        videoRef.current.classList.remove("live-stream");
        videoRef.current.play().catch(() =>
          setStatus({
            message:
              "Este navegador no soporta la reproducción del video grabado. Puedes descargarlo desde el servidor.",
            type: "error",
          })
        );
      }

      // Enviar al servidor
      saveMedia(videoBlob);

      // Actualizar UI
      setShowVideoControls(true);
      setShowReset(true);
      setIsRecording(false);

      // Reset local chunks
      chunks = [];
    };

    setMediaRecorder(recorder);
    // eslint-disable-next-line
  }, [stream]);

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/png");

    if (selfieImgRef.current) {
      selfieImgRef.current.src = imageDataUrl;
    }
    setShowSelfie(true);
    setShowVideoControls(true);
    setShowReset(true);
    saveMedia(imageDataUrl);
  };

  const recordVideo = () => {
    if (!mediaRecorder) return;
    setIsRecording(true);
    setShowVideoControls(true);
    setShowSelfie(false);
    setStatus({ message: "Grabando durante 4 segundos...", type: "info" });
    mediaRecorder.start();
    setTimeout(() => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    }, 4000);
  };

  const saveMedia = async (data: Blob | string) => {
    const formData = new FormData();
    const endpoint = URLS.saveVideo;
    if (data instanceof Blob) {
      formData.append("video_data", data, "my_video.webm");
    } else {
      formData.append("image_data", data);
    }
    setStatus({ message: "Subiendo al servidor...", type: "info" });
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);
      const result = await response.json();
      setStatus({ message: result.message, type: result.success ? "success" : "error" });
    } catch (error: any) {
      setStatus({ message: `Error de conexión: ${error.message}`, type: "error" });
    }
  };

  const resetToLiveView = () => {
    setShowSelfie(false);
    setShowVideoControls(false);
    setShowReset(false);
    setStatus(null);
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.controls = false;
      videoRef.current.classList.add("live-stream");
    }
  };

  return (
    <div className="container" style={{
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      maxWidth: 500,
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#f4f4f9",
      padding: 20,
      boxSizing: "border-box"
    }}>
      <h1>Selfie o Video de 4 seg. 🤳</h1>
      <div id="media-container" style={{
        border: "5px solid #555",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
        position: "relative",
        width: "100%",
        backgroundColor: "#000"
      }}>
        <video
          ref={videoRef}
          className="live-stream"
          autoPlay
          playsInline
          style={{
            display: showSelfie ? "none" : "block",
            width: "100%",
            height: "auto",
            transform: !showSelfie ? "scaleX(-1)" : undefined
          }}
        />
        <img
          ref={selfieImgRef}
          alt="Tu Selfie"
          style={{
            display: showSelfie ? "block" : "none",
            width: "100%",
            height: "auto",
            transform: "scaleX(-1)"
          }}
        />
      </div>
      <div id="action-buttons" style={{ marginTop: 16 }}>
        <button
          id="selfie-btn"
          style={{
            padding: "12px 24px",
            fontSize: 16,
            cursor: "pointer",
            border: "none",
            borderRadius: 8,
            margin: "10px 5px",
            fontWeight: "bold",
            backgroundColor: "#007bff",
            color: "white",
            display: showVideoControls ? "none" : "inline-block"
          }}
          onClick={takeSelfie}
          disabled={!stream || isRecording}
        >
          Tomar Foto
        </button>
        <button
          id="video-btn"
          style={{
            padding: "12px 24px",
            fontSize: 16,
            cursor: "pointer",
            border: "none",
            borderRadius: 8,
            margin: "10px 5px",
            fontWeight: "bold",
            backgroundColor: "#dc3545",
            color: "white",
            display: showVideoControls ? "none" : "inline-block"
          }}
          onClick={recordVideo}
          disabled={!stream || isRecording || !mediaRecorder}
        >
          Grabar Video (4s)
        </button>
        <button
          id="reset-btn"
          style={{
            padding: "12px 24px",
            fontSize: 16,
            cursor: "pointer",
            border: "none",
            borderRadius: 8,
            margin: "10px 5px",
            fontWeight: "bold",
            backgroundColor: "#6c757d",
            color: "white",
            display: showReset ? "inline-block" : "none"
          }}
          onClick={resetToLiveView}
        >
          Reiniciar Cámara
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {status && (
        <div
          className={`message ${status.type}`}
          style={{
            marginTop: 15,
            padding: "12px 20px",
            borderRadius: 8,
            fontWeight: "bold",
            textAlign: "center",
            backgroundColor:
              status.type === "success"
                ? "#d4edda"
                : status.type === "error"
                ? "#f8d7da"
                : "#cce5ff",
            color:
              status.type === "success"
                ? "#155724"
                : status.type === "error"
                ? "#721c24"
                : "#004085",
            display: "block"
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
};

export default Camara;
