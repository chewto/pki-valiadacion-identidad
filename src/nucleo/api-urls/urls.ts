import { getCountry } from '@nucleo/hooks/useCountry';

const URL = import.meta.env.VITE_BASE_URL;

// Mapa de URLs base de servicios externos por país (fe-back / fe-val-back)
const countryServiceUrls: Record<string, { fe: string; saveVideo: string; pruebaVida: string; efirmaUrl: string }> = {
  COL: {
    fe: import.meta.env.VITE_FE_BASE_URL_CO,
    saveVideo: import.meta.env.VITE_FE_BASE_URL_CO,
    pruebaVida: import.meta.env.VITE_FE_BASE_URL_CO,
    efirmaUrl: import.meta.env.VITE_FE_BASE_URL_CO,
  },
  HND: {
    fe: import.meta.env.VITE_FE_BASE_URL_HN,
    saveVideo: import.meta.env.VITE_FE_BASE_URL_HN,
    pruebaVida: import.meta.env.VITE_FE_BASE_URL_HN,
    efirmaUrl: import.meta.env.VITE_FE_BASE_URL_HN,
  },
};

// Helper: selecciona las URLs correctas según el país (X-Fuente header)
export const getCountryServiceUrls = () => {
  const country = getCountry();
  const config = countryServiceUrls[country] || countryServiceUrls['COL'];
  return {
    // fe: `${config.fe}/fe-back/api/Firmador`,
    saveVideo: `${config.saveVideo}/fe-val-back/api/Video`,
    pruebaVida: `${config.pruebaVida}/validacion-back/anti-spoof`,
    efirmaUrl: `${config.efirmaUrl}/efirma.php/`,
  };
};

const countryUrls = getCountryServiceUrls();

// URLs del back centralizado (mismo dominio para todos los países)
const urlBase = `${URL}`;
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
  comprobarFirma: `${urlBase}/comprobacion-firma`,
  obtenerFirmador: `${urlBase}/validation/get-user`,
  getUserData: `${urlBase}/validation/get-user`,
  resultados: countryUrls.efirmaUrl,
  getMedia: `${urlBase}/get-media`,
  rejected: `${rejected}`,
  pruebaVida: countryUrls.pruebaVida,
  testBarcode: `${urlBase}/ocr/barcode-reader`,
  getLivenessTest: `${urlBase}/validation/get-livenesstest`,
  livenesstest: livenesstest,
  getCountry: `${urlBase}/country/get`,
  frontValidation: `${urlBase}/document/front`,
  backValidation: `${urlBase}/document/back`,
  saveVideo: countryUrls.saveVideo,
  ocr: `https://colombia.efirmaplus.com/validacion-ocr-back/ocr`
}

export const validationRedirects = {
  "EFIRMA": `/ekyc-efirma`,
  "EKYC_LLEIDA": `/ekyc`,
}
