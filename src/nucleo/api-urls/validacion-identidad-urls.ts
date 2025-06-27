// const pais = 'honducert'
// const subdomain = 'honducert.firma'

// const pais = 'efirmaPlus'
// const subdomain = 'desarrollo'

// const pais = 'honducert_desarrollo'
// const subdomain = 'desarrollo'

  // const pais = 'honducert_pruebas'
  // const subdomain = 'desarrollo'

// const pais = 'honducert_temp'
// const subdomain = 'desarrollo'

const pais = 'desarrollo'
const subdomain = 'desarrollo'

const ekycSubdomain = 'hon'

const rutasURL = {
  desarrollo:{
    ocr: "http://localhost:4500",
    validacion: "http://192.168.1.107:4000",
    fe: "http://192.168.1.107:4000/obtener-firmador",
    resultados: "",
    // rejected: `https://${subdomain}.e-custodia.com/resultado_validacion_fallida`
    rejected: ``,
    validacionVida: 'https://desarrollo.e-custodia.com/validacion-vida',
    saveVideo: 'https://desarrollo.web.honducert.com/fe-val-back/api/Video'
  }
  ,
  honducert_desarrollo:{
      validacion: `https://${subdomain}.e-custodia.com/validacion-back`,
      fe: `https://${subdomain}.e-custodia.com/fe-back/api/Firmador`,
      // fe: `https://cavipetrol.efirmaplus.com/fe-back/api/Firmador`,
      resultados: `https://${subdomain}.e-custodia.com/efirma.php/`,
      rejected: `https://${subdomain}.e-custodia.com/resultado_validacion_fallida`,
      validacionVida: 'https://desarrollo.e-custodia.com/validacion-vida',
      saveVideo: 'https://desarrollo.e-custodia.com/fe-val-back/api/Video'
    },
    honducert_temp:{
      validacion: `https://desarrollo.web.honducert.com/validacion-back`,
      fe: `https://${subdomain}.e-custodia.com/fe-back/api/Firmador`,
      resultados: `https://${subdomain}.e-custodia.com/efirma.php/`,
      rejected: `https://${subdomain}.e-custodia.com/resultado_validacion_fallida`,
      validacionVida: 'https://desarrollo.e-custodia.com/validacion-vida',
      saveVideo: 'https://desarrollo.web.honducert.com/fe-val-back/api/Video'
    },
    honducert:{
      validacion: `https://${subdomain}.e-custodia.com/validacion-back`,
      fe: `https://${subdomain}.e-custodia.com/fe-back/api/Firmador`,
      resultados: `https://${subdomain}.e-custodia.com/efirma.php/`,
      rejected: `https://${subdomain}.e-custodia.com/resultado_validacion_fallida`,
      validacionVida: 'https://desarrollo.e-custodia.com/validacion-vida',
      saveVideo: 'https://desarrollo.web.honducert.com/fe-val-back/api/Video'
    },
    honducert_pruebas:{
      validacion: `https://desarrollo.web.honducert.com/validacion-back`,
      fe: `https://desarrollo.e-custodia.com/fe-back/api/Firmador`,
      resultados: `https://desarrollo.web.honducert.com/efirma.php/`,
      rejected: `https://desarrollo.web.honducert.com/resultado_validacion_fallida`,
      validacionVida: 'https://desarrollo.web.honducert.com/validacion-vida',
      saveVideo: 'https://desarrollo.web.honducert.com/fe-val-back/api/Video',
      ocr: "https://desarrollo.web.honducert.com/validacion-ocr-back",
    },
    efirmaPlus:{
      validacion: `https://cavipetrol.efirmaplus.com/validacion-back`,
      fe: `https://cavipetrol.efirmaplus.com/fe-back/api/Firmador`,
      resultados: `https://cavipetrol.efirmaplus.com/efirma.php/`,
      rejected: `https://cavipetrol.efirmaplus.com/resultado_validacion_fallida`,
      validacionVida: 'https://desarrollo.e-custodia.com/validacion-vida',
      saveVideo: 'https://desarrollo.web.honducert.com/fe-val-back/api/Video'
    }
  // libertador:{
  //   validacion: "https://libertador.pkiservices.co/validacion-back",
  //   fe: "https://libertador.pkiservices.co/fe-back/api/Firmador",
  //   resultados: "https://efirma.pkiservices.co/efirma.php/"
  // },
  // eFirmaPanama:{
  //   validacion: "https://panama.efirma.pkiservices.co/validacion-back",
  //   fe: "https://panama.efirma.pkiservices.co/fe-back/api/Firmador",
  //   resultados: "https://panama.efirma.pkiservices.co/efirma.php/"
  // },
  // eFirmaCO:{
  //   validacion: "https://e-firma.pkiservices.co/validacion-back",
  //   fe: "https://e-firma.pkiservices.co/fe-back/api/Firmador",
  //   resultados: "https://e-firma.pkiservices.co/efirma.php/"
  // }
}

const firmadorUrlBase = rutasURL[pais]["fe"]
const urlBase = rutasURL[pais]["validacion"]
const efirmaUrl = rutasURL[pais]["resultados"]
const rejected = rutasURL[pais]['rejected']
const livenesstest = rutasURL[pais]['validacionVida']
const saveVideo = rutasURL[pais]['saveVideo']
const ocr = rutasURL[pais]['ocr']

export const URLS = {
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
  lleidaValidation: `https://${ekycSubdomain}.e-custodia.com/ekyc`,
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