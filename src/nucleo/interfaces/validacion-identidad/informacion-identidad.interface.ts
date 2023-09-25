export interface InformacionIdentidad {
  nombres: string;
  apellidos: string;
  numero_documento: string;
  anverso: File | string;
  reverso: File | string;
  foto_persona: File | string;
}

export interface Respuesta {
  coincidencia_documento_rostro: boolean;
  persona_reconocida: string;
  status: string;
}

export interface PreviewDocumento{
  anverso: string;
  reverso: string;
  foto_persona: string;
}