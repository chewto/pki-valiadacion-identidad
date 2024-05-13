// ruta desarrollo
const urlBase ='http://127.0.0.1:4000'

// ruta produccion
//const urlBase = 'https://libertador.pkiservices.co/validacion-back'

//const urlBase = 'https://panama.efirma.pkiservices.co/validacion-back/'

// ruta desarrollo
const firmadorUrlBase = 'http://127.0.0.1:4000/obtener-firmador'

// ruta produccion
//const firmadorUrlBase = 'https://libertador.pkiservices.co/fe-back/api/Firmador'

//const firmadorUrlBase = 'https://panama.efirma.pkiservices.co/fe-back/api/Firmador'

//colombia
const efirmaUrl = 'https://efirma.pkiservices.co/efirma.php/'

//panama
//const efirmaUrl = 'https://panama.efirma.pkiservices.co/efirma.php/'

export const URLS = {
  ValidacionIdentidadTipo1: `${urlBase}/validacion-identidad-tipo-1`,
  ValidacionIdentidadTipo3: `${urlBase}/validacion-identidad-tipo-3`,
  validarDocumentoAnverso: `${urlBase}/ocr-anverso`,
  validarDocumentoReverso: `${urlBase}/ocr-reverso`,
  validacionVida: `${urlBase}/validacion-vida`,
  obtenerIp: 'https://api.ipify.org/?format=json',
  // obtenerEvidencias: 'http://127.0.0.1:4000/obtener-evidencias',
  obtenerData: `${urlBase}/obtener-usuario`,
  comprobarProceso: `${urlBase}/comprobacion-proceso`,
  comprobarFirma: `${urlBase}/comprobacion-firma`,
  obtenerFirmador: firmadorUrlBase,
  resultados: `${efirmaUrl}`
}