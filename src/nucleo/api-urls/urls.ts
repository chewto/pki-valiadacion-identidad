

const URL = import.meta.env.VITE_BASE_URL

const rutasURL = {
      validacion: `${URL}/validacion-back`,
      fe: `${URL}/fe-back/api/Firmador`,
      resultados: `${URL}/efirma.php/`,
      rejected: `${URL}/resultado_validacion_fallida`,
      validacionVida: `${URL}/validacion-vida`,
      saveVideo: `${URL}/fe-val-back/api/Video`,
      ocr: `${URL}/validacion-ocr-back`,
}

const firmadorUrlBase = rutasURL["fe"]
const urlBase = rutasURL["validacion"]
const efirmaUrl = rutasURL["resultados"]
const rejected = rutasURL['rejected']
const livenesstest = rutasURL['validacionVida']
const saveVideo = rutasURL['saveVideo']
const ocr = rutasURL['ocr']

export const URLS = {
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
  // obtenerEvidencias: 'http://127.0.0.1:4000/obtener-evidencias',
  obtenerData: `${urlBase}/obtener-usuario`,
  comprobarProceso: `${urlBase}/comprobacion-proceso`,
  comprobarValidacion: `${urlBase}/validation/check-validation`,
  comprobarFirma: `${urlBase}/comprobacion-firma`,
  obtenerFirmador: firmadorUrlBase,
  getUserData: `${urlBase}/validation/get-user`,
  resultados: `${efirmaUrl}`,
  getMedia: `${urlBase}/get-media`,
  // standaloneResults: `https://${subdomain}.e-custodia.com/resultado_validacion`,
  rejected:`${rejected}`,
  pruebaVida: `${urlBase}/anti-spoof`,
  // lleidaValidation: `https://${ekycSubdomain}.e-custodia.com/ekyc`,
  testBarcode: `${urlBase}/ocr/barcode-reader`,
  getLivenessTest: `${urlBase}/validation/get-livenesstest`,
  livenesstest: livenesstest,
  getCountry: `${urlBase}/country/get`,
  frontValidation: `${urlBase}/document/front`,
  backValidation: `${urlBase}/document/back`,
  saveVideo: `${saveVideo}`,
  ocr: `${ocr}/ocr`
}

export const validationRedirects = {
  "EFIRMA": `/ekyc-efirma`,
  "EKYC_LLEIDA":`/ekyc`,
}