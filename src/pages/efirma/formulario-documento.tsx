/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import "@styles/styles.css";
import "@styles/selfie-movil.component.css";
import "@styles/formulario-style.component.css";
import { Previsualizacion } from "@components/ui/previsualizacion";
import { useMobile } from "../../nucleo/hooks/useMobile";
import { useDispatch, useSelector } from "react-redux";
import { setFotos } from "../../nucleo/redux/slices/informacionSlice";
import { RootState } from "../../nucleo/redux/store";
import axios from "axios";
import {
  setValidacionOCR,
  setValidacionCodigoBarras,
  setValidacionMRZ,
  setValidacionRostro,
  setFrontSide,
  setBackSide,
  setFrontResult,
  setBackResult,
  setFrontDetection,
  setBackDetection,
  setCamposDocumento,
  clearCamposDocumento,
} from "../../nucleo/redux/slices/validacionDocumentoSlice";
import { Alert, Spinner } from "reactstrap";
import "react-html5-camera-photo/build/css/index.css";
import { URLS } from "../../nucleo/api-urls/urls";
import { getCountry } from "../../nucleo/hooks/useCountry";
import { imagePlaceholder } from "@components/dataurl";
import { Advertencia } from "@components/ui/advertencia";
import SuccessStep from "@components/ui/success-step";
import { setBackTime, setFrontTime } from "@nucleo/redux/slices/timerSlice";
import api from "@nucleo/api-urls/api";
import type {
  CamposDocumento,
  ValidationFeedback,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { normalizeValidationFeedback, shouldAutoAdvanceAfterValidation } from "../../nucleo/services/validation-feedback.service";
import { ValidationFeedbackPanel } from "../../components/ui/validation-feedback-panel";
import { CapturaDocumentoGuiada } from "../../components/validacion-identidad/captura-documento-guiada";
import { CamposDocumentoPanel } from "../../components/validacion-identidad/campos-documento-panel";
import {
  getGuideProfile,
  isDocumentGuideEnabled,
} from "../../nucleo/vision/document-model.config";
import type { GuideSide } from "../../nucleo/vision/document-model.config";
import {
  hasRequiredFieldValues,
  mapFieldsFromValidationResponse,
  mergeCampos,
} from "../../nucleo/vision/document-fields";
import { useValidationWebSocket } from "../../nucleo/hooks/useValidationWebSocket";
import { getOcrStepProgress } from "../../nucleo/constants/ocr-progress";
// import Camera from '@pages/efirma/nueva-camara'


const normalizeTipoDocumento = (doc?: string): string => {
  if (!doc) return "";
  return doc
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
};

const loadingMessages = [
  "Estamos verificando tu identidad, por favor espera un momento...",
  "Analizando el documento, esto tomará solo unos segundos.",
  "Extrayendo la información, por favor no cierres esta ventana.",
  "Comprobando la autenticidad del documento.",
  "Leyendo datos como nombre, número de documento y fecha de nacimiento.",
  "Comparando la información extraída con nuestros registros.",
  "Verificando la calidad de la imagen del documento.",
  "Asegurándonos de que el documento esté vigente y legible.",
  "Casi terminamos, estamos haciendo las últimas comprobaciones.",
];

const FEEDBACK_AUTO_ADVANCE_MS = 2000;

type RequestStatus = {
  loading: boolean;
  error: boolean;
  success: boolean | null;
};

const createRequestStatus = (): RequestStatus => ({
  loading: true,
  error: false,
  success: null,
});

const requestSucceeded = (): RequestStatus => ({
  loading: false,
  error: false,
  success: true,
});

const requestFailed = (): RequestStatus => ({
  loading: false,
  error: true,
  success: false,
});

interface Props {
  id: string | number | null | undefined;
  tipoDocumento: string;
  preview: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  ladoDocumento: string;
  tries: number;
  detectionTries: number;
  attendance: string;
  useModel: boolean;
  setMainCounter: Dispatch<SetStateAction<number>>;
  nextStep: () => void;
  returnStep: () => void | null;
}

export const FormularioDocumento: React.FC<Props> = ({
  id,
  tipoDocumento,
  preview,
  continuarBoton,
  setContinuarBoton,
  ladoDocumento,
  useModel,
  tries,
  detectionTries,
  setMainCounter,
  nextStep,
  // returnStep
}) => {
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const informacion = useSelector((state: RootState) => state.informacion);
  const validacionDocumento = useSelector(
    (state: RootState) => state.validacionDocumento,
  );
  const pruebaVida = useSelector((state: RootState) => state.pruebaVida);
  const times = useSelector((state: RootState) => state.timer);
  const dispatch = useDispatch();

  const {
    progress: ocrProgress,
    connect: connectOcrProgress,
    disconnect: disconnectOcrProgress,
    resetProgress: resetOcrProgress,
  } = useValidationWebSocket({ efirmaId: id });

  const passport = "PASAPORTE";

  const placeholder = ladoDocumento === "anverso" ? "frontal" : "reverso";

  const tipoDocumentoNormalizado = normalizeTipoDocumento(
    tipoDocumento || informacionFirmador.tipoDocumento || informacion.tipoDocumento
  );

  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(1);
  const publicPath =
    "./svg/prod/" +
    `${placeholder}_${tipoDocumentoNormalizado.toLowerCase().replace(/ /g, "_")}.svg`;
  console.log(publicPath)
  // const [detectCount, setDetectCount] = useState<number>(1)
  const [triesCounter, setTriesCounter] = useState<number>(tries);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [isCorrupted, setIsCorrupted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<ValidationFeedback | null>(null);
  const [retry, setRetry] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const [seconds, setSeconds] = useState<number>(5);
  const [disabled, setDisabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPayloadRef = useRef<any>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Evita que dos intentos de validación se ejecuten en paralelo.
  const inFlightRef = useRef(false);
  // Identifica el intento actual para no pisar el estado de uno más nuevo.
  const attemptIdRef = useRef(0);
  const feedbackId = "document-validation-feedback";

  const [guideActive, setGuideActive] = useState<boolean>(() =>
    isDocumentGuideEnabled()
  );
  const [guideSessionKey, setGuideSessionKey] = useState<number>(0);
  const [guideFallbackReason, setGuideFallbackReason] = useState<string | null>(
    null
  );
  const camposDocumento = useSelector(
    (state: RootState) => state.validacionDocumento.campos
  );

  const guideSide: GuideSide =
    ladoDocumento === "reverso" ? "reverso" : "anverso";
  const countryCode = getCountry();
  const guideProfile = useMemo(
    () =>
      getGuideProfile(
        countryCode,
        tipoDocumentoNormalizado,
        guideSide
      ),
    [countryCode, tipoDocumentoNormalizado, guideSide]
  );
  const guidePossible = guideActive && guideProfile !== null;

  useEffect(() => {
    // Si el modal no está visible, reseteamos todo y no ejecutamos el timer
    if (!showModal) {
      setSeconds(5);
      setDisabled(true);
      return;
    }

    // Si el modal está abierto y aún hay segundos, ejecutamos el intervalo
    if (seconds > 0) {
      const timer = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);

      // Limpieza del intervalo
      return () => clearInterval(timer);
    } else {
      // Cuando llega a 0, habilitamos el botón
      setDisabled(false);
    }
  }, [showModal, seconds]);

  const [ocrReq, setOcrReq] = useState<RequestStatus>(createRequestStatus());
  const [detectionReq, setDetectionReq] = useState<RequestStatus & { data: any }>({
    ...createRequestStatus(),
    data: {},
  });
  const [validationReq, setValidationReq] = useState<RequestStatus>(
    createRequestStatus()
  );

  const resetRequestStatuses = () => {
    setOcrReq(createRequestStatus());
    setDetectionReq({ ...createRequestStatus(), data: {} });
    setValidationReq(createRequestStatus());
  };

  const mobile: boolean = useMobile();

  const [horizontal, setHorizontal] = useState<boolean>(false);

  const DOCUMENT_MAPPING = {
    DNI: "DNI",
    "CEDULA DE CIUDADANIA": "CEDULA_CIUDADANIA",
    "CEDULA DE EXTRANJERIA": "CEDULA_EXTRANJERIA",
    "CEDULA DIGITAL": "CEDULA_DIGITAL",
    PASAPORTE: "PASAPORTE",
  } as const;
  type DocumentType = keyof typeof DOCUMENT_MAPPING;

  const conversor = (document: string) => {
    return DOCUMENT_MAPPING[document as DocumentType];
  };

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [ocrPercent, setOcrPercent] = useState(0);

  // Ignora eventos de la otra cara del documento en la misma sala.
  const visibleOcrProgress =
    ocrProgress &&
    (!ocrProgress.extra?.side || ocrProgress.extra.side === ladoDocumento)
      ? ocrProgress
      : null;

  useEffect(() => {
    if (!visibleOcrProgress) return;

    // El porcentaje nunca retrocede aunque los pasos lleguen desordenados.
    setOcrPercent((prev) =>
      Math.max(prev, getOcrStepProgress(visibleOcrProgress.step))
    );

    // La verificación terminó: no hay razón para mantener el socket abierto.
    if (visibleOcrProgress.step === "completed") {
      disconnectOcrProgress();
    }
  }, [visibleOcrProgress, disconnectOcrProgress]);

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return;
    }

    setLoadingMessageIndex(0);


    const messageTimer = setInterval(() => {
      setLoadingMessageIndex((prev) =>
        prev < loadingMessages.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    return () => {
      clearInterval(messageTimer);
    };
  }, [loading]);

  const verificarOrientacion = () => {
    if (window.matchMedia("(orientation: landscape)").matches) {
      setHorizontal(true);
    } else {
      setHorizontal(false);
    }
  };

  useEffect(() => {
    window.addEventListener("orientationchange", verificarOrientacion);
    window.addEventListener("resize", verificarOrientacion);
    verificarOrientacion();
    return () => {
      window.removeEventListener("orientationchange", verificarOrientacion);
      window.removeEventListener("resize", verificarOrientacion);
    };
  }, []);

  useEffect(() => {
    if (preview.length <= 0) {
      setContinuarBoton(false);
    }

    if (!mostrarPreview) {
      setMostrarPreview(true);
    }
  }, [
    conteo,
    setContinuarBoton,
    preview.length,
    tipoDocumento,
    validacionDocumento.face,
    mostrarPreview,
  ]);

  useEffect(() => {
    if (ladoDocumento === "reverso" && tipoDocumento === passport) {
      dispatch(setFotos({ labelFoto: ladoDocumento, data: imagePlaceholder }));
      setContinuarBoton(true);
    }
  }, [ladoDocumento, tipoDocumento, setContinuarBoton, dispatch]);

  useEffect(() => {
    // setConteo(1);
    setSuccess(false);
    setFeedback(null);
    setError(false);
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, [ladoDocumento]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  const clearPendingAutoAdvance = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  };

  const scheduleAutoAdvance = () => {
    clearPendingAutoAdvance();
    autoAdvanceTimerRef.current = setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      if (ladoDocumento === "reverso") {
        setContinuarBoton(true);
      }
      nextStep();
    }, FEEDBACK_AUTO_ADVANCE_MS);
  };

  /**
   * Deja la UI en estado "procesando" antes de cualquier espera.
   * Debe ejecutarse al inicio de cada intento para que un reintento no
   * reutilice los checks/errores del intento anterior.
   */
  const beginAttempt = () => {
    attemptIdRef.current += 1;
    clearPendingAutoAdvance();
    disconnectOcrProgress();
    resetOcrProgress();
    setOcrPercent(0);
    resetRequestStatuses();
    setLoading(true);
    setContinuarBoton(false);
    setRetry(false);
    setIsCorrupted(false);
    setFeedback(null);
    setError(false);
    setSuccess(false);
    return attemptIdRef.current;
  };

  const procesarImagenDocumento = (dataURLImage: string) => {
    if (inFlightRef.current) return;

    if (dataURLImage.length <= 10) {
      setIsCorrupted(true);
      setLoading(false);
      return;
    }

    dispatch(setFotos({ labelFoto: ladoDocumento, data: dataURLImage }));

    const data = {
      id: id,
      imagen: dataURLImage,
      nombre: informacionFirmador.nombre ?? validacionDocumento.ocr.data.name,
      apellido: informacionFirmador.apellido ?? validacionDocumento.ocr.data.lastName,
      documento: informacionFirmador.documento ?? validacionDocumento.ocr.data.ID,
      ladoDocumento,
      tipoDocumento: tipoDocumentoNormalizado,
      imagenPersona: informacion.foto_persona,
      country: informacionFirmador.pais,
      tries: conteo,
      allFrames: ladoDocumento === "anverso" ? pruebaVida.allFrames : [],
    };

    void validarDocumento(data);
  };

  const handleGuidedCapture = (dataUrl: string) => {
    if (loading || inFlightRef.current) return;
    setGuideFallbackReason(null);
    procesarImagenDocumento(dataUrl);
  };

  const handleGuideFallback = (reason?: string) => {
    setGuideActive(false);
    setGuideFallbackReason(reason ?? null);
  };

  const handleCamposConfirm = (campos: CamposDocumento) => {
    clearPendingAutoAdvance();
    dispatch(setCamposDocumento(campos));
    setFeedback(null);

    if (ladoDocumento === "reverso") {
      setContinuarBoton(true);
    }
    nextStep();
  };

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    // Bloqueamos inmediatamente para evitar múltiples clicks/procesos
    beginAttempt();

    const objectUrl = URL.createObjectURL(archivo);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");

        // Límite de resolución razonable para eKYC
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH * height) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: false }); // Deshabilitamos alpha para ahorrar memoria
        if (!ctx) {
          throw new Error("No se pudo obtener el contexto 2D del canvas");
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // 3. Bajamos el quality a 0.8. La diferencia visual es nula para el OCR, 
        // pero el peso del string resultante baja drásticamente.
        const dataURLImage = canvas.toDataURL("image/jpeg", 0.8);

        if (dataURLImage.length <= 10) {
          throw new Error("La imagen procesada quedó vacía");
        }

        procesarImagenDocumento(dataURLImage);
      } catch (processingError) {
        console.error("Error procesando la imagen del documento:", processingError);
        setIsCorrupted(true);
        setLoading(false);
      } finally {
        // 4. IMPORTANTE: Liberamos la memoria del objectUrl
        URL.revokeObjectURL(objectUrl);
        event.target.value = ""; // Limpiamos el input después de procesar
      }
    };

    img.onerror = () => {
      setLoading(false);
      setIsCorrupted(true);
      resetRequestStatuses();
      URL.revokeObjectURL(objectUrl);
      event.target.value = ""; // Limpiamos el input si hay error
    };

    img.src = objectUrl;
  };

  const validarDocumento = async (data: any) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // Reinicia checks/errores y muestra el progreso ANTES de la primera espera.
    const attemptId = beginAttempt();

    try {
      const type = normalizeTipoDocumento(data.tipoDocumento || tipoDocumentoNormalizado);
      data.tipoDocumento = type;

      // 1. Registro de inicio (Log)
      try {
        await axios.post(
          `${URLS.timeLogUpdate}?id=${times.id}&column=${ladoDocumento}&action=inicio&country=${getCountry()}`,
        );
      } catch (e) {
        console.error("Error logging start:", e);
      }

      // 2. Estado inicial
      setTriesCounter((state) => state - 1);
      const startPerformance = performance.now();
      lastPayloadRef.current = data;

      // --- BLOQUE OCR ---
      const ocrTimeStart = Date.now();
      let durationOcr = 0;

      try {
        const resOcr = await axios.post(`${URLS.ocr}?country=${getCountry()}`, { image: data.imagen });
        durationOcr = Date.now() - ocrTimeStart;
        data["ocr"] = resOcr.data.ocr;
        data["textAngle"] = resOcr.data.textAngle;
        setOcrReq(requestSucceeded());
      } catch (error) {
        console.error("OCR Error:", error);
        setOcrReq(requestFailed());
        // Si el OCR es crítico, podrías poner un return aquí
      }

      // --- BLOQUE DETECTION (El que fallaba) ---
      try {
        const typeForDetection = conversor(type);
        const resDetection = await api.post(
          `${URLS.detection}?documento=${typeForDetection}&lado=${placeholder.toUpperCase()}`,
          { image: data.imagen, country: data.country });

        const resData = resDetection.data;

        setConteo((prev) => prev + 1);
        setMainCounter((prev) => prev + 1);

        if (ladoDocumento === "anverso") {
          dispatch(setFrontDetection());
        }

        if (ladoDocumento === "reverso") {
          dispatch(setBackDetection());
        }

        if (!resData.documentoValido) {
          setDetectionReq({
            loading: false,
            error: false,
            success: false,
            data: resData,
          });
          const triesDetect = tries - 1;
          if (conteo <= triesDetect) {
            setRetry(true);
            setShowModal(true);
            return; // El finally exterior apaga el loading y libera el intento
          }
        } else {
          setDetectionReq({
            loading: false,
            error: false,
            success: true,
            data: resData,
          });
        }
      } catch (error) {
        console.error("Detection Error:", error);
        setDetectionReq({
          loading: false,
          error: true,
          success: false,
          data: {},
        });
        // Si falla la detección, no tiene sentido seguir
      }

      // --- BLOQUE VALIDACIÓN ---
      const validationTimeStart = Date.now();
      let durationValidation = 0;

      const urlValidacion =
        ladoDocumento === "anverso"
          ? useModel
            ? URLS.frontValidation
            : URLS.validarDocumentoAnverso
          : useModel
            ? URLS.backValidation
            : URLS.validarDocumentoReverso;

      setValidationReq(createRequestStatus());

      // Se abre antes del POST para no perder los primeros eventos del backend.
      // Si el WebSocket falla, el hook lo ignora y la petición HTTP continúa.
      connectOcrProgress();

      try {
        const resValidacion = await api.post(urlValidacion, data);
        durationValidation = Date.now() - validationTimeStart;

        const resData = resValidacion.data;
        const validationFeedback = normalizeValidationFeedback(resData);
        // triesCounter conserva el valor previo al descuento de este intento.
        const attemptsRemaining = Math.max(0, triesCounter - 1);

        // Lógica para ANVERSO
        if (ladoDocumento === "anverso") {
          dispatch(setValidacionOCR(resData));
          dispatch(setValidacionCodigoBarras(resData));
          dispatch(setValidacionMRZ(resData.mrz));
          dispatch(setValidacionRostro(resData));
          dispatch(setFrontSide(resData.document));
          dispatch(setFrontResult({ sideResult: validationFeedback.canContinue }));
          dispatch(setFotos({ labelFoto: ladoDocumento, data: resData.image }));

          // Usar bestFrame como foto de evidencia (selfie) si está disponible
          if (resData.bestFrame) {
            dispatch(setFotos({ labelFoto: "foto_persona", data: resData.bestFrame }));
          }

          const mappedFields = mapFieldsFromValidationResponse(resData);
          const mergedFields = mergeCampos(
            validacionDocumento.campos,
            mappedFields
          );
          if (mergedFields) {
            dispatch(setCamposDocumento(mergedFields));
          }

          const fieldsNeedReview = Boolean(
            guideActive &&
              guideProfile &&
              !hasRequiredFieldValues(mergedFields, guideProfile)
          );

          if (validationFeedback.hasIssues) {
            setFeedback(validationFeedback);
            setRetry(true);
            setContinuarBoton(false);
            if (
              shouldAutoAdvanceAfterValidation(
                validationFeedback,
                attemptsRemaining
              )
            ) {
              scheduleAutoAdvance();
            }
          } else if (fieldsNeedReview) {
            // La guía está activa y faltan datos: esperamos confirmación o
            // corrección manual antes de avanzar.
            setContinuarBoton(false);
          } else if (resData.face && resData.faceDetected && resData.validSide) {
            setTimeout(() => nextStep(), 700);
          } else if (conteo >= detectionTries) {
            setRetry(false);
            setSuccess(true);
            setTimeout(() => nextStep(), 700);
          }
        }

        // Lógica para REVERSO
        if (ladoDocumento === "reverso") {
          dispatch(setValidacionCodigoBarras(resData));
          dispatch(setValidacionMRZ(resData.mrz));
          dispatch(setBackSide(resData.document));
          dispatch(setBackResult({ sideResult: validationFeedback.canContinue }));
          dispatch(setFotos({ labelFoto: ladoDocumento, data: resData.image }));

          const mappedFields = mapFieldsFromValidationResponse(resData);
          const mergedFields = mergeCampos(
            validacionDocumento.campos,
            mappedFields
          );
          if (mergedFields) {
            dispatch(setCamposDocumento(mergedFields));
          }

          if (validationFeedback.hasIssues) {
            setFeedback(validationFeedback);
            setRetry(true);
            setContinuarBoton(false);
            if (
              shouldAutoAdvanceAfterValidation(
                validationFeedback,
                attemptsRemaining
              )
            ) {
              scheduleAutoAdvance();
            }
          } else if (resData.validSide) {
            setContinuarBoton(true);
            setTimeout(() => nextStep(), 700);
          }
        }

        setValidationReq(requestSucceeded());
      } catch (error) {
        console.error("Validation Error:", error);
        clearPendingAutoAdvance();
        setValidationReq(requestFailed());
        setFeedback(null);
        setContinuarBoton(false);
        setError(true);
        setRetry(true);
      } finally {
        // La validación ya terminó: se cierra el canal de progreso y se libera
        // el intento sin esperar al registro de tiempos (telemetría no crítica).
        disconnectOcrProgress();
        if (attemptIdRef.current === attemptId) {
          inFlightRef.current = false;
          setLoading(false);
        }
        const endPerformance = performance.now();
        console.log(
          `validarDocumento finalizó en ${(endPerformance - startPerformance).toFixed(2)} ms`,
        );
      }

      // 3. Registro de fin y tiempos finales
      try {
        await axios.post(
          `${URLS.timeLogUpdate}?id=${times.id}&column=${ladoDocumento}&action=fin&country=${getCountry()}`,
        );
      } catch (e) {
        console.error("Error logging end:", e);
      }

      const validationTimeData = {
        ocrTime: Number((durationOcr / 1000).toFixed(2)),
        recognizeTime: Number((durationValidation / 1000).toFixed(2)),
        innerTimes: {},
      };

      if (ladoDocumento === "anverso") {
        dispatch(setFrontTime(validationTimeData));
      } else {
        dispatch(setBackTime(validationTimeData));
      }
    } finally {
      // Red de seguridad para salidas tempranas (p. ej. documento inválido).
      // Cerrar aquí es idempotente si el finally de la validación ya lo hizo.
      disconnectOcrProgress();
      if (attemptIdRef.current === attemptId) {
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  const requestRecapture = () => {
    if (loading || inFlightRef.current) return;
    clearPendingAutoAdvance();
    setFeedback(null);
    setError(false);
    setIsCorrupted(false);
    setContinuarBoton(false);
    setRetry(true);
    dispatch(clearCamposDocumento());

    if (guidePossible) {
      setGuideFallbackReason(null);
      setGuideSessionKey((value) => value + 1);
      return;
    }

    fileInputRef.current?.click();
  };

  const retryLastValidation = () => {
    if (loading || inFlightRef.current) return;
    clearPendingAutoAdvance();
    if (!lastPayloadRef.current) {
      requestRecapture();
      return;
    }
    setFeedback(null);
    setError(false);
    void validarDocumento(lastPayloadRef.current);
  };

  return (
    <div className="documento-container">
      <SuccessStep show={success} />

      {tipoDocumento === passport && ladoDocumento === "anverso" && (
        <h2 className="documento-title">
          Subir foto del {placeholder} de su {tipoDocumento}
        </h2>
      )}

      {tipoDocumento !== passport && (
        <h2 className="documento-title">
          Subir foto del {placeholder} de su {tipoDocumento}
        </h2>
      )}

      <div
        className={`${triesCounter >= 1 ? "flex" : "hidden"} justify-center  mb-1`}
      >
        <span className="px-2 py-1 shadow-lg rounded-lg shadow-black bg-slate-200">
          Intentos restantes: {triesCounter}{" "}
        </span>
      </div>

      {showModal && (
        <Advertencia
          titulo="Documento No Válido"
          contenido="Hemos detectado inconsistencias en el documento subido. Por favor, revise las siguientes indicaciones:"
          tipo="warning"
          onClose={!disabled ? () => setShowModal(false) : undefined}
          elemento={
            <div className="flex flex-col items-center w-full gap-3">
              <div className="w-full bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-amber-900 text-xs sm:text-sm text-center leading-relaxed">
                Por favor, asegúrese de subir el <strong>{placeholder}</strong> de su{" "}
                <strong className="capitalize">{tipoDocumento.toLocaleLowerCase()}</strong> con buena luz y sin reflejos para poder continuar.
              </div>

              {!(tipoDocumento === passport) && (
                <div className="flex flex-col justify-center items-center w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <span className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Imagen de referencia
                  </span>
                  <img 
                    src={publicPath} 
                    alt="Referencia de documento" 
                    className="max-h-28 sm:max-h-40 w-auto object-contain rounded-lg shadow-sm border border-slate-200 bg-white" 
                  />
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto min-w-[140px] px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 mt-1"
                disabled={disabled}
              >
                <span>Cerrar</span>
                {disabled && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    {seconds}s
                  </span>
                )}
              </button>
            </div>
          }
        />
      )}

      {continuarBoton && (
        <Alert color="success" style={{ textAlign: "center" }}>
          Seleccione {ladoDocumento === "anverso" ? "continuar" : "finalizar"}
        </Alert>
      )}

      {error && (
        <Alert color="danger" className="text-center">
          <p className="mb-2">
            No pudimos verificar el documento por un problema de conexión.
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={retryLastValidation}
              disabled={loading}
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={requestRecapture}
              disabled={loading}
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Volver a capturar documento
            </button>
          </div>
        </Alert>
      )}

      {isCorrupted && (
        <Alert color="warning" style={{ textAlign: "center" }}>
          intente subir de nuevo la foto del documento
        </Alert>
      )}

      {/* aria-live="polite": el lector de pantalla anuncia cambios de estado sin interrumpir */}
      <div aria-live="polite" role="status" className="sr-only">
        {!loading && success && 'Documento verificado correctamente.'}
        {error && 'Error al verificar el documento. Por favor intente de nuevo.'}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="loading-progress">
            <p
              className={`loading-message${
                visibleOcrProgress ? ` is-${visibleOcrProgress.status}` : ""
              }`}
              role="status"
              aria-live="polite"
            >
              {visibleOcrProgress?.message ??
                loadingMessages[loadingMessageIndex]}
            </p>
            <div
              className="loading-bar"
              role="progressbar"
              aria-label="Progreso de verificación del documento"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={visibleOcrProgress ? ocrPercent : undefined}
            >
              <div
                className={`loading-bar-fill${
                  visibleOcrProgress
                    ? ` is-${visibleOcrProgress.status}`
                    : " indeterminate"
                }`}
                style={
                  visibleOcrProgress ? { width: `${ocrPercent}%` } : undefined
                }
              />
            </div>
            {visibleOcrProgress && (
              <p className="loading-percent">{ocrPercent}%</p>
            )}
           
          </div>
          <div className="loading-grid">
            {/* Fila 1 */}
            <div className={`loading-indicator${ocrReq.loading ? " pending" : ""}`}>
              <span>Alineando documento</span>
              <div className="status-area">
                {ocrReq.loading && <Spinner aria-label="Alineando documento" />}
                {ocrReq.error && (
                  <span
                    className="step-error"
                    role="img"
                    aria-label="No se pudo alinear el documento"
                  >
                    !
                  </span>
                )}
                {ocrReq.success && (
                  <span aria-label="Alineación completada">
                    <svg
                      aria-hidden="true"
                      className="bg-green-700 rounded-xl"
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Fila 2 */}
            {tipoDocumento !== passport && (
              <div className={`loading-indicator${detectionReq.loading ? " pending" : ""}`}>
                <span>Identificando tipo de documento</span>
                <div className="status-area">
                  {detectionReq.loading && <Spinner aria-label="Identificando tipo de documento" />}
                  {detectionReq.error && (
                    <span
                      className="step-error"
                      role="img"
                      aria-label="No se pudo identificar el tipo de documento"
                    >
                      !
                    </span>
                  )}
                  {detectionReq.success && (
                    <span aria-label="Identificación completada">
                      <svg
                        aria-hidden="true"
                        className="bg-green-700 rounded-xl"
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#e3e3e3"
                      >
                        <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Fila 3 */}
            <div className={`loading-indicator${validationReq.loading ? " pending" : ""}`}>
              <span>Procesando documento</span>
              <div className="status-area">
                {validationReq.loading && <Spinner aria-label="Procesando documento" />}
                {validationReq.error && (
                  <span
                    className="step-error"
                    role="img"
                    aria-label="No se pudo procesar el documento"
                  >
                    !
                  </span>
                )}
                {validationReq.success && (
                  <span aria-label="Procesamiento completado">
                    <svg
                      aria-hidden="true"
                      className="bg-green-700 rounded-xl"
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && feedback && (
        <ValidationFeedbackPanel
          id={feedbackId}
          feedback={feedback}
        />
      )}

      {guidePossible && !loading && !success && (
        <CapturaDocumentoGuiada
          key={`${ladoDocumento}-${guideSessionKey}`}
          active={guideActive}
          country={countryCode}
          tipoDocumento={tipoDocumentoNormalizado}
          lado={guideSide}
          onCapture={handleGuidedCapture}
          onFallback={handleGuideFallback}
        />
      )}

      {!loading && !success && guideActive && camposDocumento && (
        <CamposDocumentoPanel
          campos={camposDocumento}
          onConfirm={handleCamposConfirm}
          onRecapture={requestRecapture}
        />
      )}

      {!guidePossible && guideFallbackReason && (
        <Alert color="secondary" className="text-center">
          {guideFallbackReason} Puedes continuar con la captura normal.
        </Alert>
      )}

      {!guidePossible && (ladoDocumento === "reverso" && tipoDocumento === passport ? (
        <></>
      ) : (
        <>
          {mobile && (
            <>
              {!horizontal && (
                <div className={`${loading ? "hidden" : "flex"} flex-col `}>
                  <span className="text-center font-bold text-sm md:text-base m-0">
                    La foto debe mostrar el documento completo, todos los textos
                    completamente enfocados y sin ningún tipo de sombra, de
                    forma que se puedan reconocer todos los datos.
                  </span>

                  <label
                    className="file-input text-center text-sm md:text-sm"
                    aria-label={`${retry ? 'Reintentar subir' : 'Subir'} foto del ${placeholder} de su ${tipoDocumento}`}
                    aria-describedby={feedback ? feedbackId : undefined}
                    style={{
                      background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCapture}
                      className="sr-only"
                      disabled={loading}
                      aria-describedby={feedback ? feedbackId : undefined}
                      aria-invalid={feedback ? true : undefined}
                    />
                    {preview.length <= 0 &&
                      `Subir foto del ${placeholder} de su ${tipoDocumento}`}
                    {retry && "Reintentar subir documento"}
                    {loading && <Spinner></Spinner>}
                  </label>
                </div>
              )}
            </>
          )}

          {!mobile && !success && (
            <label
              className="file-input"
              aria-describedby={feedback ? feedbackId : undefined}
              aria-label={
                retry && !continuarBoton
                  ? `Reintentar subir foto del ${placeholder} de su ${tipoDocumento}`
                  : continuarBoton
                    ? `Subir una nueva foto del ${placeholder} de su ${tipoDocumento}`
                    : `Subir foto del ${placeholder} de su ${tipoDocumento}`
              }
              style={{
                background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
              }}
            >
              <input
                ref={fileInputRef}
                name={ladoDocumento}
                type="file"
                accept="image/jpeg"
                onChange={handleCapture}
                className="sr-only"
                disabled={loading}
                aria-describedby={feedback ? feedbackId : undefined}
                aria-invalid={feedback ? true : undefined}
              />
              {preview.length <= 0 &&
                `Subir foto del ${placeholder} de su ${tipoDocumento}`}
              {retry && !continuarBoton && "Reintentar subir documento"}
              {loading && <Spinner></Spinner>}
              {continuarBoton &&
                ladoDocumento === "anverso" &&
                "Subir nueva foto"}
              {error && "Error — intente de nuevo"}
              {continuarBoton &&
                ladoDocumento === "reverso" &&
                "Subir nueva foto"}
            </label>
          )}
        </>
      ))}

      {preview.length >= 1 && !loading && tipoDocumento != passport && (
        <Previsualizacion preview={preview} nombrePreview={ladoDocumento} />
      )}

      {preview.length >= 1 &&
        !loading &&
        tipoDocumento == passport &&
        ladoDocumento == "anverso" && (
          <Previsualizacion preview={preview} nombrePreview={ladoDocumento} />
        )}
    </div>
  );
};
