export type ValidationWsStep =
  | "start"
  | "face_detection"
  | "face_comparison"
  | "doc_validation"
  | "name_validation"
  | "barcode"
  | "mrz"
  | "completed";

export type ValidationWsStatus =
  | "processing"
  | "success"
  | "warning"
  | "error";

export interface ValidationWsExtra {
  validSide?: boolean;
  messages?: string[];
  valid?: boolean;
  side?: "anverso" | "reverso";
}

export interface ValidationWsProgress {
  efirma_id: string;
  step: ValidationWsStep;
  message: string;
  status: ValidationWsStatus;
  timestamp: number;
  extra?: ValidationWsExtra;
}
