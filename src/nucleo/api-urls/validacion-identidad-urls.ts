const pais = 'honducert'

const subdomain = 'honducert.firma'

// const subdomain = 'desarrollo'
const ekycSubdomain = 'honduras'

const rutasURL = {
  desarrollo:{
    validacion: "http://127.0.0.1:4000",
    fe: "http://127.0.0.1:4000/obtener-firmador",
    resultados: "",
    rejected: `https://${subdomain}.e-custodia.com/resultado_validacion_fallida`
  }
  ,
  honducert_desarrollo:{
      validacion: `https://${subdomain}.e-custodia.com/validacion-back`,
      fe: `https://${subdomain}.e-custodia.com/fe-back/api/Firmador`,
      resultados: `https://${subdomain}.e-custodia.com/efirma.php/`,
      rejected: `https://${subdomain}.e-custodia.com/resultado_validacion_fallida`
    },
    honducert:{
      validacion: `https://${subdomain}.e-custodia.com/validacion-back`,
      fe: `https://${subdomain}.e-custodia.com/fe-back/api/Firmador`,
      resultados: `https://${subdomain}.e-custodia.com/efirma.php/`,
      rejected: `https://${subdomain}.e-custodia.com/resultado_validacion_fallida`
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

export const URLS = {
  validationProvider: `${urlBase}/validation/validation-provider`,
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
  resultados: `${efirmaUrl}`,
  rejected:`${rejected}`,
  pruebaVida: `${urlBase}/anti-spoof`,
  lleidaValidation: `https://${ekycSubdomain}.e-custodia.com/ekyc`
}

export const validationRedirects = {
  "EFIRMA": `/ekyc-efirma`,
  "EKYC_LLEIDA":`/ekyc`,
}