import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CapturaDocumentoGuiada } from "./captura-documento-guiada";

const mocks = vi.hoisted(() => ({
  vision: {
    country: "COL" as string | null,
    phase: "downloading" as string,
    progress: 0.42,
    error: null as string | null,
    provider: null as string | null,
  },
  guide: {
    phase: "loading" as string,
    guide: null as unknown,
    checklist: [] as unknown[],
    provider: null as string | null,
    error: null as string | null,
    inferenceMs: null as number | null,
    videoRef: { current: null as HTMLVideoElement | null },
    captureNow: vi.fn(),
    retry: vi.fn(),
  },
}));

vi.mock("@nucleo/hooks/use-document-vision", () => ({
  useDocumentVision: () => mocks.vision,
}));

vi.mock("@nucleo/hooks/use-document-guide", () => ({
  useDocumentGuide: () => mocks.guide,
}));

const renderGuide = (options: { detectionOnly?: boolean } = {}) =>
  render(
    <CapturaDocumentoGuiada
      country="COL"
      tipoDocumento="CEDULA DE CIUDADANIA"
      lado="anverso"
      onCapture={vi.fn()}
      detectionOnly={options.detectionOnly}
    />
  );

const runGuideMocks = () => {
  mocks.vision.phase = "ready";
  mocks.vision.progress = 1;
  mocks.guide.phase = "running";
  mocks.guide.guide = {
    code: "ready",
    message: "Documento listo",
    hint: "Mantén el documento quieto",
    canCapture: true,
    missing: [],
    detectedLabels: ["NOMBRES"],
    containerBoxes: [],
  };
  mocks.guide.checklist = [
    {
      label: "NOMBRES",
      displayName: "Nombres",
      detected: true,
      required: true,
    },
  ];
  mocks.guide.provider = "wasm";
  mocks.guide.inferenceMs = 42;
};

const modelProgressBar = () =>
  screen.queryByRole("progressbar", {
    name: "Carga del modelo de documentos",
  });

describe("CapturaDocumentoGuiada", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/?guia=1");
    mocks.vision.phase = "downloading";
    mocks.vision.progress = 0.42;
    mocks.vision.error = null;
    mocks.guide.phase = "loading";
    mocks.guide.error = null;
    mocks.guide.guide = null;
    mocks.guide.checklist = [];
    mocks.guide.provider = null;
    mocks.guide.inferenceMs = null;
    mocks.guide.retry.mockReset();
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("muestra la barra de descarga sin pantalla de consentimiento", () => {
    renderGuide();

    expect(screen.getByText("Descargando el modelo...")).toBeTruthy();
    expect(screen.getByText(/~77 MB/)).toBeTruthy();

    const progressBar = modelProgressBar();
    expect(progressBar).toBeTruthy();
    expect(progressBar?.getAttribute("aria-valuenow")).toBe("42");

    expect(screen.queryByText(/Guía con IA para colocar el documento/)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Activar guía" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Usar cámara normal" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Prefiero la cámara normal" })
    ).toBeNull();
  });

  it("informa cuando el modelo ya se descargó y se está inicializando", () => {
    mocks.vision.phase = "initializing";
    renderGuide();

    expect(screen.getByText("Preparando el motor de visión...")).toBeTruthy();
    expect(
      screen.getByText(/El modelo ya está descargado/)
    ).toBeTruthy();
    expect(modelProgressBar()?.getAttribute("aria-valuenow")).toBeNull();
  });

  it("bloquea el paso ante un error y solo ofrece reintentar", () => {
    mocks.vision.phase = "error";
    mocks.vision.error = "No pudimos abrir la cámara.";
    mocks.guide.phase = "error";
    mocks.guide.error = "No pudimos abrir la cámara.";

    renderGuide();

    expect(screen.getByText("No pudimos iniciar la guía")).toBeTruthy();
    expect(screen.getByText("No pudimos abrir la cámara.")).toBeTruthy();

    const retryButton = screen.getByRole("button", { name: "Reintentar" });
    fireEvent.click(retryButton);
    expect(mocks.guide.retry).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole("button", { name: "Usar captura normal" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Prefiero la cámara normal" })
    ).toBeNull();
  });

  it("muestra checklist, captura manual y datos del motor en el modo completo", () => {
    runGuideMocks();
    renderGuide();

    expect(screen.getByLabelText("Campos detectados")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Capturar ahora" })
    ).toBeTruthy();
    expect(screen.getByText("Motor: wasm · 42 ms/frame")).toBeTruthy();
  });

  it("con detectionOnly deja solo la cámara, la guía y los estados", () => {
    runGuideMocks();
    const { container } = renderGuide({ detectionOnly: true });

    expect(container.querySelector("video")).toBeTruthy();
    expect(screen.getByText("Documento listo")).toBeTruthy();
    expect(screen.getByText("Mantén el documento quieto")).toBeTruthy();

    expect(screen.queryByLabelText("Campos detectados")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Capturar ahora" })
    ).toBeNull();
    expect(screen.queryByText(/Motor:/)).toBeNull();
  });

  it("mantiene el error y el reintento con detectionOnly", () => {
    mocks.vision.phase = "error";
    mocks.guide.phase = "error";
    mocks.guide.error = "No pudimos abrir la cámara.";

    renderGuide({ detectionOnly: true });

    expect(screen.getByText("No pudimos iniciar la guía")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Reintentar" })
    ).toBeTruthy();
  });
});
