import axios from "axios";
import {
  ApiErrorBody,
  ApiErrorCode,
  NormalizedApiError,
} from "@nucleo/interfaces/firma/location.interface";

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.VPN_DETECTED]:
    "Detectamos que estás usando una VPN o proxy. Desactíalo para continuar con la firma.",
  [ApiErrorCode.PROXY_DETECTED]:
    "Detectamos el uso de un proxy. Desactíalo para continuar con la firma.",
  [ApiErrorCode.LOCATION_REQUIRED]:
    "La validación requiere tu ubicación. Permite el acceso cuando el navegador lo solicite e inténtalo de nuevo.",
  [ApiErrorCode.LOCATION_MISMATCH]:
    "Tu ubicación no coincide con la región permitida para esta firma. Desactiva tu VPN o verifica tu ubicación.",
  [ApiErrorCode.LOCATION_UNAVAILABLE]:
    "No pudimos verificar tu ubicación. Activa el GPS e inténtalo de nuevo.",
  [ApiErrorCode.UNKNOWN]:
    "No pudimos procesar la solicitud. Intenta nuevamente.",
};

const KNOWN_CODES = new Set<string>(
  Object.values(ApiErrorCode) as string[]
);

/** Fallback por status cuando el backend no envía `code` en el body. */
const codeFromStatus = (status: number): ApiErrorCode => {
  if (status === 400) return ApiErrorCode.LOCATION_REQUIRED;
  if (status === 403) return ApiErrorCode.VPN_DETECTED;
  return ApiErrorCode.UNKNOWN;
};

interface RawApiErrorBody extends Partial<ApiErrorBody> {
  code?: string;
  message?: string;
}

/**
 * Normaliza cualquier error de la API REST a un NormalizedApiError.
 * Contrato estándar: HTTP 4xx/5xx con body { error: { code, message } }.
 * Acepta también { code, message } plano como tolerancia de contrato.
 */
export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (!axios.isAxiosError(error) || !error.response) {
    return {
      code: ApiErrorCode.UNKNOWN,
      message: DEFAULT_MESSAGES[ApiErrorCode.UNKNOWN],
      status: 0,
    };
  }

  const status = error.response.status;
  const data = error.response.data as RawApiErrorBody | undefined;

  const rawCode = data?.error?.code ?? data?.code;
  const code =
    rawCode && KNOWN_CODES.has(rawCode)
      ? (rawCode as ApiErrorCode)
      : codeFromStatus(status);

  const message = data?.error?.message ?? data?.message ?? DEFAULT_MESSAGES[code];

  return { code, message, status };
};

export const getDefaultApiMessage = (code: ApiErrorCode): string =>
  DEFAULT_MESSAGES[code];
