import { URLS } from '@nucleo/api-urls/urls';
import { useState, useCallback } from 'react';

interface Metric {
  mbps: number;
  seconds: number;
}

interface SpeedMetrics {
  downloadMbps: Metric;
  uploadMbps: Metric;
  ping: number;
}

export const useSpeedTest = () => {
  const [loadingSpeed, setLoadingSpeed] = useState(false);
  const [results, setResults] = useState<SpeedMetrics | null>(null);

  const measurePing = async (url: string): Promise<number> => {
    const start = performance.now();
    // Usamos HEAD para que sea una petición ultra ligera
    await fetch(`${url}?t=${Math.random()}`, { method: 'HEAD', cache: 'no-cache' });
    const end = performance.now();
    return Math.round(end - start);
  };

  // --- MEDICIÓN DE DESCARGA ---
  // const measureDownload = async (url: string, sizeBytes: number): Promise<number> => {
  //   const startTime = performance.now();
  //   const response = await fetch(`${url}?cache=${Math.random()}`);
  //   await response.blob();
  //   const endTime = performance.now();
    
  //   const durationInSeconds = (endTime - startTime) / 1000;
  //   return (sizeBytes * 8 / durationInSeconds) / 1_000_000;
  // };

  const measureDownload = async (url: string): Promise<{ down: number; secsDown: number }> => {
    // Cache Buster + Modo CORS explícito
    const fetchUrl = url + (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;

    const startTime = performance.now();
    let receivedLength = 0;

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors', // Solicitamos CORS explícitamente
        cache: 'no-store'
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      // Parse Content-Length safely (may be null)
      // const contentLength = Number(response.headers.get('Content-Length') ?? 0);

      if (response.body) {
        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) receivedLength += value.length;
        }
      } else {
        // Fallback if stream not available
        const blob = await response.blob();
        receivedLength = blob.size;
      }

      const endTime = performance.now();
      const durationSecs = (endTime - startTime) / 1000;
      const bits = receivedLength * 8;
      const mbps = (bits / 1024 / 1024) / Math.max(durationSecs, 1e-6);
      const roundedMbps = Number(mbps.toFixed(2));
      return { down: roundedMbps, secsDown: durationSecs };
    } catch (err: any) {
      console.log(`Error downloading: ${err?.message ?? err}`);
      return { down: 0, secsDown: 0 };
    }
  }

  // --- MEDICIÓN DE SUBIDA ---
  const measureUpload = async (endpoint: string, sizeMb: number): Promise<{ up: number; secsUp: number }> => {

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
    return { up: (bytes * 8 / durationInSeconds) / 1_000_000, secsUp: durationInSeconds };
  };

  const runFullTest = useCallback(async () => {
    setLoadingSpeed(true);
    try {
      // 1. Descarga (Asumiendo un archivo de 1MB)
      const { down, secsDown } = await measureDownload('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/build/pdf.worker.min.js');
      
      const ping = await measurePing(URLS.ping);
      // 2. Subida (Subiendo 1MB de basura al servidor)
      const {up, secsUp} = await measureUpload(URLS.ping, 1);

      setResults({ downloadMbps: { mbps: Number(down.toFixed(2)), seconds: secsDown }, uploadMbps: { mbps: Number(up.toFixed(2)), seconds: secsUp }, ping: ping  });
    } catch (err) {
      console.error("Error en el test:", err);
    } finally {
      setLoadingSpeed(false);
    }
  }, []);

  return { runFullTest, loadingSpeed, results };
};