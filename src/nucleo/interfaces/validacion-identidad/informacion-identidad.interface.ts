export interface PruebaVida{
  movimiento: string;
  idCarpetaEntidad: string;
  idCarpetaUsuario: string;
  // isReal: boolean;
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

export interface ValidacionDocumento {
  ocr: OCR;
  face: boolean;
  mrz: MRZ;
  barcode: string;
  validSide: string;
  sides: CorrespondingSide;
}

export interface MRZ{
  code: string;
  data: MRZData;
  percentages: MRZPercentages;
}

interface MRZPercentages{
  name: string;
  lastName: string;
}

interface MRZData{
  name: string;
  lastName: string;
}

export interface DocumentData{
  correspond: string;
  code: string;
  country: string;
  countryCheck: string;
  type: string;
  typeCheck: string;
}

interface CorrespondingSide{
  front: DocumentData;
  back: DocumentData;
}


interface OCR {
  data: OCRData;
  percentage: OCRPercentage
}

interface OCRData{
  name: string;
  lastName: string;
  ID: string
}

interface OCRPercentage {
  name: string;
  lastName: string;
  ID: string;
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