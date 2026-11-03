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
    await waitFor(() =>
      expect(screen.queryByText(/Tiempo transcurrido:/)).toBeNull()
    );

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
    expect(screen.getByText(/Tiempo transcurrido:/)).toBeTruthy();
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

    await waitFor(() =>
      expect(screen.queryByText(/Tiempo transcurrido:/)).toBeNull()
    );
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
    await waitFor(() =>
      expect(screen.queryByText(/Tiempo transcurrido:/)).toBeNull()
    );

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
    expect(screen.getByText(/Tiempo transcurrido:/)).toBeTruthy();

    retryOcr.resolve({ data: {} });
    ocrGate = null;

    await waitFor(() => expect(requests.getValidationCalls()).toBe(2));
    secondValidation.reject(new Error("fallo simulado de red"));

    await waitFor(() =>
      expect(screen.queryByText(/Tiempo transcurrido:/)).toBeNull()
    );
    expect(
      await screen.findByText(/No pudimos verificar el documento/)
    ).toBeTruthy();
  });
});
