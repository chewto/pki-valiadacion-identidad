import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Previsualizacion } from "@components/ui/previsualizacion";
import "@styles/styles.css";
import { setVaciarFoto } from "@nucleo/redux/slices/informacionSlice";
import { useDispatch } from "react-redux";
import { Alert, Button } from "reactstrap";
import { Advertencia } from "@components/ui/advertencia";
import SuccessStep from "@components/ui/success-step";
import FaceDetection from "@layouts/face-test";

interface Props {
  preview: string;
  selfie: string;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  id: number | string | null | undefined;
  nextStep: () => void;
  tries: number;
  timestampVideo: number;
}

export const FormularioFotoPersona: React.FC<Props> = ({
  preview,
  selfie,
  setContinuarBoton,
  id,
  nextStep,
  tries,
  timestampVideo
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

  const [triesCounter, setTriesCounter] = useState<number>(tries)

  const [counter, setCounter] = useState<number>(0)

  // const [debugData, setDebugData] = useState<string[]>([]);

  // const [videoData, setVideoData] = useState<string[]>([])

  const capturarOtra = () => {
    dispatch(setVaciarFoto());
    setCapturarOtravez(false);
    setContinuarBoton(false);
    setError(false);
    setSuccess(false);
    setMessages([]);
    setTriesCounter(state => state - 1)
  };

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        nextStep()
      }, 700)
    }
  }, [success, setSuccess])

  useEffect(() => {
    if (counter == tries) {
      setSuccess(true)
      // setTimeout(() => {
      //   nextStep()
      // }, 700)
    }
  }, [counter, tries])

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
          <Alert color="warning" className="z-0">
            {/* <span className="advertencia">
              Por favor, quítese la gafas o gorra para realizar la verificación.
            </span> */}
            <p className="xsm:text-sm md:text-xl text-center p-0 m-0">
              Presione el botón para abrir su camara y prosiga. La selfie tarda
              4 segundos en ser capturada.
            </p>
          </Alert>
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
          titulo="Sugerencias para su captura"
          contenido="Por favor, tome en cuenta las siguientes indicaciones para validar su foto correctamente:"
          tipo="warning"
          onClose={() => setMessages([])}
          elemento={
            <div className="flex flex-col items-center w-full gap-3">
              <ul className="w-full flex flex-col gap-2 p-0 m-0">
                {messages.map((message: string, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 text-xs sm:text-sm text-amber-950 shadow-sm"
                  >
                    <span className="flex-shrink-0 mt-0.5 text-amber-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <span className="leading-snug">{message}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setMessages([])}
                className="w-full sm:w-auto min-w-[150px] px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center mt-1"
              >
                Entendido
              </button>
            </div>
          }
        />
      )}

      {preview.length >= 1 && mostrarPreview && (
        <Previsualizacion preview={preview} nombrePreview={selfie} />
      )}

      <div className={`${mostrarCamara ? 'flex' : 'hidden'} justify-center  mb-1`}>
        <span className="px-2 py-1 shadow-lg rounded-lg shadow-black bg-slate-200">Intentos restantes: {triesCounter + 1} </span>
      </div>

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

        <FaceDetection
          setSuccess={setSuccess}
          setContinuarBoton={setContinuarBoton}
          setMostrarPreview={setMostrarPreview}
          setCapturarOtraVez={setCapturarOtravez}
          setError={setError}
          label={selfie}
          idUsuarioFi={id}
          setMessages={setMessages}
          counter={counter}
          setCounter={setCounter}
          tries={tries}
          timestampVideo={timestampVideo}
        />
      )}
      {!mostrarCamara && (
        <button
          className="stepper-btn"
          style={{ width: "100%", margin: "10px 0 0 0" }}
          onClick={() => {
            setMostrarCamara(true);
            setCameraOpens((state) => state + 1);
            setTriesCounter(state => state - 1)
          }}
        >
          Abrir camara
        </button>
      )}
    </>
  );
};
