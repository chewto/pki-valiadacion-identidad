import { useCallback, useEffect, useRef, useState } from "react";

export type GeolocationStatus = "idle" | "loading" | "success" | "error";

/** Códigos de error de la geolocalización (espejo de GeolocationPositionError). */
export enum GeolocationErrorCode {
  PERMISSION_DENIED = "PERMISSION_DENIED",
  POSITION_UNAVAILABLE = "POSITION_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
  UNSUPPORTED = "UNSUPPORTED",
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationError {
  code: GeolocationErrorCode;
  message: string;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  /** Obtiene la posición automáticamente al montar el hook (default: false). */
  autoStart?: boolean;
}

interface UseGeolocationResult {
  status: GeolocationStatus;
  coordinates: GeoCoordinates | null;
  error: GeolocationError | null;
  supported: boolean;
  /** Estilo callback: nunca lanza; notifica éxito/error. */
  getLocation: (
    onSuccess?: (coordinates: GeoCoordinates) => void,
    onError?: (error: GeolocationError) => void
  ) => void;
  /** Estilo promesa: rechaza con GeolocationError. */
  getLocationPromise: () => Promise<GeoCoordinates>;
  reset: () => void;
}

const DEFAULT_OPTIONS: Required<
  Pick<UseGeolocationOptions, "enableHighAccuracy" | "timeout" | "maximumAge">
> = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

const ERROR_MESSAGES: Record<GeolocationErrorCode, string> = {
  [GeolocationErrorCode.PERMISSION_DENIED]:
    "Permiso de ubicación denegado. Permite el acceso a tu ubicación en el navegador para continuar con la firma.",
  [GeolocationErrorCode.POSITION_UNAVAILABLE]:
    "No se pudo determinar tu ubicación. Verifica que tu GPS esté activo e inténtalo de nuevo.",
  [GeolocationErrorCode.TIMEOUT]:
    "Se agotó el tiempo de espera para obtener tu ubicación. Activa el GPS e inténtalo de nuevo.",
  [GeolocationErrorCode.UNSUPPORTED]:
    "Tu navegador no soporta la geolocalización.",
};

const mapNativeError = (code: number): GeolocationError => {
  switch (code) {
    case 1:
      return {
        code: GeolocationErrorCode.PERMISSION_DENIED,
        message: ERROR_MESSAGES[GeolocationErrorCode.PERMISSION_DENIED],
      };
    case 2:
      return {
        code: GeolocationErrorCode.POSITION_UNAVAILABLE,
        message: ERROR_MESSAGES[GeolocationErrorCode.POSITION_UNAVAILABLE],
      };
    case 3:
      return {
        code: GeolocationErrorCode.TIMEOUT,
        message: ERROR_MESSAGES[GeolocationErrorCode.TIMEOUT],
      };
    default:
      return {
        code: GeolocationErrorCode.POSITION_UNAVAILABLE,
        message: ERROR_MESSAGES[GeolocationErrorCode.POSITION_UNAVAILABLE],
      };
  }
};

/**
 * Captura la geolocalización del navegador con alta precisión.
 * - Limpia callbacks al desmontar (sin setState tras unmount).
 * - Cancela la petición en curso con AbortSignal cuando el navegador lo soporta.
 * - Expone API en promesa y en callback, con estados tipados y errores nativos mapeados.
 */
export const useGeolocation = (
  options: UseGeolocationOptions = {}
): UseGeolocationResult => {
  const {
    enableHighAccuracy = DEFAULT_OPTIONS.enableHighAccuracy,
    timeout = DEFAULT_OPTIONS.timeout,
    maximumAge = DEFAULT_OPTIONS.maximumAge,
    autoStart = false,
  } = options;

  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);

  const isMountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef({ enableHighAccuracy, timeout, maximumAge });
  optionsRef.current = { enableHighAccuracy, timeout, maximumAge };

  const supported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // Limpieza al desmontar: evita setState fuera de ciclo de vida y aborta la petición.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const getLocationPromise = useCallback((): Promise<GeoCoordinates> => {
    if (!supported) {
      const unsupportedError: GeolocationError = {
        code: GeolocationErrorCode.UNSUPPORTED,
        message: ERROR_MESSAGES[GeolocationErrorCode.UNSUPPORTED],
      };
      setStatus("error");
      setError(unsupportedError);
      return Promise.reject(unsupportedError);
    }

    setStatus("loading");
    setError(null);
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    return new Promise<GeoCoordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          abortRef.current = null;
          const nextCoordinates: GeoCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy:
              typeof position.coords.accuracy === "number"
                ? position.coords.accuracy
                : 0,
          };
          if (isMountedRef.current && !controller.signal.aborted) {
            setCoordinates(nextCoordinates);
            setStatus("success");
            setError(null);
          }
          resolve(nextCoordinates);
        },
        (positionError) => {
          abortRef.current = null;
          const geoError = mapNativeError(positionError.code);
          if (isMountedRef.current && !controller.signal.aborted) {
            setStatus("error");
            setError(geoError);
          }
          reject(geoError);
        },
        {
          enableHighAccuracy: optionsRef.current.enableHighAccuracy,
          timeout: optionsRef.current.timeout,
          maximumAge: optionsRef.current.maximumAge,
          signal: controller.signal,
        } as PositionOptions & { signal?: AbortSignal }
      );
    });
  }, [supported]);

  const getLocation = useCallback(
    (
      onSuccess?: (coordinates: GeoCoordinates) => void,
      onError?: (error: GeolocationError) => void
    ) => {
      getLocationPromise()
        .then((coords) => onSuccess?.(coords))
        .catch((err: GeolocationError) => onError?.(err));
    },
    [getLocationPromise]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setCoordinates(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    getLocationPromise().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return {
    status,
    coordinates,
    error,
    supported,
    getLocation,
    getLocationPromise,
    reset,
  };
};
