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
import SuccessStep from "@components/ui/success-step";

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
  nextStep
}) => {
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const informacion = useSelector((state: RootState) => state.informacion);
  const validacionDocumento = useSelector(
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
  const [open, setOpen] = useState<boolean>(false);
  const [reqMessage, setReqMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false)

  const mobile: boolean = useMobile();

  const elementoScroll = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActivo, setStreamActivo] = useState<MediaStream | null>(null);

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
    validacionDocumento.face,
    mostrarPreview,
  ]);

  useEffect(() => {
    if (ladoDocumento === "reverso" && tipoDocumento === "Pasaporte") {
      dispatch(setFotos({ labelFoto: ladoDocumento, data: imagePlaceholder }));
    }
  }, [ladoDocumento, tipoDocumento, setContinuarBoton, dispatch]);


  useEffect(() => {
    setConteo(1);
    setSuccess(false)
    stopStreaming()
  }, [ladoDocumento]);


  const capturarFoto = () => {
    setMessages([]);
    setContinuarBoton(false);
    setOpen(false);

    setRetry(false);

    const canvas = document.createElement("canvas");
    if (
      videoRef.current &&
      !videoRef.current.paused &&
      !videoRef.current.ended
    ) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

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

          validarDocumento(
            id,
            dataUrl,
            informacionFirmador.nombre != null? informacionFirmador.nombre : validacionDocumento.ocr.data.name,
            informacionFirmador.apellido != null ?informacionFirmador.apellido :  validacionDocumento.ocr.data.lastName,
            informacionFirmador.documento != null ? informacionFirmador.documento : validacionDocumento.ocr.data.ID,
            ladoDocumento,
            tipoDocumento,
            informacion.foto_persona,
            informacionFirmador.pais
          );
        }
      }
    }
  };

  function stopStreaming() {
    console.log('detenido al mostrar')
    if (streamActivo) {
      streamActivo.getTracks().forEach((track) => track.stop());
      setStreamActivo(null)
    }
  }

  async function openBackByDeviceId(){
    const devs = await navigator.mediaDevices.enumerateDevices();
    const backs = devs.filter(d=>d.kind==='videoinput' && /back|rear/i.test(d.label));
    for(const d of backs){
      try{
        const stream = await navigator.mediaDevices.getUserMedia({
          video:{deviceId:{exact:d.deviceId}}, audio:false
        })
        return stream;
      } catch(e){
        return null
      }
    }
    return null;
  }

  async function iniciarCamara() {

    stopStreaming()

    const stream = await openBackByDeviceId()

    if(stream){
      console.log('usando device id')
      if (videoRef.current) {
            setStreamActivo(stream);
            videoRef.current.srcObject = stream;
            videoRef.current.autoplay = true;
            videoRef.current.muted = true;
            videoRef.current.playsInline = true;
            videoRef.current.controls = false;
            videoRef.current.play()
          }
    } else{
      console.log('usando constraints (metodo normal)')
      try {
  
        let stream;

        try{

          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: { exact: "environment" },
              width: { ideal: 4096 },
              height: { ideal: 2160 },
            }
          })

        } catch (err){
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode:"environment" ,
              width: { ideal: 4096 },
              height: { ideal: 2160 },
            }
          })
        } 

        const settings = stream.getVideoTracks()[0].getSettings();
        if (settings.facingMode !== "environment") {
          throw new Error("No se obtuvo la camara trasera");
        }

        if (videoRef.current) {
          setStreamActivo(stream);
          videoRef.current.srcObject = stream;
          videoRef.current.autoplay = true;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.controls = false;
          videoRef.current.play()
        }
      } catch (err) {
        alert(`No se puede acceder a la cámara. ${err}`);
      }
    }
  }

  const handleCapture = (evento: React.ChangeEvent<HTMLInputElement>) => {
    evento.preventDefault();

    setFileSizeError(false);
    setMessages([]);
    setContinuarBoton(false);
    setRetry(false);

    const archivo = evento.target.files?.[0];
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

          canvas.width = imagen.width;
          canvas.height = imagen.height;

          ctx?.drawImage(imagen, 0, 0, imagen.width, imagen.height);

          const dataURLImage = canvas.toDataURL("image/jpeg", 1.0);

          dispatch(setFotos({ labelFoto: ladoDocumento, data: dataURLImage }));

          validarDocumento(
            id,
            dataURLImage,
            informacionFirmador.nombre != null? informacionFirmador.nombre : validacionDocumento.ocr.data.name,
            informacionFirmador.apellido != null ?informacionFirmador.apellido :  validacionDocumento.ocr.data.lastName,
            informacionFirmador.documento != null ? informacionFirmador.documento : validacionDocumento.ocr.data.ID,
            ladoDocumento,
            tipoDocumento,
            informacion.foto_persona,
            informacionFirmador.pais
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

  const validarDocumento = (
    id: string | number | null | undefined,
    imagenDocumento: string | ArrayBuffer | null,
    nombre: string,
    apellido: string,
    documento: string,
    ladoDocumento: string,
    tipoDocumento: string,
    imagenPersona: string,
    country: string | undefined
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
      country: country
    };

    axios({
      method: "post",
      url:
        ladoDocumento == "anverso"
          ? useModel ? URLS.frontValidation :URLS.validarDocumentoAnverso
          : URLS.validarDocumentoReverso,
      data: data,
    })
      .then((res: AxiosResponse<any>) => {
        const adviceMessages = res.data.messages;
        console.log(res.data)
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
            console.log('valido')
            setSuccess(true)
            setTimeout(() => {
              nextStep()
            }, 3000)
          }

          if (res.data.validSide != "OK" && conteo < tries) {
            console.log('invalido')
            setMessages((prevMessages) => [...prevMessages, ...adviceMessages]);
            setConteo((prev) => prev + 1);
            setRetry(true);
          }

          if (conteo >= tries) {
            console.log('valido por intentos')
            setMessages([]);
            setRetry(false);
            setSuccess(true)
            setTimeout(() => {
              nextStep()
            }, 3000)
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
            console.log('valido')
            setSuccess(true)
            setTimeout(() => {
              nextStep()
            }, 3000)
          }

          if (res.data.validSide != "OK" && conteo < tries) {
            console.log('invalido')
            setMessages((prevMessages) => [...prevMessages, ...adviceMessages]);
            setRetry(true);
            setConteo((prev) => prev + 1);
            setMainCounter((prev) => prev + 1);
          }

          if (conteo >= tries) {
            console.log('valido por intentos')
            setMessages([]);
            setRetry(false);
            setSuccess(true)
            setTimeout(() => {
              nextStep()
            }, 3000)
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
      <SuccessStep show={success}/>

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
                      <div
                        className={`fixed inset-0 flex items-center justify-center z-40`}
                      >
                        <div className="bg-white p-6 w-screen h-screen z-40">
                          <div className="video-container">
                            <div className="mask-above">
                              Una vez alineado correctamente, presione el botón
                              para tomar la foto
                            </div>
                            <div className="mask-below">
                              Por favor, coloque su documento dentro del
                              recuadro rojo en pantalla y asegúrese de que quede
                              completamente visible y enfocado
                            </div>
                            <video ref={videoRef} autoPlay playsInline muted controls={false} className="z-50"></video>
                            <div className="rectangle-mask" style={{left: `${rectangulo.x * 100}%`, top: `${rectangulo.y * 100}%`, width: `${rectangulo.width * 100}%`, height: `${rectangulo.height * 100}%`}}></div>
                          </div>
                          <div className="buttons">
                            <Button color="primary" onClick={capturarFoto}>
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
                  </div>

                  <div ref={elementoScroll}></div>
                </>
              )}

              {!loading && !success && (
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

          {!mobile && !success  && (
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
