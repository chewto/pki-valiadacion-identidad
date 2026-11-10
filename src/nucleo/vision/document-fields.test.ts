import { describe, expect, it } from "vitest";
import {
  hasRequiredFieldValues,
  isCamposCompleto,
  mapFieldsFromValidationResponse,
  mergeCampos,
} from "./document-fields";
import { getGuideProfile } from "./document-model.config";

describe("document-fields", () => {
  it("mapea OCR y MRZ a los campos de la UI", () => {
    const fields = mapFieldsFromValidationResponse({
      ocr: {
        data: { name: "ANA MARIA", lastName: "PEREZ", ID: "12345678" },
      },
      mrz: {
        extractedData: {
          dateOfBirth: "1990-01-01",
          expirationDate: "2030-01-01",
          nationality: "COL",
        },
      },
    });

    expect(fields).toMatchObject({
      nombre: "ANA MARIA",
      apellido: "PEREZ",
      documento: "12345678",
      fechaNacimiento: "1990-01-01",
      fechaExpiracion: "2030-01-01",
      nacionalidad: "COL",
      completado: true,
      origen: "ocr",
    });
  });

  it("conserva correcciones manuales al mezclar una nueva respuesta", () => {
    const merged = mergeCampos(
      {
        nombre: "ANA",
        apellido: "PEREZ",
        documento: "123",
        origen: "manual",
        completado: true,
      },
      {
        nombre: "OTRO",
        apellido: "NOMBRE",
        documento: "999",
        origen: "ocr",
        completado: true,
      }
    );

    expect(merged).toMatchObject({
      nombre: "ANA",
      apellido: "PEREZ",
      documento: "123",
      origen: "manual",
    });
  });

  it("valida completitud y campos requeridos del perfil", () => {
    expect(
      isCamposCompleto({ nombre: "A", apellido: "B", documento: "1" })
    ).toBe(true);
    expect(
      isCamposCompleto({ nombre: "", apellido: "B", documento: "1" })
    ).toBe(false);

    const profile = getGuideProfile("COL", "CEDULA DE CIUDADANIA", "anverso");
    expect(
      hasRequiredFieldValues(
        {
          nombre: "ANA",
          apellido: "PEREZ",
          documento: "123",
          origen: "ocr",
          completado: true,
        },
        profile
      )
    ).toBe(true);
  });
});
