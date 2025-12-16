import { URLS } from '@nucleo/api-urls/urls';
import { useState, useCallback } from 'react';

interface SpeedMetrics {
  downloadMbps: number;
  uploadMbps: number;
  ping: number;
}

export const useSpeedTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpeedMetrics | null>(null);

  const measurePing = async (url: string): Promise<number> => {
    const start = performance.now();
    // Usamos HEAD para que sea una petición ultra ligera
    await fetch(`${url}?t=${Math.random()}`, { method: 'HEAD', cache: 'no-cache' });
    const end = performance.now();
    return Math.round(end - start);
  };

  // --- MEDICIÓN DE DESCARGA ---
  const measureDownload = async (url: string, sizeBytes: number): Promise<number> => {
    const startTime = performance.now();
    const response = await fetch(`${url}?cache=${Math.random()}`);
    await response.blob();
    const endTime = performance.now();
    
    const durationInSeconds = (endTime - startTime) / 1000;
    return (sizeBytes * 8 / durationInSeconds) / 1_000_000;
  };

  // --- MEDICIÓN DE SUBIDA ---
  const measureUpload = async (endpoint: string, sizeMb: number): Promise<number> => {

    const bytes = sizeMb * 1024 * 1024;
  // Creamos un buffer vacío (lleno de ceros) - Es instantáneo
  const data = new Uint8Array(bytes); 
  
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const startTime = performance.now();

    await fetch(endpoint, {
      method: 'POST',
      body: blob,
      // Importante: No enviar caché y manejar cabeceras según tu servidor
    });
    const endTime = performance.now();

    const durationInSeconds = (endTime - startTime) / 1000;
    return (bytes * 8 / durationInSeconds) / 1_000_000;
  };

  const runFullTest = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Descarga (Asumiendo un archivo de 1MB)
      const down = await measureDownload('https://upload.wikimedia.org/wikipedia/commons/1/16/AsterNovi-belgii-flower-1mb.jpg', 1048576);
      
      const ping = await measurePing(URLS.ping);
      // 2. Subida (Subiendo 1MB de basura al servidor)
      const up = await measureUpload(URLS.ping, 1);

      setResults({ downloadMbps: Number(down.toFixed(2)), uploadMbps: Number(up.toFixed(2)), ping: ping  });
    } catch (err) {
      console.error("Error en el test:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { runFullTest, loading, results };
};