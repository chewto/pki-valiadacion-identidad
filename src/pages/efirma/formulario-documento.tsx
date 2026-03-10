/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
} from "../../nucleo/redux/slices/validacionDocumentoSlice";
import { Alert, Spinner } from "reactstrap";
import "react-html5-camera-photo/build/css/index.css";
import { URLS } from "../../nucleo/api-urls/urls";
import { imagePlaceholder } from "@components/dataurl";
import { Advertencia } from "@components/ui/advertencia";
import SuccessStep from "@components/ui/success-step";
import { setBackTime, setFrontTime } from "@nucleo/redux/slices/timerSlice";
// import Camera from '@pages/efirma/nueva-camara'

interface Props {
  id: string | number | null | undefined;
  tipoDocumento: string;
  preview: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  ladoDocumento: string;
  tries: number;
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
  setMainCounter,
  nextStep,
  // returnStep
}) => {
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const informacion = useSelector((state: RootState) => state.informacion);
  const validacionDocumento = useSelector(
    (state: RootState) => state.validacionDocumento,
  );
  const times = useSelector((state: RootState) => state.timer);
  const dispatch = useDispatch();

  const passport = "PASAPORTE";

  const placeholder = ladoDocumento === "anverso" ? "frontal" : "reverso";
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(1);
  // const [detectCount, setDetectCount] = useState<number>(1)
  const [triesCounter, setTriesCounter] = useState<number>(tries);
  const [showModal, setShowModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [isCorrupted, setIsCorrupted] = useState<boolean>(false);
  // const [messages, setMessages] = useState<string[]>([]);
  const [retry, setRetry] = useState<boolean>(false);
  const [reqMessage, setReqMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  // 1. Definimos el mapeo fuera para que sea una constante única
const DOCUMENT_MAPPING = {
  "CEDULA DE CIUDADANIA": "CEDULA_CIUDADANIA",
  "CEDULA DE EXTRANJERIA": "CEDULA_EXTRANJERIA",
  "CEDULA DIGITAL": "CEDULA_DIGITAL",
  "PASAPORTE": "PASAPORTE",
} as const; // 'as const' hace que los valores sean literales, no solo strings

// 2. Extraemos el tipo de las llaves automáticamente
type DocumentType = keyof typeof DOCUMENT_MAPPING;

const conversor = (document: DocumentType) => {
  return DOCUMENT_MAPPING[document];
};


  const [ocrReq, setOcrReq] = useState<{
    loading: boolean;
    error: boolean;
    success: boolean | null;
  }>({ loading: true, error: false, success: null });
  const [detectionReq, setDetectionReq] = useState<{
    loading: boolean;
    error: boolean;
    success: boolean | null;
    data: any;
  }>({ loading: true, error: false, success: null, data: {} });
  const [validationReq, setValidationReq] = useState<{
    loading: boolean;
    error: boolean;
    success: boolean | null;
  }>({ loading: true, error: false, success: null });

  const mobile: boolean = useMobile();

  const [horizontal, setHorizontal] = useState<boolean>(false);
  const [takePhoto, setTakePhoto] = useState<boolean>(false);

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

  const [_, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (loading) {
      setLoadingMessageIndex(0);
      setReqMessage(loadingMessages[0]);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => {
          const nextIndex = prev < loadingMessages.length - 1 ? prev + 1 : prev;
          setReqMessage(loadingMessages[nextIndex]);
          return nextIndex;
        });
      }, 2000);
    } else {
      setLoadingMessageIndex(0);
      setReqMessage("");
      console.log(reqMessage);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Replace reqMessage with loadingMessages[loadingMessageIndex] in the UI where loading is shown

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
  }, [ladoDocumento]);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    // setMessages([]);
    setContinuarBoton(false);
    setRetry(false);
    setIsCorrupted(false);

    const archivo = event.target.files?.[0];
    const lector = new FileReader();

    if (archivo) lector.readAsDataURL(archivo);

    lector.onload = () => {
      const dataURL = lector.result;
      const img = new Image();
      if (typeof dataURL === "string") {
        img.onload = () => {
          if (archivo) {
            if (archivo.size < 300 * 1024) {
              console.log("imagen menor a 300kb");
              // Imagen menor a 300KB, usar original
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0, img.width, img.height);
              const dataURLImage = canvas.toDataURL("image/jpeg", 1.0);

              if (dataURLImage.length >= 1) {
                dispatch(
                  setFotos({ labelFoto: ladoDocumento, data: dataURLImage }),
                );
                const data = {
                  id: id,
                  imagen: dataURLImage,
                  nombre:
                    informacionFirmador.nombre != null
                      ? informacionFirmador.nombre
                      : validacionDocumento.ocr.data.name,
                  apellido:
                    informacionFirmador.apellido != null
                      ? informacionFirmador.apellido
                      : validacionDocumento.ocr.data.lastName,
                  documento:
                    informacionFirmador.documento != null
                      ? informacionFirmador.documento
                      : validacionDocumento.ocr.data.ID,
                  ladoDocumento: ladoDocumento,
                  tipoDocumento: tipoDocumento,
                  imagenPersona: informacion.foto_persona,
                  country: informacionFirmador.pais,
                  tries: conteo,
                };
                validarDocumento(data);
              } else {
                setIsCorrupted(true);
              }
            } else {
              // Redimensionar imagen si es mayor a 300KB
              const maxWidth = 1080;
              const scale = maxWidth / img.width;
              const newWidth = maxWidth;
              const newHeight = img.height * scale;

              const canvas = document.createElement("canvas");
              canvas.width = newWidth;
              canvas.height = newHeight;

              const ctx = canvas.getContext("2d");

              if (ctx) {
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const dataURLImage = canvas.toDataURL("image/jpeg", 0.9);

                if (dataURLImage.length >= 1) {
                  dispatch(
                    setFotos({ labelFoto: ladoDocumento, data: dataURLImage }),
                  );

                  const data = {
                    id: id,
                    imagen: dataURLImage,
                    nombre:
                      informacionFirmador.nombre != null
                        ? informacionFirmador.nombre
                        : validacionDocumento.ocr.data.name,
                    apellido:
                      informacionFirmador.apellido != null
                        ? informacionFirmador.apellido
                        : validacionDocumento.ocr.data.lastName,
                    documento:
                      informacionFirmador.documento != null
                        ? informacionFirmador.documento
                        : validacionDocumento.ocr.data.ID,
                    ladoDocumento: ladoDocumento,
                    tipoDocumento: tipoDocumento,
                    imagenPersona: informacion.foto_persona,
                    country: informacionFirmador.pais,
                    tries: conteo,
                  };
                  validarDocumento(data);
                } else {
                  setIsCorrupted(true);
                }
              }
            }
          }
        };

        img.src = dataURL;
      }
    };

    event.target.value = "";
  };


  

  const validarDocumento = async (data: any) => {

    const type = conversor(data.tipoDocumento)
    // 1. Registro de inicio (Log)
    try {
      await axios.post(
        `${URLS.timeLogUpdate}?id=${times.id}&column=${ladoDocumento}&action=inicio`,
      );
    } catch (e) {
      console.error("Error logging start:", e);
    }

    // 2. Estado inicial
    setTriesCounter((state) => state - 1);
    const startPerformance = performance.now();
    setError(false);
    setLoading(true);

    // --- BLOQUE OCR ---
    const ocrTimeStart = Date.now();
    let durationOcr = 0;

    try {
      const resOcr = await axios.post(URLS.ocr, { image: data.imagen });
      durationOcr = Date.now() - ocrTimeStart;
      data["ocr"] = resOcr.data.ocr;
      data["textAngle"] = resOcr.data.textAngle;
      setOcrReq({ ...ocrReq, loading: false, success: true });
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrReq({ ...ocrReq, error: true, success: false });
      // Si el OCR es crítico, podrías poner un return aquí
    }

    // --- BLOQUE DETECTION (El que fallaba) ---
    try {

      const resDetection = await axios.post(
        `${URLS.detection}?documento=${type}&lado=${placeholder.toUpperCase()}`,
        { image: data.imagen, country: data.country },
      );

      const resData = resDetection.data;

      setConteo((prev) => prev + 1);
      setMainCounter((prev) => prev + 1);

      if (!resData.documentoValido) {
        setDetectionReq({ ...detectionReq, loading: false, success: false, data: resData });
        const triesDetect = tries - 1;
        if (conteo <= triesDetect) {
          setLoading(false);
          setRetry(true)
          setOcrReq({ loading: true, error: false, success: null });
          setDetectionReq({ loading: true, error: false, success: null, data: {} });
          setShowModal(true)
          return; // <--- AHORA SÍ FINALIZA LA FUNCIÓN AQUÍ
        }
      }

      setDetectionReq({ ...detectionReq, loading: false, success: true });
    } catch (error) {
      console.error("Detection Error:", error);
      setDetectionReq({ ...detectionReq, error: true, success: false });
      // setLoading(false);
      return; // Si falla la detección, no tiene sentido seguir
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

    try {
      const resValidacion = await axios.post(urlValidacion, data);
      durationValidation = Date.now() - validationTimeStart;

      const resData = resValidacion.data;
      // const adviceMessages = resData.messages;

      // Lógica para ANVERSO
      if (ladoDocumento === "anverso") {
        dispatch(setValidacionOCR(resData));
        dispatch(setValidacionCodigoBarras(resData));
        dispatch(setValidacionMRZ(resData.mrz));
        dispatch(setValidacionRostro(resData));
        dispatch(setFrontSide(resData.document));
        dispatch(setFrontResult({ sideResult: resData.validSide }));
        dispatch(setFotos({ labelFoto: ladoDocumento, data: resData.image }));

        setTimeout(() => nextStep(), 700);
        setSuccess(true);

        // if (resData.face && resData.faceDetected && resData.validSide) {
        //   setTimeout(() => nextStep(), 700);
        // } else if (!resData.validSide && conteo < tries) {
        //   // setMessages((prev) => [...prev, ...adviceMessages]);
        //   // setConteo((prev) => prev + 1);
        //   setRetry(true);
        // } else if (!resData.validSide && conteo == tries) {
        //   setMessages([]);
        //   setRetry(false);
        //   setSuccess(true);
        //   setTimeout(() => nextStep(), 700);
        // }
      }

      // Lógica para REVERSO
      if (ladoDocumento === "reverso") {
        dispatch(setValidacionCodigoBarras(resData));
        dispatch(setValidacionMRZ(resData.mrz));
        dispatch(setBackSide(resData.document));
        dispatch(setBackResult({ sideResult: resData.validSide }));
        dispatch(setFotos({ labelFoto: ladoDocumento, data: resData.image }));

        setTimeout(() => nextStep(), 700);
        setSuccess(true);
        setContinuarBoton(true);

        // if (resData.validSide) {
        //   setContinuarBoton(true);
        //   setTimeout(() => nextStep(), 700);
        // } else if (!resData.validSide && conteo < tries) {
        //   // setMessages((prev) => [...prev, ...adviceMessages]);
        //   setRetry(true);
        //   // setConteo((prev) => prev + 1);
        //   // setMainCounter((prev) => prev + 1);
        // } else if (!resData.validSide && conteo == tries) {
        //   setMessages([]);
        //   setRetry(false);
        //   setSuccess(true);
        //   setTimeout(() => nextStep(), 700);
        // }
      }

      setValidationReq({ ...validationReq, loading: false });
    } catch (error) {
      console.error("Validation Error:", error);
      setValidationReq({ ...validationReq, error: true });
      setError(true);
      setRetry(true);
    } finally {
      setLoading(false);
      const endPerformance = performance.now();
      console.log(
        `validarDocumento finalizó en ${(endPerformance - startPerformance).toFixed(2)} ms`,
      );
    }

    // 3. Registro de fin y tiempos finales
    try {
      await axios.post(
        `${URLS.timeLogUpdate}?id=${times.id}&column=${ladoDocumento}&action=fin`,
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
          titulo="Advertencia"
          contenido="El documento no es valido, por favor, haga caso a los siguientes mensajes. Recuerde tomar las fotos con buena luz y claridad."
          elemento={
            <div>
              <p className="text-justify p-0 bg-slate-100 rounded-lg px-3 py-3">
                 Hemos detectado que el documento subido anteriormente no corresponde con el documento seleccionado. Por favor, asegúrese de subir el <strong>{placeholder}</strong> de su <strong>{tipoDocumento.toLocaleLowerCase()}</strong> para poder continuar con el proceso.
              </p>
              <button onClick={() => setShowModal(false)} className="stepper-btn">
                cerrar
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
        <Alert color="danger">
          Para terminar la validación contacte con Soporte.
        </Alert>
      )}

      {isCorrupted && (
        <Alert color="warning" style={{ textAlign: "center" }}>
          intente subir de nuevo la foto del documento
        </Alert>
      )}

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
            margin: "20px 0",
          }}
        >
          <div className="loading-grid">
            {/* Fila 1 */}
            <div className="loading-indicator">
              <span>Alineando documento</span>
              <div className="status-area">
                {ocrReq.loading && <Spinner />}
                {ocrReq.success && (
                  <span>
                    <svg
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
            <div className="loading-indicator">
              <span>Identificando tipo de documento</span>
              <div className="status-area">
                {detectionReq.loading && <Spinner />}
                {detectionReq.success && (
                  <span>
                    <svg
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

            {/* Fila 3 */}
            <div className="loading-indicator">
              <span>Procesando documento</span>
              <div className="status-area">
                {validationReq.loading && <Spinner />}
                {validationReq.success && (
                  <span>
                    <svg
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

      {ladoDocumento === "reverso" && tipoDocumento === passport ? (
        <></>
      ) : (
        <>
          {mobile && (
            <>
              {!horizontal && !takePhoto && (
                <div className="text-justify flex flex-col border-gray-300 border-1 bg-slate-100 gap-2 rounded-md p-2">
                  <p className="m-0 text-sm">
                    Por favor, gira tu teléfono en modo horizontal para tomar la
                    foto del documento.
                  </p>
                  <p className="m-0 text-sm">
                    Si el dispositivo no gira automaticamente verifica en
                    ajustes que la rotación de pantalla esté habilitada.
                  </p>
                  <button
                    onClick={() => setTakePhoto(true)}
                    className="text-sm border-1 border-gray-200 "
                  >
                    Pulse aqui si no gira el dispositivo
                  </button>
                </div>
              )}

              {horizontal && (
                <div className={`${loading ? "hidden" : "flex"} flex-col `}>
                  <span className="text-center font-bold text-xs md:text-sm  m-0 ">
                    La foto debe mostrar el documento completo, todos los textos
                    completamente enfocados y sin ningún tipo de sombra, de
                    forma que se puedan reconocer todos los datos.
                  </span>

                  <label
                    className="file-input text-center text-sm md:text-sm"
                    style={{
                      background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCapture}
                      className="opacity-0 w-0"
                      disabled={loading}
                    />
                    {preview.length <= 0 &&
                      `Subir foto del ${placeholder} de su ${tipoDocumento}`}
                    {retry && "Reintentar subir documento"}
                    {loading && <Spinner></Spinner>}
                  </label>
                </div>
              )}

              {!horizontal && takePhoto && (
                <div className={`${loading ? "hidden" : "flex"} flex-col`}>
                  <span className="text-center font-bold text-sm m-0 ">
                    La foto debe mostrar el documento completo, todos los textos
                    completamente enfocados y sin ningún tipo de sombra, de
                    forma que se puedan reconocer todos los datos.
                  </span>
                  <label
                    className="file-input text-center"
                    style={{
                      background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCapture}
                      className="opacity-0 w-0"
                      disabled={loading}
                    />
                    {preview.length <= 0 &&
                      `Subir foto del ${placeholder} de su ${tipoDocumento}`}
                    {retry && "Reintentar subir documento"}
                    {!detectionReq.success && "Por favor, subir la imagen de su documento correctamente." }
                    {loading && <Spinner></Spinner>}
                  </label>
                </div>
              )}
            </>

            // <Camera
            // preview={preview}
            // ladoDocumento={ladoDocumento}
            // placeholder={placeholder}
            // retry={retry}
            // tipoDocumento={tipoDocumento}
            // loading={loading}
            // setIsCorrupted={setIsCorrupted}
            // setMessages={setMessages}
            // setRetry={setRetry}
            // sendDocument={() => {
            //   validarDocumento(
            //     id,
            //     preview,
            //     informacionFirmador.nombre != null ? informacionFirmador.nombre : validacionDocumento.ocr.data.name,
            //     informacionFirmador.apellido != null ? informacionFirmador.apellido : validacionDocumento.ocr.data.lastName,
            //     informacionFirmador.documento != null ? informacionFirmador.documento : validacionDocumento.ocr.data.ID,
            //     ladoDocumento,
            //     tipoDocumento,
            //     informacion.foto_persona,
            //     informacionFirmador.pais
            //   );
            // }}
            // />
          )}

          {!mobile && !success && (
            <label
              className="file-input"
              style={{
                background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
              }}
            >
              <input
                name={ladoDocumento}
                type="file"
                accept="image/jpeg"
                onChange={handleCapture}
                style={{ display: "none" }}
                disabled={loading}
              />
              {preview.length <= 0 &&
                `Subir foto del ${placeholder} de su ${tipoDocumento}`}
              {retry && !continuarBoton && "Reintentar subir documento"}
              {loading && <Spinner></Spinner>}
              {continuarBoton &&
                ladoDocumento === "anverso" &&
                "Pulse aqui para subir una nueva foto"}
              {error && "El servidor ha fallado"}
              {continuarBoton &&
                ladoDocumento === "reverso" &&
                "Pulse aqui para subir una nueva foto"}
            </label>
          )}
        </>
      )}

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
