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
import axios, { AxiosResponse } from "axios";
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
}) => {
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const informacion = useSelector((state: RootState) => state.informacion);
  const validacionDocumento = useSelector(
    (state: RootState) => state.validacionDocumento
  );
  const dispatch = useDispatch();

  const passport = 'PASAPORTE'

  const placeholder = ladoDocumento === "anverso" ? "frontal" : "reverso";
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [isCorrupted, setIsCorrupted] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [retry, setRetry] = useState<boolean>(false);
  const [reqMessage, setReqMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

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
    if (  loading) {
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
      setContinuarBoton(true)
    }
  }, [ladoDocumento, tipoDocumento, setContinuarBoton, dispatch]);

  useEffect(() => {
    // setConteo(1);
    setSuccess(false);
  }, [ladoDocumento]);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    setMessages([]);
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
              console.log("imagen menor a 300kb")
              // Imagen menor a 300KB, usar original
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0, img.width, img.height);
              const dataURLImage = canvas.toDataURL("image/jpeg", 1.0);

              if (dataURLImage.length >= 1) {
                dispatch(
                  setFotos({ labelFoto: ladoDocumento, data: dataURLImage })
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
                    setFotos({ labelFoto: ladoDocumento, data: dataURLImage })
                  );

                  console.log(dataURLImage)
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
            // const canvas = document.createElement("canvas");
            //   const ctx = canvas.getContext("2d");
            //   canvas.width = img.width;
            //   canvas.height = img.height;
            //   ctx?.drawImage(img, 0, 0, img.width, img.height);
            //   const dataURLImage = canvas.toDataURL("image/jpeg", 1.0);

            //   if (dataURLImage.length >= 1) {
            //     dispatch(
            //       setFotos({ labelFoto: ladoDocumento, data: dataURLImage })
            //     );
            //     const data = {
            //       id: id,
            //       imagen: dataURLImage,
            //       nombre:
            //         informacionFirmador.nombre != null
            //           ? informacionFirmador.nombre
            //           : validacionDocumento.ocr.data.name,
            //       apellido:
            //         informacionFirmador.apellido != null
            //           ? informacionFirmador.apellido
            //           : validacionDocumento.ocr.data.lastName,
            //       documento:
            //         informacionFirmador.documento != null
            //           ? informacionFirmador.documento
            //           : validacionDocumento.ocr.data.ID,
            //       ladoDocumento: ladoDocumento,
            //       tipoDocumento: tipoDocumento,
            //       imagenPersona: informacion.foto_persona,
            //       country: informacionFirmador.pais,
            //       tries: conteo,
            //     };
            //     validarDocumento(data);
            //   } else {
            //     setIsCorrupted(true);
            //   }
          }
        };

        img.src = dataURL;
      }
    };

    event.target.value = "";
  };

  const validarDocumento = async (data: any) => {
    const start = performance.now();
    setError(false);
    setLoading(true);

    await axios({
      method: "post",
      url: URLS.ocr,
      data: { image: data.imagen }
    }).then(res => {
      console.log(res)
      data['ocr'] = res.data.ocr
      data['textAngle'] = res.data.textAngle
    })

    await axios({
      method: "post",
      url:
        ladoDocumento == "anverso"
          ? useModel
            ? URLS.frontValidation
            : URLS.validarDocumentoAnverso
          : useModel
          ? URLS.backValidation
          : URLS.validarDocumentoReverso,
      data: data,
    })
      .then((res: AxiosResponse<any>) => {
        const adviceMessages = res.data.messages;
        console.log(res);
        if (ladoDocumento === "anverso") {
          dispatch(setValidacionOCR(res.data));
          dispatch(setValidacionCodigoBarras(res.data));
          dispatch(setValidacionMRZ(res.data.mrz));
          dispatch(setValidacionRostro(res.data));
          dispatch(setFrontSide(res.data.document));
          dispatch(setFrontResult({ sideResult: res.data.validSide }));
          dispatch(
            setFotos({ labelFoto: ladoDocumento, data: res.data.image })
          );

          if (res.data.face && res.data.validSide == "OK") {
            console.log("valido");
            setSuccess(true);
            setTimeout(() => {
              nextStep();
            }, 700);
          }

          if (res.data.validSide != "OK" && conteo < tries) {
            console.log("invalido");
            setMessages((prevMessages) => [...prevMessages, ...adviceMessages]);
            setConteo((prev) => prev + 1);
            setRetry(true);
          }

          if (conteo >= tries) {
            console.log("valido por intentos");
            setMessages([]);
            setRetry(false);
            setSuccess(true);
            setTimeout(() => {
              nextStep();
            }, 700);
          }
        }

        if (ladoDocumento === "reverso") {
          dispatch(setValidacionCodigoBarras(res.data));
          dispatch(setValidacionMRZ(res.data.mrz));
          dispatch(setBackSide(res.data.document));
          dispatch(setBackResult({ sideResult: res.data.validSide }));
          dispatch(
            setFotos({ labelFoto: ladoDocumento, data: res.data.image })
          );

          if (res.data.validSide === "OK") {
            console.log("valido");
            setSuccess(true);
            setContinuarBoton(true)
            setTimeout(() => {
              nextStep();
            }, 700);
          }

          if (res.data.validSide != "OK" && conteo < tries) {
            console.log("invalido");
            setMessages((prevMessages) => [...prevMessages, ...adviceMessages]);
            setRetry(true);
            setConteo((prev) => prev + 1);
            setMainCounter((prev) => prev + 1);
          }

          if (conteo >= tries) {
            console.log("valido por intentos");
            setMessages([]);
            setRetry(false);
            setSuccess(true);
            setContinuarBoton(true)
            setTimeout(() => {
              nextStep();
            }, 700);
          }
        }
      })
      .catch((error) => {
        setError(true);
        setLoading(false);
        setRetry(true);
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
        const end = performance.now();
        console.log(`validarDocumento tardó ${(end - start).toFixed(2)} ms`);
      });
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

      {messages.length >= 1 && (
        <Advertencia
          titulo="Advertencia"
          contenido="El documento no es valido, por favor, haga caso a los siguientes mensajes. Recuerde tomar las fotos con buena luz y claridad."
          elemento={
            <div>
              <ul className="text-left p-0">
                {messages.map((message: string, index: number) => (
                  <li
                    key={index}
                    className="border-2 border-yellow-400 rounded-md my-1 px-2 py-0.5 text-lg bg-yellow-200"
                  >
                    {message}
                  </li>
                ))}

                {/* <li className="border-2 border-yellow-400 rounded-md my-1 px-2 py-0.5 text-lg bg-yellow-200">
                  Por favor, se requiere una foto del documento con mejor
                  resolución, inténtelo nuevamente.
                </li> */}
              </ul>
              <button onClick={() => setMessages([])} className="stepper-btn">
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
        <Alert color="danger">Para terminar la validación contacte con Soporte.</Alert>
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
          <div className="flex flex-col justify-center items-center">
            <span>{reqMessage}</span>
            <Spinner></Spinner>
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
