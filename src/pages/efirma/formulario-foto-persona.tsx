import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Previsualizacion } from "@components/ui/previsualizacion";
import "@styles/styles.css";
import { setVaciarFoto } from "@nucleo/redux/slices/informacionSlice";
import { useDispatch } from "react-redux";
import { Alert, Button } from "reactstrap";
import { ValidacionVida } from "./validacion-vida";
import { Advertencia } from "@components/ui/advertencia";
import SuccessStep from "@components/ui/success-step";
//import { SpinnerLoading } from "../shared/spinner-loading";

interface Props {
  preview: string;
  selfie: string;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  id: number | string | null | undefined;
  nextStep: () => void;
}

export const FormularioFotoPersona: React.FC<Props> = ({
  preview,
  selfie,
  setContinuarBoton,
  id,
  nextStep,
}) => {
  const iphone = /iPhone/i.test(navigator.userAgent);

  const dispatch = useDispatch();

  useEffect(() => {
    setContinuarBoton(false);
  }, []);

  const [success, setSuccess] = useState<boolean>(false);
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(
    iphone ? true : false
  );
  const [error, setError] = useState<boolean>(false);

  const [capturarOtraVez, setCapturarOtravez] = useState<boolean>(false);
  const [cameraOpens, setCameraOpens] = useState<number>(0);

  const [debugData, setDebugData] = useState<string[]>([]);

  const [videoData, setVideoData] = useState<string[]>([])

  const capturarOtra = () => {
    dispatch(setVaciarFoto());
    setCapturarOtravez(false);
    setContinuarBoton(false);
    setError(false);
    setSuccess(false);
    setMessages([]);
  };

  // useEffect(() => {
  //   console.log(debugData, debugData.length, typeof debugData);
  // }, [debugData, setDebugData]);

  useEffect(() => {
    console.log(videoData)
  }, [videoData, setVideoData])

  useEffect(() => {
    if(success){
      setTimeout(() => {
        nextStep()
      }, 3000)
    }
  }, [success,setSuccess])

  return (
    <>
      <SuccessStep show={success} />
      <div
        style={{
          textAlign: "center",
          fontSize: "20px",
        }}
      >
        <p style={{ margin: "0" }}>Realice un selfie para la verificación </p>
        {!mostrarCamara && cameraOpens <= 0 && (
          <>
            <span className="advertencia">
              Por favor, quítese la gafas o gorra para realizar la verificación.
            </span>
            <p className="advertencia" style={{ margin: "15px 0 0 0" }}>
              Presione el botón para abrir su camara y prosiga. La selfie tarda
              4 segundos en ser capturada.
            </p>
          </>
        )}
      </div>

      {/* {success && (
        // <Alert color="success" style={{ textAlign: "center" }}>
        //   Seleccione continuar
        // </Alert>
      )} */}
      {error && (
        <Alert color="danger" style={{ textAlign: "center" }}>
          Ha ocurrido un error en el servidor
        </Alert>
      )}

      {messages.length >= 1 && (
        <Advertencia
          titulo="Advertencia"
          contenido=""
          elemento={
            <div>
              <ul className="p-0">
                {messages.map((message: string, index) => (
                  <li
                    key={index}
                    className="bg-yellow-200 px-2 py-2 rounded-xl border-2 border-yellow-500 text-xl"
                  >
                    {message}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setMessages([])}
                className="stepper-btn mt-2"
              >
                cerrar
              </button>
            </div>
          }
        />
      )}

      {preview.length >= 1 && mostrarPreview && (
        <Previsualizacion preview={preview} nombrePreview={selfie} />
      )}

      {capturarOtraVez && !success && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: "1500",
          }}
        >
          <Button color="success" onClick={capturarOtra}>
            Capturar otra vez, si la imagen no se ve correctamente
          </Button>
        </div>
      )}

      {mostrarCamara && !capturarOtraVez && (
        <ValidacionVida
          setSuccess={setSuccess}
          setContinuarBoton={setContinuarBoton}
          setMostrarPreview={setMostrarPreview}
          setCapturarOtraVez={setCapturarOtravez}
          setError={setError}
          label={selfie}
          idUsuarioFi={id}
          setMessages={setMessages}
          setDebugData={setDebugData}
          setVideoData={setVideoData}
        />
      )}
      {!mostrarCamara && (
        <button
          className="stepper-btn"
          style={{ width: "100%", margin: "10px 0 0 0" }}
          onClick={() => {
            setMostrarCamara(true);
            setCameraOpens((state) => state + 1);
          }}
        >
          Abrir camara
        </button>
      )}

      <div className="hidden">
        <div
        style={{
          maxHeight: "120px",
          overflowY: "auto",
          background: "#f5f5f5",
          padding: "8px",
          borderRadius: "6px",
          marginTop: "12px",
        }}
        className="border-2 border-black w-full"
      >
        <span>body - video info</span>
        <ul>
          {videoData.map((item, idx) => (
            <li key={idx} style={{ fontSize: "12px", color: "#333" }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div
        style={{
          maxHeight: "120px",
          overflowY: "auto",
          background: "#f5f5f5",
          padding: "8px",
          borderRadius: "6px",
          marginTop: "12px",
        }}
        className="border-2 border-black w-full"
      >
        <span>respuesta</span>
        <ul>
          {debugData.map((item, idx) => (
            <li key={idx} style={{ fontSize: "12px", color: "#333" }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
      
      </div>
    </>
  );
};
