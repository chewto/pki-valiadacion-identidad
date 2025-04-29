import { useRef, useEffect, useState } from "react";

const CameraCanvasComponent: React.FC = () => {
  const [streamActivo, setStreamActivo] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    iniciarCamara();

    return () => {
      // Limpieza del stream al desmontar el componente
      if (streamActivo) {
        streamActivo.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamActivo]);

  const iniciarCamara = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment", // Cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStreamActivo(stream);

      // Dibuja en el canvas
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      const canvas = canvasRef.current;
      
      if (!canvas) {
        console.error("Referencia del canvas no encontrada.");
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        console.error("Contexto 2D no disponible en el canvas.");
        return;
      }

      const dibujarFotograma = async () => {
        try {
          const bitmap = await imageCapture.grabFrame();
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(dibujarFotograma); 
        } catch (err) {
          console.error("Error al capturar fotograma:", err);
        }
      };

      dibujarFotograma();
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setError(`No se puede acceder a la cámara. error: ${err}`);
    }
  };

  return (
    <div>
      <h1>Prueba de Cámara con Canvas (TypeScript)</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{ border: "1px solid black" }}
      ></canvas>
      <button
        onClick={() => {
          if (streamActivo) {
            streamActivo.getTracks().forEach((track) => track.stop());
            setStreamActivo(null); // Limpia el estado del stream
          }
        }}
      >
        Detener Cámara
      </button>
    </div>
  );
};

export default CameraCanvasComponent;
