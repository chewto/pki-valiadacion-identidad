export interface PruebaVida{
  movimiento: string;
  idCarpetaEntidad: string;
  idCarpetaUsuario: string;
}

export interface InformacionIdentidad {
  anverso: string;
  reverso: string;
  tipoDocumento: string;
  foto_persona: string;
  dispositivo: string;
  navegador: string;
  ip: string;
  latitud: string;
  longitud: string;
  hora: string;
  fecha: string;
}

export interface Dato {
  id?: number;
  firmaElectronicaId?: number;
  nombre: string;
  apellido: string;
  correo: string;
  tipoDocumento?: string;
  documento: string;
  evidenciasCargadas?: boolean;
  enlaceTemporal?: string;
  ordenFirma?: number;
  fechaCreacion?: string;
}

export interface ValidacionOCR {
  ocr: OCR;
  porcentajes: Porcentajes;
  rostro: boolean;
}

interface OCR {
  nombreOCR: string;
  apellidoOCR: string;
  documentoOCR: string;
}

interface Porcentajes {
  porcentajeNombreOCR: string;
  porcentajeApellidoOCR: string;
  porcentajeDocumentoOCR: string;
}

export interface ValidacionCB {
  reconocido: string;
  nombre: string;
  apellido: string;
  documento: string;
}

export interface ComprobacionProceso{
  id: number;
  idValidacion: string;
  idProceso: string;
  estado: string
}