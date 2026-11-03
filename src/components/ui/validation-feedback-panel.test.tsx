import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DocumentValidationResponse } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { normalizeValidationFeedback } from "../../nucleo/services/validation-feedback.service";
import { ValidationFeedbackPanel } from "./validation-feedback-panel";

const renderFromResponse = (response: DocumentValidationResponse) =>
  render(
    <ValidationFeedbackPanel
      id="document-validation-feedback"
      feedback={normalizeValidationFeedback(response)}
    />
  );

describe("ValidationFeedbackPanel", () => {
  it("muestra el nombre discrepante en el anverso sin acciones", () => {
    renderFromResponse({
      validSide: false,
      hasMismatch: true,
      mismatches: [
        {
          field: "name",
          source: "ocr",
          message: "Su nombre no coincide con los datos del documento.",
          percentage: 35,
          threshold: 50,
        },
      ],
    });

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(
      screen.getByText("Algunos datos no coinciden con el documento.")
    ).toBeTruthy();
    expect(screen.getByText("Nombre(s):")).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("bloquea el mismatch MRZ y pide recapturar, sin botones", () => {
    renderFromResponse({
      validSide: true,
      hasMismatch: true,
      mismatches: [
        {
          field: "lastName",
          source: "mrz",
          percentage: 0,
          threshold: 51,
        },
      ],
    });

    expect(
      screen.getByRole("heading", {
        name: /no coincide con la zona de lectura mecánica \(MRZ\).*vuelve a capturar/i,
      })
    ).toBeTruthy();
    expect(screen.getByText("Apellido(s):")).toBeTruthy();
    expect(screen.queryByText(/Puedes continuar/i)).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("trata el OCR ilegible como problema de captura", () => {
    renderFromResponse({
      validSide: false,
      hasMismatch: false,
      mismatches: [],
      messages: ["No se pudo leer el apellido en el documento."],
    });

    expect(
      screen.getByText("No pudimos leer algunos datos del documento.")
    ).toBeTruthy();
    expect(screen.getByText("Apellido(s):")).toBeTruthy();
    expect(screen.getByText(/foto más nítida, sin reflejos/i)).toBeTruthy();
    expect(
      screen.queryByText("Algunos datos no coinciden con el documento.")
    ).toBeNull();
  });

  it("no expone porcentajes ni el detalle técnico", () => {
    renderFromResponse({
      validSide: false,
      hasMismatch: true,
      mismatches: [
        {
          field: "ID",
          source: "ocr",
          percentage: 35,
          threshold: 50,
          message: "El número de documento no coincide.",
        },
      ],
    });

    expect(screen.queryByText("Ver detalle")).toBeNull();
    expect(screen.queryByText(/35%/)).toBeNull();
    expect(screen.queryByText(/50%/)).toBeNull();
    expect(screen.queryByText(/Mensaje del servicio/i)).toBeNull();
  });

  it("renderiza mensajes generales como texto y no como HTML", () => {
    const { container } = renderFromResponse({
      validSide: false,
      messages: ['<img src="x" onerror="alert(1)">'],
    });

    expect(screen.getByText("Otros mensajes de la validación")).toBeTruthy();
    expect(
      screen.getByText('<img src="x" onerror="alert(1)">')
    ).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });
});
