export interface PruebaVida{
  movimiento: string;
  videoHash: string;
  x?: number;   // Centro X en px
  y?: number;    // Centro Y en px
  rx?: number;          // Radio X en px (30% de 100)
  ry?: number;   
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
  callback?: string;
  redireccion?: string;
  idUsuario?: number;
  idValidacion?: number;
  tipoValidacion?:number;
  validacionVida?: boolean;
  pais?: string;
}

export interface ValidacionDocumento {
  ocr: OCR;
  face: boolean;
  confidence: number;
  mrz: MRZ;
  barcode: string | null;
  sideResult: {
    front: boolean;
    back: boolean;
  }
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
  code: string;
  country: string;
  countryCheck: boolean;
  type: string;
  typeCheck: boolean;
  isExpired: boolean | null;
  tries: number;
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