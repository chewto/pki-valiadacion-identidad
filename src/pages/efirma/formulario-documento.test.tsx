import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import informacionReducer from "@nucleo/redux/slices/informacionSlice";
import firmadorReducer from "@nucleo/redux/slices/firmadorSlice";
import validacionDocumentoReducer from "@nucleo/redux/slices/validacionDocumentoSlice";
import validacionCBReducer from "@nucleo/redux/slices/validacionCB";
import pruebaVidaReducer from "@nucleo/redux/slices/pruebaVidaSlice";
import timerReducer from "@nucleo/redux/slices/timerSlice";
import { FormularioDocumento } from "./formulario-documento";

const { axiosPost, apiPost } = vi.hoisted(() => ({
  axiosPost: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("axios", () => ({
  default: { post: axiosPost },
}));

vi.mock("@nucleo/api-urls/api", () => ({
  default: { post: apiPost },
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const createFile = () =>
  new File(["fake-image"], "documento.jpg", { type: "image/jpeg" });

const buildStore = () =>
  configureStore({
    reducer: {
      informacion: informacionReducer,
      firmador: firmadorReducer,
      validacionDocumento: validacionDocumentoReducer,
      cb: validacionCBReducer,
      pruebaVida: pruebaVidaReducer,
      timer: timerReducer,
    },
  });

const renderFormulario = () =>
  render(
    <Provider store={buildStore()}>
      <FormularioDocumento
        id={1}
        tipoDocumento="CEDULA DE CIUDADANIA"
        preview=""
        continuarBoton={false}
        setContinuarBoton={vi.fn()}
        ladoDocumento="anverso"
        useModel
        tries={5}
        detectionTries={3}
        attendance=""
        setMainCounter={vi.fn()}
        nextStep={vi.fn()}
        returnStep={vi.fn()}
      />
    </Provider>
  );

const fileInputFrom = (container: HTMLElement) => {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("No se encontró el input de archivo");
  return input;
};

const mockDocumentRequests = (
  firstValidation: Deferred<never>,
  secondValidation: Deferred<never>
) => {
  let validationCalls = 0;

  apiPost.mockImplementation((url: string) => {
    if (url.includes("/document/detection")) {
      return Promise.resolve({ data: { documentoValido: true } });
    }
    if (url.includes("/document/front")) {
      validationCalls += 1;
      return validationCalls === 1
        ? firstValidation.promise
        : secondValidation.promise;
    }
    return Promise.reject(new Error(`URL inesperada: ${url}`));
  });

  return {
    getValidationCalls: () => validationCalls,
  };
};

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState: number = MockWebSocket.CONNECTING;
  closed = false;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  emit(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  close() {
    this.closed = true;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event("close"));
  }

  send() {
    // Sin efecto: los eventos se emiten desde el test.
  }
}

class MockImage {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

const canvasContext = {
  imageSmoothingEnabled: false,
  imageSmoothingQuality: "low",
  drawImage: vi.fn(),
} as unknown as CanvasRenderingContext2D;

beforeEach(() => {
  axiosPost.mockReset();
  apiPost.mockReset();
  axiosPost.mockResolvedValue({ data: {} });
  MockWebSocket.instances = [];

  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("Image", MockImage);
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => canvasContext
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => "data:image/jpeg;base64,AAAA"
  ) as typeof HTMLCanvasElement.prototype.toDataURL;

  URL.createObjectURL = vi.fn(() => "blob:documento");
  URL.revokeObjectURL = vi.fn();

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FormularioDocumento - progreso al reintentar", () => {
  it("vuelve a mostrar los pasos en curso al reintentar tras un error", async () => {
    const firstValidation = createDeferred<never>();
    const secondValidation = createDeferred<never>();
    const requests = mockDocumentRequests(firstValidation, secondValidation);

    let ocrGate: Deferred<unknown> | null = null;
    axiosPost.mockImplementation((url: string) => {
      if (ocrGate && url.includes("/ocr")) {
        return ocrGate.promise;
      }
      return Promise.resolve({ data: {} });
    });

    const { container } = renderFormulario();
    fireEvent.change(fileInputFrom(container), {
      target: { files: [createFile()] },
    });

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining("/document/front"),
        expect.anything()
      )
    );
    firstValidation.reject(new Error("fallo simulado de red"));

    const retryButton = await screen.findByRole("button", {
      name: "Reintentar",
    });

    // Bloquea el OCR del segundo intento para comprobar que los pasos
    // anteriores vuelven a "en curso" en lugar de conservar checks viejos.
    const retryOcr = createDeferred<unknown>();
    ocrGate = retryOcr;

    fireEvent.click(retryButton);

    expect(await screen.findByLabelText("Alineando documento")).toBeTruthy();
    expect(
      screen.getByLabelText("Identificando tipo de documento")
    ).toBeTruthy();
    expect(screen.getByLabelText("Procesando documento")).toBeTruthy();
    expect(
      screen.getByText(/Estamos verificando tu identidad/)
    ).toBeTruthy();
    expect(
      screen.queryByText(/No pudimos verificar el documento/)
    ).toBeNull();

    retryOcr.resolve({ data: {} });
    ocrGate = null;

    await waitFor(() => expect(requests.getValidationCalls()).toBe(2));
    secondValidation.reject(new Error("fallo simulado de red"));

    expect(
      await screen.findByText(/No pudimos verificar el documento/)
    ).toBeTruthy();
  });

  it("reinicia el progreso al volver a capturar y subir otro archivo", async () => {
    const firstValidation = createDeferred<never>();
    const secondValidation = createDeferred<never>();
    const requests = mockDocumentRequests(firstValidation, secondValidation);

    let ocrGate: Deferred<unknown> | null = null;
    axiosPost.mockImplementation((url: string) => {
      if (ocrGate && url.includes("/ocr")) {
        return ocrGate.promise;
      }
      return Promise.resolve({ data: {} });
    });

    const { container } = renderFormulario();
    fireEvent.change(fileInputFrom(container), {
      target: { files: [createFile()] },
    });

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining("/document/front"),
        expect.anything()
      )
    );
    firstValidation.reject(new Error("fallo simulado de red"));

    const recaptureButton = await screen.findByRole("button", {
      name: "Volver a capturar documento",
    });

    const retryOcr = createDeferred<unknown>();
    ocrGate = retryOcr;

    fireEvent.click(recaptureButton);
    fireEvent.change(fileInputFrom(container), {
      target: { files: [createFile()] },
    });

    expect(await screen.findByLabelText("Alineando documento")).toBeTruthy();
    expect(
      screen.getByLabelText("Identificando tipo de documento")
    ).toBeTruthy();
    expect(screen.getByLabelText("Procesando documento")).toBeTruthy();

    retryOcr.resolve({ data: {} });
    ocrGate = null;

    await waitFor(() => expect(requests.getValidationCalls()).toBe(2));
    secondValidation.reject(new Error("fallo simulado de red"));

    expect(
      await screen.findByText(/No pudimos verificar el documento/)
    ).toBeTruthy();
  });
});

describe("FormularioDocumento - progreso WebSocket OCR", () => {
  it("abre el socket antes del POST, refleja los pasos y lo cierra al completar", async () => {
    const validation = createDeferred<never>();
    let socketExistedBeforeValidation = false;

    apiPost.mockImplementation((url: string) => {
      if (url.includes("/document/detection")) {
        return Promise.resolve({ data: { documentoValido: true } });
      }
      if (url.includes("/document/front")) {
        socketExistedBeforeValidation = MockWebSocket.instances.length > 0;
        return validation.promise;
      }
      return Promise.reject(new Error(`URL inesperada: ${url}`));
    });

    const { container } = renderFormulario();
    fireEvent.change(fileInputFrom(container), {
      target: { files: [createFile()] },
    });

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining("/document/front"),
        expect.anything()
      )
    );

    expect(socketExistedBeforeValidation).toBe(true);
    const socket = MockWebSocket.instances[0];
    expect(socket).toBeTruthy();
    expect(socket.url).not.toContain("0.0.0.0");
    expect(socket.url).toMatch(/\/ws\/1$/);

    socket.open();
    socket.emit({
      efirma_id: "1",
      step: "start",
      message: "Iniciando verificación...",
      status: "processing",
      timestamp: Date.now(),
    });

    expect(await screen.findByText("Iniciando verificación...")).toBeTruthy();
    const progressBar = screen.getByRole("progressbar", {
      name: "Progreso de verificación del documento",
    });
    await waitFor(() =>
      expect(progressBar.getAttribute("aria-valuenow")).toBe("10")
    );

    socket.emit({
      efirma_id: "1",
      step: "face_detection",
      message: "Detectando rostro en el documento...",
      status: "processing",
      timestamp: Date.now(),
    });
    expect(
      await screen.findByText("Detectando rostro en el documento...")
    ).toBeTruthy();
    await waitFor(() =>
      expect(progressBar.getAttribute("aria-valuenow")).toBe("25")
    );

    socket.emit({
      efirma_id: "1",
      step: "mrz",
      message: "Leyendo y validando zona MRZ...",
      status: "processing",
      timestamp: Date.now(),
    });
    await waitFor(() =>
      expect(progressBar.getAttribute("aria-valuenow")).toBe("90")
    );

    socket.emit({
      efirma_id: "1",
      step: "completed",
      message: "Verificación finalizada",
      status: "success",
      timestamp: Date.now(),
      extra: { validSide: true, side: "anverso" },
    });

    expect(await screen.findByText("Verificación finalizada")).toBeTruthy();
    await waitFor(() => {
      expect(progressBar.getAttribute("aria-valuenow")).toBe("100");
      expect(socket.closed).toBe(true);
    });

    // El cierre del socket no altera el resultado final de la petición HTTP.
    validation.reject(new Error("fallo simulado de red"));
    expect(
      await screen.findByText(/No pudimos verificar el documento/)
    ).toBeTruthy();
  });

  it("mantiene la validación HTTP y el loader genérico si el WebSocket no se puede crear", async () => {
    const validation = createDeferred<never>();

    apiPost.mockImplementation((url: string) => {
      if (url.includes("/document/detection")) {
        return Promise.resolve({ data: { documentoValido: true } });
      }
      if (url.includes("/document/front")) {
        return validation.promise;
      }
      return Promise.reject(new Error(`URL inesperada: ${url}`));
    });

    class UnavailableWebSocket {
      constructor() {
        throw new Error("WebSocket bloqueado para la prueba");
      }
    }

    vi.stubGlobal("WebSocket", UnavailableWebSocket);

    const { container } = renderFormulario();
    fireEvent.change(fileInputFrom(container), {
      target: { files: [createFile()] },
    });

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining("/document/front"),
        expect.anything()
      )
    );

    expect(
      await screen.findByText(/Estamos verificando tu identidad/)
    ).toBeTruthy();
    expect(
      screen
        .getByRole("progressbar", {
          name: "Progreso de verificación del documento",
        })
        .getAttribute("aria-valuenow")
    ).toBeNull();
    expect(
      screen.queryByText(/No pudimos verificar el documento/)
    ).toBeNull();

    validation.reject(new Error("fallo simulado de red"));
    expect(
      await screen.findByText(/No pudimos verificar el documento/)
    ).toBeTruthy();
  });
});
