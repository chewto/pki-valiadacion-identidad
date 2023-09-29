export interface InformacionIdentidad {
  anverso: File | string;
  reverso: File | string;
  foto_persona: File | string;
  dispositivo: string;
  navegador: string;
  latitud: string;
  longitud: string;
  hora: string;
  fecha: string;
}

export interface Respuesta {
  coincidenciaDocumentoRostro: boolean;
  estadoVerificacion: string;
  evidencias: string;
  evidenciasAdicionales: string;
  tipoDocumento: string;
}

export interface PreviewDocumento{
  anverso: string;
  reverso: string;
  foto_persona: string;
}

export interface EvidenciasRes{
  idEvidencias: number;
  idEvidenciasAdicionales: number;
}