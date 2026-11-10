// import { getCountry } from '@nucleo/hooks/useCountry';

const URL = import.meta.env.VITE_BASE_URL;

// Mapa de URLs base de servicios externos por país (fe-back / fe-val-back)
// const countryServiceUrls: Record<string, { fe: string; saveVideo: string; pruebaVida: string; efirmaUrl: string }> = {
//   COL: {
//     fe: import.meta.env.VITE_FE_BASE_URL_CO,
//     saveVideo: import.meta.env.VITE_FE_BASE_URL_CO,
//     pruebaVida: import.meta.env.VITE_FE_BASE_URL_CO,
//     efirmaUrl: import.meta.env.VITE_FE_BASE_URL_CO,
//   },
//   HND: {
//     fe: import.meta.env.VITE_FE_BASE_URL_HN,
//     saveVideo: import.meta.env.VITE_FE_BASE_URL_HN,
//     pruebaVida: import.meta.env.VITE_FE_BASE_URL_HN,
//     efirmaUrl: import.meta.env.VITE_FE_BASE_URL_HN,
//   },
// };

// // Helper: selecciona las URLs correctas según el país (X-Fuente header)
// export const getCountryServiceUrls = () => {
//   const country = getCountry();
//   const config = countryServiceUrls[country] || countryServiceUrls['COL'];
//   return {
//     // fe: `${config.fe}/fe-back/api/Firmador`,
//     saveVideo: `${config.saveVideo}/fe-val-back/api/Video`,
//     pruebaVida: `${config.pruebaVida}/validacion-back/anti-spoof`,
//     efirmaUrl: `${config.efirmaUrl}/efirma.php/`,
//   };
// };

// const countryUrls = getCountryServiceUrls();

// URLs del back centralizado (mismo dominio para todos los países)
const urlBase = `${URL}/python`;
const rejected = `${URL}/resultado_validacion_fallida`;
const livenesstest = `${URL}/validacion-vida`;

export const URLS = {
  detection: `${urlBase}/document/detection`,
  getLink: `${urlBase}/link`,
  generateToken: `${urlBase}/auth/generate-token`,
  documentTest: `${urlBase}/ocr/document`,
  ping: `${urlBase}/ping`,
  logs: `${urlBase}/log`,
  timeLog: `${urlBase}/time-logs/`,
  timeLogUpdate: `${urlBase}/time-logs/update`,
  validationProvider: `${urlBase}/validation/validation-provider`,
  standaloneValidation: `${urlBase}/validation/standalone`,
  ValidacionIdentidadTipo1: `${urlBase}/validacion-identidad-tipo-1`,
  ValidacionIdentidadTipo3: `${urlBase}/validation/type-3`,
  validarDocumentoAnverso: `${urlBase}/ocr/anverso`,
  validarDocumentoReverso: `${urlBase}/ocr/reverso`,
  validacionVida: `${urlBase}/validacion-vida`,
  validationParameters: `${urlBase}/validation/validation-params`,
  validationFailed: `${urlBase}/validation/failed`,
  obtenerIp: 'https://api.ipify.org/?format=json',
  obtenerData: `${urlBase}/obtener-usuario`,
  comprobarProceso: `${urlBase}/comprobacion-proceso`,
  comprobarValidacion: `${urlBase}/validation/check-validation`,
  validationProgress: `${urlBase}/validation/progress`,
  comprobarFirma: `${urlBase}/comprobacion-firma`,
  obtenerFirmador: `${urlBase}/validation/get-user`,
  getUserData: `${urlBase}/validation/get-user`,
  get resultados() {
    return `${window.location.origin}/efirma.php`;
  },
  get qrBase() {
    return `${window.location.origin}/evidencia/#/evidencias`;
  },
  getMedia: `${urlBase}/get-media`,
  rejected: `${rejected}`,
  pruebaVida: `${urlBase}/anti-spoof`,
  testBarcode: `${urlBase}/ocr/barcode-reader`,
  getLivenessTest: `${urlBase}/validation/get-livenesstest`,
  livenesstest: livenesstest,
  getCountry: `${urlBase}/country/get`,
  // TODO: placeholder — ruta pendiente de definir por backend
  entityBranding: `${urlBase}/logo-entidad/get`,
  frontValidation: `${urlBase}/document/front`,
  backValidation: `${urlBase}/document/back`,
  saveVideo: `${urlBase}/upload-video`,
  ocr: `https://colombia.efirmaplus.com/validacion-ocr-back/ocr`
}

export const validationRedirects = {
  "EFIRMA": `/ekyc-efirma`,
  "EKYC_LLEIDA": `/ekyc`,
}

const WILDCARD_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

const isWildcardHost = (hostname: string): boolean =>
  WILDCARD_HOSTS.has(hostname.trim().toLowerCase());

/**
 * `0.0.0.0` y `::` son direcciones de escucha, no destinos válidos para el
 * navegador. Si la configuración usa una, se reemplaza por el host desde el
 * que se abrió la aplicación (o localhost como último recurso).
 */
const getBrowserHost = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname && !isWildcardHost(hostname)) return hostname;
  }

  return "localhost";
};

const replaceWildcardHost = (parsed: URL): void => {
  if (isWildcardHost(parsed.hostname)) {
    parsed.hostname = getBrowserHost();
  }
};

/**
 * Normaliza la base configurada para WebSocket:
 * - http(s) -> ws(s)
 * - evita hosts comodín (0.0.0.0, ::)
 * - evita mixed content cuando la página se sirve por HTTPS
 * - elimina barras finales
 * Devuelve null si el valor no es una URL válida.
 */
const normalizeWsBaseUrl = (rawBase?: string): string | null => {
  const value = rawBase?.trim();
  if (!value) return null;

  try {
    const parsed = new globalThis.URL(value);
    if (parsed.protocol === "http:") {
      parsed.protocol = "ws:";
    } else if (parsed.protocol === "https:") {
      parsed.protocol = "wss:";
    } else if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return null;
    }

    if (
      parsed.protocol === "ws:" &&
      typeof window !== "undefined" &&
      window.location.protocol === "https:"
    ) {
      parsed.protocol = "wss:";
    }

    replaceWildcardHost(parsed);

    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return null;
  }
};

const getDefaultWsBaseUrl = (): string => {
  const candidate =
    URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");

  try {
    const parsed = new globalThis.URL(candidate);
    parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    parsed.port = "4001";
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    replaceWildcardHost(parsed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "ws://localhost:4001";
  }
};

/**
 * Construye la URL del canal de progreso OCR para un trámite.
 * `baseUrl` es opcional para pruebas; por defecto usa VITE_WS_BASE_URL.
 */
export const getValidationWsUrl = (
  efirmaId: string | number | null | undefined,
  baseUrl?: string,
): string | null => {
  if (efirmaId === null || efirmaId === undefined) return null;

  const id = String(efirmaId).trim();
  if (!id) return null;

  const wsBase =
    normalizeWsBaseUrl(baseUrl) ??
    normalizeWsBaseUrl(import.meta.env.VITE_WS_BASE_URL) ??
    getDefaultWsBaseUrl();

  return `${wsBase}/ws/${encodeURIComponent(id)}`;
};
