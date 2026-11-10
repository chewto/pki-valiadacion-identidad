import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentDetection } from "@nucleo/vision/document-postprocess";

const detection: DocumentDetection = {
  classId: 3,
  label: "NOMBRES",
  score: 0.91,
  box: { x1: 10, y1: 20, x2: 210, y2: 120 },
};

const { readerState, useDocumentReaderMock } = vi.hoisted(() => {
  const state = {
    phase: "running",
    progress: 1,
    provider: "webgpu",
    error: null as string | null,
    detections: [] as DocumentDetection[],
    crops: [] as Array<{
      id: string;
      label: string;
      score: number;
      box: { x1: number; y1: number; x2: number; y2: number };
      dataUrl: string;
      width: number;
      height: number;
    }>,
    quality: null,
    inferenceMs: 120,
    frameSize: null,
    cameraStatus: "ready",
    cameraError: null as string | null,
    videoRef: { current: null },
    retry: vi.fn(),
    clear: vi.fn(),
  };
  return {
    readerState: state,
    useDocumentReaderMock: vi.fn(() => state),
  };
});

vi.mock("@nucleo/hooks/use-document-reader", () => ({
  useDocumentReader: useDocumentReaderMock,
}));

import TestLectorDocumentos from "./test-lector-documentos";

const resetState = () => {
  readerState.phase = "running";
  readerState.progress = 1;
  readerState.provider = "webgpu";
  readerState.error = null;
  readerState.detections = [];
  readerState.crops = [];
  readerState.inferenceMs = 120;
  readerState.cameraError = null;
  readerState.retry.mockClear();
  readerState.clear.mockClear();
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <TestLectorDocumentos />
    </MemoryRouter>
  );

describe("TestLectorDocumentos", () => {
  beforeEach(() => {
    resetState();
    useDocumentReaderMock.mockClear();
  });

  it("permite elegir el modelo de Colombia o Honduras", () => {
    renderPage();

    const select = screen.getByLabelText("Modelo") as HTMLSelectElement;
    expect(select.value).toBe("COL");
    expect(screen.getByText("Colombia · 33 clases")).toBeTruthy();
    expect(screen.getByText("Honduras · 18 clases")).toBeTruthy();

    fireEvent.change(select, { target: { value: "HND" } });

    expect(select.value).toBe("HND");
    const calls = useDocumentReaderMock.mock
      .calls as unknown as Array<[{ country: string }]>;
    expect(calls.at(-1)?.[0].country).toBe("HND");
  });

  it("muestra la tabla de detecciones y los recortes descargables", () => {
    readerState.detections = [detection];
    readerState.crops = [
      {
        id: "NOMBRES-0",
        label: "NOMBRES",
        score: 0.91,
        box: detection.box,
        dataUrl: "data:image/jpeg;base64,AAAA",
        width: 200,
        height: 100,
      },
    ];

    renderPage();

    expect(screen.getAllByText("NOMBRES").length).toBeGreaterThan(0);
    expect(screen.getAllByText("91%").length).toBeGreaterThan(0);
    expect(screen.getByAltText("Recorte NOMBRES")).toBeTruthy();

    const download = screen.getByRole("link", { name: "Descargar" });
    expect(download.getAttribute("href")).toBe(
      "data:image/jpeg;base64,AAAA"
    );
    expect(download.getAttribute("download")).toBe("NOMBRES-1.jpg");
  });

  it("muestra el error y permite reintentar", () => {
    readerState.phase = "error";
    readerState.error = "No se pudo cargar el modelo.";

    renderPage();

    expect(screen.getByRole("alert").textContent).toContain(
      "No se pudo cargar el modelo."
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(readerState.retry).toHaveBeenCalledTimes(1);
  });
});
