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

