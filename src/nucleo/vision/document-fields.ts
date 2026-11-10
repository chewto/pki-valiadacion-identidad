import type { CamposDocumento } from "../interfaces/validacion-identidad/informacion-identidad.interface";
import type { GuideSideProfile } from "./document-model.config";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const asNestedRecord = (
  value: unknown,
  key: string
): Record<string, unknown> | null => {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
};

export const isCamposCompleto = (
  campos: Pick<CamposDocumento, "nombre" | "apellido" | "documento">
): boolean =>
  (campos.nombre ?? "").trim().length > 0 &&
  (campos.apellido ?? "").trim().length > 0 &&
  (campos.documento ?? "").trim().length > 0;

export const mapFieldsFromValidationResponse = (
  response: unknown
): CamposDocumento | null => {
  if (!isRecord(response)) return null;

  const ocrData = asNestedRecord(response, "ocr");
  const ocrValues = ocrData ? asNestedRecord(ocrData, "data") : null;
  const mrz = asNestedRecord(response, "mrz");
  const mrzExtracted = mrz ? asNestedRecord(mrz, "extractedData") : null;

  const nombre = asString(ocrValues?.name) || asString(mrzExtracted?.name);
  const apellido =
    asString(ocrValues?.lastName) || asString(mrzExtracted?.lastName);
  const documento =
    asString(ocrValues?.ID) || asString(mrzExtracted?.documentNumber);
  const fechaNacimiento = asString(mrzExtracted?.dateOfBirth);
  const fechaExpiracion = asString(mrzExtracted?.expirationDate);
  const nacionalidad = asString(mrzExtracted?.nationality);

  if (
    !nombre &&
    !apellido &&
    !documento &&
    !fechaNacimiento &&
    !fechaExpiracion &&
    !nacionalidad
  ) {
    return null;
  }

  const hasOcrValues = Boolean(nombre || apellido || documento);

  return {
    nombre,
    apellido,
    documento,
    fechaNacimiento,
    fechaExpiracion,
    nacionalidad,
    origen: hasOcrValues ? "ocr" : "mrz",
    completado: isCamposCompleto({ nombre, apellido, documento }),
  };
};

/**
 * Conserva las correcciones manuales de una captura anterior y completa los
 * huecos con la nueva respuesta del backend.
 */
export const mergeCampos = (
  previous: CamposDocumento | undefined,
  next: CamposDocumento | null
): CamposDocumento | null => {
  if (!previous && !next) return null;
  if (!previous) return next;
  if (!next) return previous;

  const merged: CamposDocumento = {
    nombre: previous.nombre || next.nombre,
    apellido: previous.apellido || next.apellido,
    documento: previous.documento || next.documento,
    fechaNacimiento: previous.fechaNacimiento || next.fechaNacimiento,
    fechaExpiracion: previous.fechaExpiracion || next.fechaExpiracion,
    nacionalidad: previous.nacionalidad || next.nacionalidad,
    origen: previous.origen === "manual" ? "manual" : next.origen,
    completado: false,
  };

  merged.completado = isCamposCompleto(merged);
  return merged;
};

export const fieldsRequiredByProfile = (
  profile: GuideSideProfile
): Array<keyof CamposDocumento> => {
  const required: Array<keyof CamposDocumento> = [];

  for (const label of profile.required) {
    if (["NOMBRES", "nombre"].includes(label)) required.push("nombre");
    else if (["APELLIDOS", "apellido"].includes(label))
      required.push("apellido");
    else if (
      ["NUMERO_DOCUMENTO", "NUMERO_PASAPORTE", "numero_documento"].includes(
        label
      )
    ) {
      required.push("documento");
    } else if (["FECHA_NACIMIENTO", "fecha_nacimiento"].includes(label))
      required.push("fechaNacimiento");
    else if (["FECHA_EXPIRACION", "fecha_expiracion"].includes(label))
      required.push("fechaExpiracion");
  }

  return [...new Set(required)];
};

export const hasRequiredFieldValues = (
  campos: CamposDocumento | null | undefined,
  profile: GuideSideProfile | null
): boolean => {
  if (!profile) return true;
  if (!campos) return profile.required.length === 0;

  const required = fieldsRequiredByProfile(profile);
  return required.every((field) => {
    const value = campos[field];
    return typeof value === "string" && value.trim().length > 0;
  });
};
