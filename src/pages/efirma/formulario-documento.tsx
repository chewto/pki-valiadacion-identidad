/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";
import { imagePlaceholder } from "@components/dataurl";
import { Advertencia } from "@components/ui/advertencia";

interface Props {
  id: string | number | null | undefined;
  tipoDocumento: string;
  preview: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  ladoDocumento: string;
  urlOCR: string;
  tries: number;
  attendance: string;
  setMainCounter: Dispatch<SetStateAction<number>>;
}

export const FormularioDocumento: React.FC<Props> = ({
  id,
  tipoDocumento,
  preview,
  continuarBoton,
  setContinuarBoton,
  ladoDocumento,
  tries,
  attendance,
  setMainCounter,
}) => {
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const informacion = useSelector((state: RootState) => state.informacion);
  const validaiconDocumento = useSelector(
    (state: RootState) => state.validacionDocumento
  );
  const dispatch = useDispatch();

  const placeholder = ladoDocumento === "anverso" ? "frontal" : "reverso";
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [fileSizeError, setFileSizeError] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [retry, setRetry] = useState<boolean>(false);
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(true);
  const [reqMessage, setReqMessage] = useState<string>("");

  const mobile: boolean = useMobile();

  const elementoScroll = useRef<HTMLDivElement>(null);

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
    validaiconDocumento.face,
    mostrarPreview,
  ]);

  useEffect(() => {
    if (ladoDocumento === "reverso" && tipoDocumento === "Pasaporte") {
      dispatch(setFotos({ labelFoto: ladoDocumento, data: imagePlaceholder }));
      setContinuarBoton(true);
    }
  }, [ladoDocumento, tipoDocumento, setContinuarBoton, dispatch]);

  useEffect(() => {
    setConteo(0);
  }, [ladoDocumento]);

  const handleCapture = (evento: React.ChangeEvent<HTMLInputElement>) => {
    evento.preventDefault();

    // const sizeLimit = 5120;

    setFileSizeError(false);
    setMessages([]);
    setContinuarBoton(false);
    setRetry(false);

    const archivo = evento.target.files?.[0];
    const fileSizeKB = archivo?.size ? archivo.size / 1024 : 0;
    const lector = new FileReader();

    console.log(fileSizeKB)

    if (archivo) lector.readAsDataURL(archivo);

    lector.onload = () => {
      const dataURL = lector.result;
      const img = new Image();
      if (typeof dataURL === "string") {
        img.src = dataURL;

        const imagen = new Image();

        imagen.src = typeof dataURL === "string" ? dataURL : "";

        imagen.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // if (fileSizeKB >= 350) {
          //   console.log("imagen pesada");
          //   const nuevoWidth = Math.floor(imagen.width / 2);
          //   const nuevoHeigth = Math.floor(imagen.height / 2);

          //   canvas.width = nuevoWidth;
          //   canvas.height = nuevoHeigth;
          // } else {
          // }
          // console.log("imagen liviana");
          canvas.width = imagen.width;
          canvas.height = imagen.height;

          ctx?.drawImage(imagen, 0, 0, imagen.width, imagen.height);

          const dataURLImage = canvas.toDataURL("image/jpeg", 0.9);

          dispatch(setFotos({ labelFoto: ladoDocumento, data: dataURLImage }));

          validarDocumento(
            id,
            dataURLImage,
            informacionFirmador.nombre,
            informacionFirmador.apellido,
            informacionFirmador.documento,
            ladoDocumento,
            tipoDocumento,
            informacion.foto_persona
          );
          // if (fileSizeKB<= sizeLimit) {
          // } else {
          //   setFileSizeError(true);
          // }
        };
      }
    };

    evento.target.value = "";
  };

  // const tomarFoto = (dataURL: string) => {
  //   setMessages([]);
  //   setContinuarBoton(false);
  //   setMostrarCamara(false);

  //   dispatch(setFotos({ labelFoto: ladoDocumento, data: dataURL }));

  //   validarDocumento(
  //     id,
  //     dataURL,
  //     informacionFirmador.nombre,
  //     informacionFirmador.apellido,
  //     informacionFirmador.documento,
  //     ladoDocumento,
  //     tipoDocumento,
  //     informacion.foto_persona
  //   );
  // };

  const retomar = () => {
    setMostrarCamara(true);
    dispatch(setFotos({ labelFoto: ladoDocumento, data: "" }));
  };

  const validarDocumento = (
    id: string | number | null | undefined,
    imagenDocumento: string | ArrayBuffer | null,
    nombre: string,
    apellido: string,
    documento: string,
    ladoDocumento: string,
    tipoDocumento: string,
    imagenPersona: string
  ) => {
    setError(false);
    setLoading(true);
    if (ladoDocumento === "anverso") {
      setReqMessage("validando el rostro en el documento, espere un momento.");
    } else {
      setReqMessage("validando el documento, espere un momento.");
    }

    const data = {
      id: id,
      imagen: imagenDocumento,
      nombre: nombre,
      apellido: apellido,
      documento: documento,
      ladoDocumento: ladoDocumento,
      tipoDocumento: tipoDocumento,
      imagenPersona: imagenPersona,
    };

    axios({
      method: "post",
      url:
        ladoDocumento == "anverso"
          ? URLS.validarDocumentoAnverso
          : URLS.validarDocumentoReverso,
      data: data,
    })
      .then((res: AxiosResponse<any>) => {
        const adviceMessages = res.data.messages;
        if (ladoDocumento === "anverso") {
          dispatch(setValidacionOCR(res.data));
          dispatch(setValidacionCodigoBarras(res.data));
          dispatch(setValidacionMRZ(res.data.mrz));
          dispatch(setValidacionRostro(res.data));
          dispatch(setFrontSide(res.data.document));
          dispatch(setFrontResult({ sideResult: res.data.validSide }));
          // dispatch(setFotos({ labelFoto: ladoDocumento, data: res.data.image }));

          if (res.data.face && res.data.validSide == "OK") {
            setConteo(0);
            setContinuarBoton(true);
          } else {
            setMessages((prevMessages) => [...prevMessages, ...adviceMessages]);
            setConteo((prev) => prev + 1);
            setRetry(true);
            // setMainCounter(prev => prev + 1)
          }

          if (conteo >= tries) {
            setMessages([]);
            setContinuarBoton(true);
            setRetry(false);
          }
        }

        if (ladoDocumento === "reverso") {
          dispatch(setValidacionCodigoBarras(res.data));
          dispatch(setValidacionMRZ(res.data.mrz));
          dispatch(setBackSide(res.data.document));
          dispatch(setBackResult({ sideResult: res.data.validSide }));

          if (res.data.validSide === "OK") {
            setConteo(0);
            setContinuarBoton(true);
          } else {
            setMessages((prevMessages) => [...prevMessages, ...adviceMessages]);
            setRetry(true);
            setConteo((prev) => prev + 1);
            setMainCounter((prev) => prev + 1);
          }

          if (conteo >= tries && attendance !== "AUTOMATICA") {
            setMessages([]);
            setContinuarBoton(true);
            setRetry(false);
          }
        }
      })
      .catch((error) => {
        setError(true);
        setLoading(false);
        console.log(error);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setReqMessage("Extrayendo información...");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <div className="documento-container">
      {tipoDocumento === "Pasaporte" && ladoDocumento === "anverso" && (
        <h2 className="documento-title">
          Subir foto del {placeholder} de su {tipoDocumento}
        </h2>
      )}

      {tipoDocumento !== "Pasaporte" && (
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
        <Alert color="danger">ha ocurrido un error con el servidor</Alert>
      )}

      {fileSizeError && (
        <Alert color="danger">
          La imagen es muy pesada, la imagen debe ser menor a 2 megabytes.
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

      {ladoDocumento === "reverso" && tipoDocumento === "Pasaporte" ? (
        <></>
      ) : (
        <>
          {mobile && (
            <>
              {mostrarCamara && preview.length <= 0 && (
                <>
                  <span className="text-center text-sm mb-2">
                    Presione el boton al final de la pantalla para tomar la foto
                    del documento
                  </span>
                  <div className="w-full h-full flex justify-center items-center">
                    {/* 
                    <img
                      src={documentIndicator}
                      alt=""
                      className="absolute z-30 w-7/12 "
                      // style={{transform: `${indicatorVertical ? 'rotate(90deg)' : 'rotate(0deg)'}`}}
                    <div className="" ref={cameraRef}>
                      <Camera
                        idealFacingMode={FACING_MODES.ENVIRONMENT}
                        onTakePhoto={(dataURL) => tomarFoto(dataURL)}
                      /> *
                    </div> 
                     */}

                    <label className="file-input">
                      <span>Tomar foto del {placeholder} de su documento</span>
                      <input type="file" accept="image/jpeg" capture="environment" className='hidden' onChange={handleCapture}/>
                    </label>


                  </div>
                  <div ref={elementoScroll}></div>
                </>
              )}
              {!mostrarCamara && !loading && (
                <button className="file-input" onClick={retomar}>
                  tomar foto de nuevo
                </button>
              )}
            </>
          )}

          {!mobile && (
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
              {retry && "Reintentar subir documento"}
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

      {preview.length >= 1 && !loading && tipoDocumento != "Pasaporte" && (
        <Previsualizacion preview={preview} nombrePreview={ladoDocumento} />
      )}

      {preview.length >= 1 &&
        !loading &&
        tipoDocumento == "Pasaporte" &&
        ladoDocumento == "anverso" && (
          <Previsualizacion preview={preview} nombrePreview={ladoDocumento} />
        )}
    </div>
  );
};
