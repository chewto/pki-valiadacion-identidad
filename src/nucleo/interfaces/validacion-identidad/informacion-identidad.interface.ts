export interface InformacionIdentidad {
  anverso: string;
  reverso: string;
  foto_persona: string;
  dispositivo: string;
  navegador: string;
  ip: string;
  latitud: string;
  longitud: string;
  hora: string;
  fecha: string;
}

export interface Root {
  dato: Dato
}

export interface Dato {
  id?: number
  firmaElectronicaId?: number
  nombre: string
  apellido: string
  correo: string
  tipoDocumento?: string
  documento: string
  evidenciasCargadas?: boolean
  enlaceTemporal?: string
  ordenFirma?: number
  fechaCreacion?: string
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
