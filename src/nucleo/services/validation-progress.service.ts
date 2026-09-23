import api from "@nucleo/api-urls/api";
import { URLS } from "@nucleo/api-urls/urls";
import {
  InformacionIdentidad,
  ValidacionDocumento,
  Dato,
  PruebaVida,
} from "@nucleo/interfaces/validacion-identidad/informacion-identidad.interface";

export interface ValidationProgressData {
  paso?: number;
  [key: string]: unknown;
}

export interface ValidationProgressParams {
  validationAttendance: string;
  validationPercent: string;
  documentsTries: number;
  detectionTries: number;
  faceTries: number;
}

export interface ValidationProgressTimes {
  id: number | string;
  totalTime: number;
  selfieTime: Array<{ saveVideoTime: number; selfieTime: number }>;
  frontTime: Array<{
    ocrTime: number;
    recognizeTime: number;
    innerTimes: unknown;
  }>;
  backTime: Array<{
    ocrTime: number;
    recognizeTime: number;
    innerTimes: unknown;
  }>;
}

export interface ValidationProgressPayload {
  info: InformacionIdentidad;
  documentValidation: ValidacionDocumento;
  signInfo: Dato;
  livenessTest: PruebaVida;
  params: ValidationProgressParams;
  times: ValidationProgressTimes;
  paso: number;
}

export const getProgress = async (
  idUsuario: string | number | null | undefined,
  country: string
): Promise<ValidationProgressData> => {
  const { data } = await api.get(
    `${URLS.validationProgress}?idUsuario=${idUsuario}&country=${country}`
  );
  return data;
};

export const saveProgress = async (
  idUsuario: string | number | null | undefined,
  country: string,
  payload: ValidationProgressPayload
): Promise<unknown> => {
  const { data } = await api.post(
    `${URLS.validationProgress}?idUsuario=${idUsuario}&country=${country}`,
    payload
  );
  return data;
};