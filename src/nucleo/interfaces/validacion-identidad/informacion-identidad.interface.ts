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

export interface InformacionFirmador {
  nombre: string;
  apellido: string;
  correo: string;
  documento: string;
  tipoDocumento?: string;
  enlaceTemporal?: string;
  ordenFirma?: number;
  firmaElectronicaId?: number;
}

export interface Respuesta {
  idValidacion?: number;
  idUsuario?: number;
  coincidenciaDocumentoRostro: boolean;
  estadoVerificacion: string;
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