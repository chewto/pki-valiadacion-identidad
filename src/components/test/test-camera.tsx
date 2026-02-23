import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { URLS } from '@nucleo/api-urls/urls';

interface TestCameraProps {
  totalTime: number;
  framesResults: any[];
}

const TestCamera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Guardamos el stream para acceder a él
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [res, setRes] = useState<TestCameraProps>([]);
  const [intervalo, setIntervalo] = useState<number>(500);
  const [tipoDocumento, setTipoDocumento] = useState<string>('CEDULA_CIUDADANIA');
  const [ladoDocumento, setLadoDocumento] = useState<string>('FRONTAL');

  useEffect(() => {
    if (videoPath) {
      console.log('Video guardado en:', videoPath);
      axios.post(`${URLS.documentTest}?path=${videoPath}&intervalo=${intervalo}&documentType=${tipoDocumento}&documentSide=${ladoDocumento}`)
        .then(res => setRes(res.data))
        .catch(error => {
          console.error('Error al obtener datos del video:', error);
        });
    }
  }, [videoPath]);

  useEffect(() => {
    if (res) {
      console.log('Respuesta del servidor:', res);
    }}, [res]);

  // 1. Inicializar la cámara para el preview
  useEffect(() => {
    const initCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: { ideal: window.innerWidth < 768 ? "environment" : "user" }
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error al acceder a la cámara:', err);
      }
    };

    initCamera();

    return () => {
      // Limpieza al desmontar el componente
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 2. Función para grabar y enviar
  const handleCapture = () => {
    setRes([])

    if (!streamRef.current) return;

    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', videoBlob, 'grabacion.webm');

      try {
        setIsUploading(true);
        const response = await axios.post(`${URLS.saveVideo}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setVideoPath(response.data.ruta);
      } catch (error) {
        console.error('Error al subir:', error);
      } finally {
        setIsUploading(false);
        setIsRecording(false);
      }
    };

    // Iniciar ciclo de 3 segundos
    setIsRecording(true);
    recorder.start();
    
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, 3000);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ marginBottom: '15px', position: 'relative', display: 'inline-block' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', maxWidth: 400, borderRadius: '12px', background: '#000' }} 
        />
        {isRecording && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'red', fontWeight: 'bold' }}>
            ● GRABANDO
          </div>
        )}
      </div>

      <br />

      <select name="tipoDocumento" id="tipoDocumento" onChange={(e) => setTipoDocumento(e.target.value)}>
        <option value="CEDULA_CIUDADANIA">Cedula de ciudadania</option>
        <option value="CEDULA_EXTRANJERIA">Cedula de extranjeria</option>
        <option value="CEDULA_DIGITAL">Cedula digital</option>
      </select>
      <select name="ladoDocumento" id="ladoDocumento" onChange={(e) => setLadoDocumento(e.target.value)}>
        <option value="FRONTAL">Frontal</option>
        <option value="REVERSO">Reverso</option>
      </select>
      <select name="intervalo" id="intervalo" onChange={(e) => setIntervalo(Number(e.target.value))}>
        <option value="250">Intervalo 250ms</option>
        <option value="500">Intervalo 500ms</option>
        <option value="1000">Intervalo 1s</option>
        <option value="2000">Intervalo 2s</option>
      </select>
      <br />
      <button
        onClick={handleCapture}
        disabled={isRecording || isUploading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isRecording ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: (isRecording || isUploading) ? 'not-allowed' : 'pointer'
        }}
      >
        {isRecording ? 'Grabando (3s)...' : isUploading ? 'Subiendo...' : 'Grabar y Enviar'}
      </button>
      <div>
        {res.framesResults && (
          <>
          {res.framesResults.map((frame: any, index: number) => (
            <div key={index} style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <p><strong>{frame.frame}:</strong></p> </div>
          ))}</>
        )}
      </div>
    </div>
  );
};

export default TestCamera;