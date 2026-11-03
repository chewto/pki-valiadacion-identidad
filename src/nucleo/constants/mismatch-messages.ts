import type {
  MismatchField,
  MismatchSource,
} from "../interfaces/validacion-identidad/informacion-identidad.interface";

export const MISMATCH_FIELD_LABELS: Record<MismatchField, string> = {
  name: "Nombre(s)",
  lastName: "Apellido(s)",
  ID: "Número de documento",
};

export const MISMATCH_FIELD_SUBJECTS: Record<MismatchField, string> = {
  name: "el nombre",
  lastName: "el apellido",
  ID: "el número de documento",
};

const MISMATCH_FIELD_MESSAGES: Record<
  MismatchSource,
  Record<MismatchField, string>
> = {
  ocr: {
    name: "No coincide con los datos leídos del documento.",
    lastName: "No coincide con los datos leídos del documento.",
    ID: "No coincide con los datos detectados del documento.",
  },
  mrz: {
    name: "No coincide con la zona de lectura mecánica (MRZ).",
    lastName: "No coincide con la zona de lectura mecánica (MRZ).",
    ID: "No coincide con la zona de lectura mecánica (MRZ).",
  },
};

export const getMismatchMessage = (
  field: MismatchField,
  source: MismatchSource
): string => MISMATCH_FIELD_MESSAGES[source][field];

export const getUnreadableMessage = (field: MismatchField): string =>
  `No pudimos leer ${MISMATCH_FIELD_SUBJECTS[field]} en el documento. Intenta de nuevo con una foto más nítida, sin reflejos y bien enfocada.`;

export const CAPTURE_ADVICE =
  "Intenta de nuevo con una foto más nítida, sin reflejos y bien enfocada.";

export const isUnreadableMessage = (message: string): boolean =>
  /no se pudo leer|no pudimos leer|no se pudo reconocer|no se pudo interpretar|ilegible/i.test(
    message
  );
