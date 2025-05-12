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
import { Alert, Button, Spinner } from "reactstrap";
import "react-html5-camera-photo/build/css/index.css";
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";
import { imagePlaceholder } from "@components/dataurl";
import { Advertencia } from "@components/ui/advertencia";
import "@styles/camara.css";

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
  const [conteo, setConteo] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [fileSizeError, setFileSizeError] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [retry, setRetry] = useState<boolean>(false);
  // const [mostrarCamara, setMostrarCamara] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  // const [init, setInit] = useState<boolean>(true)
  const [reqMessage, setReqMessage] = useState<string>("");

  const mobile: boolean = useMobile();

  const elementoScroll = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  // let imgCaptura = document.getElementById('captura');
  // let tomarFotoBtn = document.getElementById('tomarFoto');
  // let descargarFotoBtn = document.getElementById('descargarFoto');
  const [streamActivo, setStreamActivo] = useState<MediaStream>();

  const rectangulo = {
    x: 0.02, // 10% desde el lado izquierdo
    y: 0.2, // 20% desde la parte superior
    width: 0.95, // 80% del ancho
    height: 0.35, // 30% de la altura
  };

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
    console.log(messages)
  }, [messages])

  useEffect(() => {
    setConteo(0);
  }, [ladoDocumento]);

  const capturarFoto = () => {
    setMessages([]);
    setContinuarBoton(false);
    setOpen(false);
    // setMostrarCamara(false)

    setRetry(false);

    const canvas = document.createElement("canvas");
    if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      // Dibuja la imagen completa del video en el canvas
      if (ctx) {
        const x = rectangulo.x * canvas.width;
        const y = rectangulo.y * canvas.height;
        const width = rectangulo.width * canvas.width;
        const height = rectangulo.height * canvas.height;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(x, y, width, height);
        const canvasRecortada = document.createElement("canvas");
        canvasRecortada.width = width;
        canvasRecortada.height = height;
        const ctxRecortado = canvasRecortada.getContext("2d");

        if (ctxRecortado) {
          ctxRecortado.putImageData(imageData, 0, 0);
          const dataUrl = canvasRecortada.toDataURL("image/jpeg", 1.0);

          dispatch(setFotos({ labelFoto: ladoDocumento, data: dataUrl }));

          // setMostrarCamara(false);

          validarDocumento(
            id,
            dataUrl,
            informacionFirmador.nombre,
            informacionFirmador.apellido,
            informacionFirmador.documento,
            ladoDocumento,
            tipoDocumento,
            informacion.foto_persona
          );
        }
      }
    }
  };

  async function iniciarCamara() {
    // console.log('funcionando')
    // setMostrarCamara(true);
    // setInit(false)

    if (streamActivo) {
      streamActivo.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: "environment", // 📌 Cámara trasera por defecto
          width: { ideal: 4096 },
          height: { ideal: 2160 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setStreamActivo(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se puede acceder a la cámara.");
    }
  }

  const handleCapture = (evento: React.ChangeEvent<HTMLInputElement>) => {
    evento.preventDefault();

    // const sizeLimit = 5120;

    setFileSizeError(false);
    setMessages([]);
    setContinuarBoton(false);
    setRetry(false);

    const archivo = evento.target.files?.[0];
    // const fileSizeKB = archivo?.size ? archivo.size / 1024 : 0;
    const lector = new FileReader();

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

          const dataURLImage = canvas.toDataURL("image/jpeg", 1.0);

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

  // const retomar = () => {
  //   if (mobile) {
  //     iniciarCamara();
  //   }
  //   dispatch(setFotos({ labelFoto: ladoDocumento, data: "" }));
  // };



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
      test: false,
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
        console.log(res.data);
        const adviceMessages = res.data.messages;
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
            setConteo(0);
            setContinuarBoton(true);
          } 
          
          if(res.data.validSide != "OK" && conteo < tries){
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
          dispatch(
            setFotos({ labelFoto: ladoDocumento, data: res.data.image })
          );

          if (res.data.validSide === "OK") {
            setConteo(0);
            setContinuarBoton(true);
          } 
          
          if(res.data.validSide != "OK" && conteo < tries){
            setMessages((prevMessages) => [...prevMessages, ...adviceMessages]);
            setRetry(true);
            setConteo((prev) => prev + 1);
            setMainCounter((prev) => prev + 1);
          }

          if (conteo >= tries) {
            console.log(conteo, tries)
            setMessages([]);
            setContinuarBoton(true);
            setRetry(false);
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
      });
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
                    {/* {message} */}
                    Por favor, se requiere una foto del documento con mejor resolución, inténtelo nuevamente.
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
              {open && (
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

                    {/* <label className="file-input">
                      <span>Tomar foto del {placeholder} de su documento</span>
                      <input type="file" accept="image/jpeg" capture="environment" className='hidden' onChange={handleCapture} disabled={loading}/>
                    </label> */}
                    {/* 
                    <h1>capturar foto</h1>
                    <div>
                      <video ref={videoRef}></video>
                    </div> */}
                    <>
                      <div
                        className={`fixed inset-0 flex items-center justify-center z-50`}
                      >
                        <div className="bg-white p-6 w-screen h-screen">
                          <div className="video-container">
                            <div className="mask-above">
                            Una vez alineado correctamente, presione el botón para tomar la foto
                            </div>
                            <div className="mask-below">
                            Por favor, coloque su documento dentro del recuadro rojo en pantalla y asegúrese de que quede completamente visible y enfocado
                            </div>
                            <video ref={videoRef} autoPlay playsInline></video>
                            <div className="rectangle-mask"></div>
                          </div>
                          <div className="buttons">
                            <Button
                              color="primary"
                              onClick={capturarFoto}
                            >
                              📷 Capturar
                            </Button>

                            <Button
                              color="danger"
                              onClick={() => setOpen(false)}
                            >
                              cerrar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  </div>

                  <div ref={elementoScroll}></div>
                </>
              )}

              {!loading && (
                <button
                  className="file-input"
                  onClick={() => {
                    setOpen(true);
                    iniciarCamara();
                  }}
                >
                  Tomar foto
                </button>
              )}

              {retry && !continuarBoton && (
                <Alert color="warning" className="text-center z-0">
                  vuelva a intentarlo
                </Alert>
              )}

              {/* {!mostrarCamara && retry && (
                <button className="file-input" onClick={retomar}>
                  tomar foto de nuevo
                </button>
              )} */}
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
