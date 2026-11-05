import { useCallback, useEffect, useRef, useState } from "react";
import { getValidationWsUrl } from "../api-urls/urls";
import { isValidationWsStep } from "../constants/ocr-progress";
import type {
  ValidationWsExtra,
  ValidationWsProgress,
  ValidationWsStatus,
} from "../interfaces/validacion-identidad/validation-ws.interface";

interface UseValidationWebSocketOptions {
  efirmaId: string | number | null | undefined;
  enabled?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeStatus = (value: unknown): ValidationWsStatus => {
  switch (value) {
    case "success":
    case "warning":
    case "error":
    case "processing":
      return value;
    default:
      return "processing";
  }
};

const normalizeExtra = (value: unknown): ValidationWsExtra | undefined => {
  if (!isRecord(value)) return undefined;

  const extra: ValidationWsExtra = {};

  if (typeof value.validSide === "boolean") extra.validSide = value.validSide;
  if (typeof value.valid === "boolean") extra.valid = value.valid;
  if (value.side === "anverso" || value.side === "reverso") {
    extra.side = value.side;
  }

  if (Array.isArray(value.messages)) {
    const messages = value.messages
      .filter((message): message is string => typeof message === "string")
      .map((message) => message.trim())
      .filter(Boolean);

    if (messages.length > 0) extra.messages = messages;
  }

  return Object.keys(extra).length > 0 ? extra : undefined;
};

/**
 * Valida el payload en el límite de red: cualquier evento malformado se
 * descarta sin afectar la petición HTTP en curso.
 */
const parseValidationProgress = (
  value: unknown
): ValidationWsProgress | null => {
  if (!isRecord(value)) return null;
  if (!isValidationWsStep(value.step)) return null;
  if (typeof value.message !== "string" || value.message.trim() === "") {
    return null;
  }

  const rawEfirmaId = value.efirma_id;
  const efirmaId =
    typeof rawEfirmaId === "string" || typeof rawEfirmaId === "number"
      ? String(rawEfirmaId)
      : "";

  return {
    efirma_id: efirmaId,
    step: value.step,
    message: value.message.trim(),
    status: normalizeStatus(value.status),
    timestamp:
      typeof value.timestamp === "number" && Number.isFinite(value.timestamp)
        ? value.timestamp
        : Date.now(),
    extra: normalizeExtra(value.extra),
  };
};

export const useValidationWebSocket = ({
  efirmaId,
  enabled = false,
}: UseValidationWebSocketOptions) => {
  const [progress, setProgress] = useState<ValidationWsProgress | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;

    if (socket) {
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      } catch (error) {
        console.warn("Error cerrando WebSocket:", error);
      }
    }

    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    disconnect();

    const wsUrl = getValidationWsUrl(efirmaId);
    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (socketRef.current !== ws) return;
        console.log("Conectado al canal de progreso OCR:", wsUrl);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (socketRef.current !== ws) return;

        try {
          const data = parseValidationProgress(JSON.parse(String(event.data)));
          if (!data) return;
          console.log("Progreso OCR recibido:", data.step, data.message);
          setProgress(data);
        } catch (error) {
          console.error(
            "Error al procesar mensaje de WebSocket:",
            error,
            event.data
          );
        }
      };

      ws.onerror = () => {
        console.warn(
          `[WS] No se pudo conectar al progreso OCR en ${wsUrl}. ` +
            "Se usará el progreso genérico."
        );
      };

      ws.onclose = (event) => {
        if (socketRef.current !== ws) return;
        socketRef.current = null;
        setIsConnected(false);

        if (!event.wasClean) {
          const reason = event.reason ? ` reason=${event.reason}` : "";
          console.warn(
            `[WS] Canal OCR cerrado (${wsUrl}) code=${event.code}${reason}`
          );
        }
      };
    } catch (error) {
      console.warn("No se pudo iniciar la conexión WebSocket:", error);
    }
  }, [efirmaId, disconnect]);

  useEffect(() => {
    if (!enabled) return;

    connect();
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  // Cierra también las conexiones abiertas de forma imperativa.
  useEffect(() => () => disconnect(), [disconnect]);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    progress,
    isConnected,
    connect,
    disconnect,
    resetProgress,
  };
};
