import type { ValidationProgressPayload } from "@nucleo/services/validation-progress.service";

/** Coordenadas capturadas por la API nativa de geolocalización del navegador. */
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Respuesta del endpoint de configuración del documento.
 * TODO: endpoint placeholder pendiente de definir por backend (validation/document-config).
 */
export interface DocumentConfigResponse {
  /** La firma exige capturar y enviar la ubicación del firmante. */
  require_location_validation: boolean;
  /** Política anti-VPN: true = la validación se bloquea si se detecta VPN/proxy. */
  block_on_vpn: boolean;
  /** Radio permitido (metros) entre la ubicación declarada y la real. */
  location_radius_meters?: number;
}

/** Códigos de error estándar de la API de firma. */
export enum ApiErrorCode {
  VPN_DETECTED = "VPN_DETECTED",
  PROXY_DETECTED = "PROXY_DETECTED",
  LOCATION_REQUIRED = "LOCATION_REQUIRED",
  LOCATION_MISMATCH = "LOCATION_MISMATCH",
  LOCATION_UNAVAILABLE = "LOCATION_UNAVAILABLE",
  UNKNOWN = "UNKNOWN",
}

/** Shape estándar del body de error de la API. */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

/** Error de API ya normalizado para que lo consuma la UI. */
export interface NormalizedApiError {
  code: ApiErrorCode;
  message: string;
  status: number;
}

/**
 * Payload de la petición de firma: el progreso de validación completo
 * más el objeto `location` cuando la config lo exige.
 */
export type SignaturePayload = Omit<ValidationProgressPayload, "paso"> & {
  paso?: number;
  location?: LocationCoords;
};

/** Variantes de bloqueo que puede mostrar la UI. */
export type BlockingAlertType =
  | "vpn"
  | "proxy"
  | "permission"
  | "timeout"
  | "unavailable"
  | "mismatch"
  | "location_required"
  | "unknown";
