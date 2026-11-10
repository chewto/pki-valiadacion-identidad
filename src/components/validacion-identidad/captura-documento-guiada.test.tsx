import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CapturaDocumentoGuiada } from "./captura-documento-guiada";

const renderGuide = (onFallback = vi.fn()) =>
  render(
    <CapturaDocumentoGuiada
      active
      country="COL"
      tipoDocumento="CEDULA DE CIUDADANIA"
      lado="anverso"
      onCapture={vi.fn()}
      onFallback={onFallback}
    />
  );

describe("CapturaDocumentoGuiada", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, "", "/?guia=1");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
    sessionStorage.clear();
  });

  it("muestra el consentimiento antes de descargar el modelo", () => {
    renderGuide();
    expect(
      screen.getByText(/Guía con IA para colocar el documento/)
    ).toBeTruthy();
    expect(screen.getByText(/~77 MB/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Activar guía" })).toBeTruthy();
  });

  it("permite continuar con la captura normal sin descargar el modelo", () => {
    const onFallback = vi.fn();
    renderGuide(onFallback);
    fireEvent.click(
      screen.getByRole("button", { name: "Usar cámara normal" })
    );
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it("informa cuando el navegador no soporta la guía", async () => {
    renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "Activar guía" }));

    expect(
      await screen.findByText(/No pudimos iniciar la guía/)
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Usar captura normal" })
    ).toBeTruthy();
  });
});
