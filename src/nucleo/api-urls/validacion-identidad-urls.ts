
//mo6TixVJ

// ruta desarrollo
const urlBase ='http://127.0.0.1:4000'

// // ruta produccion
//const urlBase = 'https://libertador.pkiservices.co/validacion-back'

// ruta desarrollo
 const firmadorUrlBase = 'http://127.0.0.1:4000/obtener-firmador'

// ruta produccion
//const firmadorUrlBase = 'https://libertador.pkiservices.co/fe-back/api/Firmador'

export const URLS = {
  ValidacionIdentidadTipo1: `${urlBase}/validacion-identidad-tipo-1`,
  ValidacionIdentidadTipo3: `${urlBase}/validacion-identidad-tipo-3`,
  validarDocumento: `${urlBase}/ocr`,
  validacionVida: `${urlBase}/validacion-vida`,
  obtenerIp: 'https://api.ipify.org/?format=json',
  // obtenerEvidencias: 'http://127.0.0.1:4000/obtener-evidencias',
  obtenerFirmador: firmadorUrlBase,
  resultados: 'https://efirma.pkiservices.co/efirma.php/'
}