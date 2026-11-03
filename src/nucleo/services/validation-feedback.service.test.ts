import { describe, expect, it } from "vitest";
import type { DocumentValidationResponse } from "../interfaces/validacion-identidad/informacion-identidad.interface";
import {
  normalizeValidationFeedback,
  shouldAutoAdvanceAfterValidation,
} from "./validation-feedback.service";

const NAME_MISMATCH =
  "Su nombre no coincide con los datos legibles del documento.";

describe("normalizeValidationFeedback", () => {
  it("marca error de validación en el anverso y un solo issue de nombre", () => {
    const response: DocumentValidationResponse = {
      validSide: false,
      hasMismatch: true,
      messages: [NAME_MISMATCH],
      mismatches: [
        {
          field: "name",
          label: "nombre",
          source: "ocr",
          message: NAME_MISMATCH,
          percentage: 35,
          threshold: 50,
        },
      ],
      ocr: { data: { name: "", lastName: "", ID: "" } },
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback.tone).toBe("error");
    expect(feedback.canContinue).toBe(false);
    expect(feedback.hasIssues).toBe(true);
    expect(feedback.hasMismatch).toBe(true);
    expect(feedback.fieldIssues).toHaveLength(1);
    expect(feedback.fieldIssues[0]).toMatchObject({
      field: "name",
      label: "Nombre(s)",
      source: "ocr",
      kind: "mismatch",
      percentage: 35,
      threshold: 50,
    });
    expect(feedback.generalMessages).toEqual([]);
  });

  it("bloquea el lado cuando el MRZ no coincide aunque validSide sea true", () => {
    const response: DocumentValidationResponse = {
      validSide: true,
      hasMismatch: true,
      messages: [
        "Tu apellido no coincide con la zona de lectura mecánica del documento.",
      ],
      mismatches: [
        {
          field: "lastName",
          label: "apellido",
          source: "mrz",
          message:
            "Tu apellido no coincide con la zona de lectura mecánica del documento.",
          percentage: 0,
          threshold: 51,
        },
      ],
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback.tone).toBe("warning");
    expect(feedback.canContinue).toBe(false);
    expect(feedback.hasMismatch).toBe(true);
    expect(feedback.fieldIssues).toHaveLength(1);
    expect(feedback.fieldIssues[0]).toMatchObject({
      field: "lastName",
      label: "Apellido(s)",
      source: "mrz",
      kind: "mismatch",
    });
    expect(feedback.generalMessages).toEqual([]);
  });

  it("clasifica un OCR ilegible como problema de captura, no como mismatch", () => {
    const response: DocumentValidationResponse = {
      validSide: false,
      hasMismatch: false,
      mismatches: [],
      messages: ["No se pudo leer el nombre en el documento."],
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback.hasMismatch).toBe(false);
    expect(feedback.tone).toBe("error");
    expect(feedback.fieldIssues).toHaveLength(1);
    expect(feedback.fieldIssues[0]).toMatchObject({
      field: "name",
      label: "Nombre(s)",
      kind: "unreadable",
    });
    expect(feedback.fieldIssues[0].message).toContain("foto más nítida");
    expect(feedback.generalMessages).toEqual([]);
  });

  it("conserva los mensajes generales de una respuesta antigua sin mismatches", () => {
    const response: DocumentValidationResponse = {
      validSide: false,
      messages: [
        "El código de barras no es legible.",
        "No pudimos verificar que el documento pertenezca al país seleccionado.",
      ],
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback.hasMismatch).toBe(false);
    expect(feedback.fieldIssues).toEqual([]);
    expect(feedback.generalMessages).toEqual([
      "El código de barras no es legible.",
      "No pudimos verificar que el documento pertenezca al país seleccionado.",
    ]);
  });

  it("no duplica un campo repetido en mismatches y messages", () => {
    const response: DocumentValidationResponse = {
      validSide: false,
      hasMismatch: true,
      messages: [NAME_MISMATCH, NAME_MISMATCH],
      mismatches: [
        {
          field: "name",
          source: "ocr",
          message: NAME_MISMATCH,
          percentage: 20,
          threshold: 50,
        },
      ],
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback.fieldIssues).toHaveLength(1);
    expect(feedback.generalMessages).toEqual([]);
  });

  it("no muestra errores cuando mismatches está vacío y validSide es true", () => {
    const response: DocumentValidationResponse = {
      validSide: true,
      hasMismatch: false,
      mismatches: [],
      messages: [],
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback).toMatchObject({
      hasIssues: false,
      hasMismatch: false,
      tone: "success",
      canContinue: true,
      fieldIssues: [],
      generalMessages: [],
    });
  });

  it("deduplica mismatches del mismo campo y prioriza el mismatch real", () => {
    const response: DocumentValidationResponse = {
      validSide: false,
      hasMismatch: true,
      mismatches: [
        {
          field: "ID",
          source: "ocr",
          message: "No se pudo leer el número de documento.",
          percentage: 0,
          threshold: 50,
        },
        {
          field: "ID",
          source: "ocr",
          message: "El número de documento no coincide.",
          percentage: 25,
          threshold: 50,
        },
      ],
      ocr: { data: { name: "", lastName: "", ID: "" } },
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback.fieldIssues).toHaveLength(1);
    expect(feedback.fieldIssues[0]).toMatchObject({
      field: "ID",
      label: "Número de documento",
      kind: "mismatch",
      percentage: 25,
    });
  });

  it("clasifica como ilegible un porcentaje 0 con OCR vacío", () => {
    const response: DocumentValidationResponse = {
      validSide: false,
      hasMismatch: true,
      mismatches: [
        {
          field: "lastName",
          source: "ocr",
          percentage: 0,
          threshold: 50,
        },
      ],
      ocr: { data: { name: "JUAN", lastName: "", ID: "123" } },
    };

    const feedback = normalizeValidationFeedback(response);

    expect(feedback.fieldIssues[0].kind).toBe("unreadable");
  });

  it("mantiene un estado genérico válido cuando la respuesta no trae datos", () => {
    const feedback = normalizeValidationFeedback({ validSide: false });

    expect(feedback.hasIssues).toBe(true);
    expect(feedback.tone).toBe("error");
    expect(feedback.canContinue).toBe(false);
    expect(feedback.fieldIssues).toEqual([]);
    expect(feedback.generalMessages).toEqual([]);
  });
});

