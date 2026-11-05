import type { ValidationWsStep } from "../interfaces/validacion-identidad/validation-ws.interface";

export const OCR_STEP_PROGRESS: Record<ValidationWsStep, number> = {
  start: 10,
  face_detection: 25,
  face_comparison: 40,
  doc_validation: 55,
  name_validation: 70,
  barcode: 80,
  mrz: 90,
  completed: 100,
};

export const isValidationWsStep = (
  value: unknown
): value is ValidationWsStep =>
  typeof value === "string" &&
  Object.prototype.hasOwnProperty.call(OCR_STEP_PROGRESS, value);

export const getOcrStepProgress = (step: ValidationWsStep): number =>
  OCR_STEP_PROGRESS[step];
