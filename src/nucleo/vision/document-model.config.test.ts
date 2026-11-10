import { describe, expect, it } from "vitest";
import {
  COLOMBIA_LABELS,
  HONDURAS_LABELS,
  getCountryModelFile,
  getGuideProfile,
  getModelUrl,
  toModelResolveUrl,
} from "./document-model.config";

describe("document-model.config", () => {
  it("convierte enlaces blob de Hugging Face a resolve", () => {
    expect(
      toModelResolveUrl(
        "https://huggingface.co/chuito1503/noaexport-modelos/blob/main/colombia-v0.1.onnx"
      )
    ).toBe(
      "https://huggingface.co/chuito1503/noaexport-modelos/resolve/main/colombia-v0.1.onnx"
    );
  });

  it("expone los modelos por país", () => {
    expect(getCountryModelFile("COL")?.fileName).toBe("colombia-v0.1.onnx");
    expect(getCountryModelFile("HND")?.fileName).toBe("honduras-v0.1.onnx");
    expect(getCountryModelFile("PER")).toBeNull();
    expect(getModelUrl("COL")).toContain("colombia-v0.1.onnx");
  });

  it("mantiene los labels alineados con los ONNX", () => {
    expect(COLOMBIA_LABELS).toHaveLength(33);
    expect(HONDURAS_LABELS).toHaveLength(18);
    expect(COLOMBIA_LABELS).toContain("CEDULA_DIGITAL_FRONTAL");
    expect(HONDURAS_LABELS).toContain("dni_reverso");
  });

  it("resuelve perfiles de guía por país, tipo y lado", () => {
    const colombia = getGuideProfile(
      "COL",
      "CEDULA DE CIUDADANIA",
      "anverso"
    );
    expect(colombia?.containers).toContain("CEDULA_DIGITAL_FRONTAL");
    expect(colombia?.required).toContain("NUMERO_DOCUMENTO");

    const honduras = getGuideProfile("HND", "DNI", "reverso");
    expect(honduras?.containers).toEqual(["dni_reverso"]);

    expect(getGuideProfile("HND", "PASAPORTE", "anverso")).toBeNull();
  });
});