describe("shouldAutoAdvanceAfterValidation", () => {
  const blockingFeedback = normalizeValidationFeedback({
    validSide: false,
    hasMismatch: true,
    mismatches: [{ field: "name", source: "ocr" }],
  });

  const mrzMismatchFeedback = normalizeValidationFeedback({
    validSide: true,
    hasMismatch: true,
    mismatches: [{ field: "lastName", source: "mrz" }],
  });

  const nonBlockingWarningFeedback = normalizeValidationFeedback({
    validSide: true,
    hasMismatch: false,
    mismatches: [],
    messages: ["La foto del documento tiene baja iluminación."],
  });

  it("mantiene el feedback bloqueante mientras queden intentos", () => {
    expect(shouldAutoAdvanceAfterValidation(blockingFeedback, 1)).toBe(false);
  });

  it("avanza automáticamente cuando se agotaron los intentos", () => {
    expect(shouldAutoAdvanceAfterValidation(blockingFeedback, 0)).toBe(true);
    expect(shouldAutoAdvanceAfterValidation(blockingFeedback, -1)).toBe(true);
  });

  it("no avanza un mismatch MRZ mientras queden intentos", () => {
    expect(shouldAutoAdvanceAfterValidation(mrzMismatchFeedback, 2)).toBe(false);
    expect(shouldAutoAdvanceAfterValidation(mrzMismatchFeedback, 0)).toBe(true);
  });

  it("avanza una advertencia realmente no bloqueante", () => {
    expect(
      shouldAutoAdvanceAfterValidation(nonBlockingWarningFeedback, 2)
    ).toBe(true);
  });
});
