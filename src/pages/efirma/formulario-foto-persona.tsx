import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Previsualizacion } from "@components/ui/previsualizacion";
import "@styles/styles.css";
import { setVaciarFoto } from "@nucleo/redux/slices/informacionSlice";
import { useDispatch } from "react-redux";
import { Alert, Button } from "reactstrap";
import { ValidacionVida } from "./validacion-vida";
import { useSearchParams } from "react-router-dom";
import { Advertencia } from "@components/ui/advertencia";
//import { SpinnerLoading } from "../shared/spinner-loading";

interface Props {
  preview: string;
  selfie: string;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
}

export const FormularioFotoPersona: React.FC<Props> = ({
  preview,
  selfie,
  setContinuarBoton,
}) => {
  const iphone = /iPhone/i.test(navigator.userAgent);

  const dispatch = useDispatch();

  const [params] = useSearchParams();

  const idUsuarioParam = params.get("idUsuario");

  useEffect(() => {
    setContinuarBoton(false);
  }, []);

  const [success, setSuccess] = useState<boolean>(false);
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([])
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(
    iphone ? true : false
  );
  const [error, setError] = useState<boolean>(false);

  const [capturarOtraVez, setCapturarOtravez] = useState<boolean>(false);

  const capturarOtra = () => {
    dispatch(setVaciarFoto());
    setCapturarOtravez(false);
    setContinuarBoton(false);
    setError(false);
    setSuccess(false);
    setMessages([])
  };

  useEffect(() => {
    console.log(messages)
  },[messages, setMessages])

  return (
    <>
      <div
        style={{
          textAlign: "center",
          fontSize: "20px",
        }}
      >
        <p style={{ margin: "0" }}>Realice un selfie para la verificación </p>
        {!mostrarCamara && (
          <>
            <span className="advertencia">
              Por favor, quítese la gafas o gorra para realizar la verificación.
            </span>
            <p className="advertencia" style={{ margin: "15px 0 0 0" }}>
              Presione el botón para abrir su camara y prosiga. La selfie tarda 4 segundos en ser capturada.
            </p>
          </>
        )}
      </div>

      {success && (
        <Alert color="success" style={{ textAlign: "center" }}>
          Seleccione continuar
        </Alert>
      )}
      {error && (
        <Alert color="danger" style={{ textAlign: "center" }}>
          Ha ocurrido un error en el servidor
        </Alert>
      )}

      {messages.length >= 1  && (
        <Advertencia
          titulo="Advertencia"
          contenido=""
          elemento={
          <div>
            <ul className="p-0">
              {messages.map((message:string) => (
                <li className="bg-red-200 px-2 py-2 rounded-xl border-2 border-red-500 text-xl">{message}</li>
              ))}
            </ul>

            <button onClick={() => setMessages([])} className="stepper-btn mt-2">cerrar</button>
          </div>}
        />
      )}

      {preview.length >= 1 && mostrarPreview && (
        <Previsualizacion preview={preview} nombrePreview={selfie} />
      )}

      {capturarOtraVez && (
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
          idUsuarioFi={idUsuarioParam}
          setMessages={setMessages}
        />
      )}
      {!mostrarCamara && (
        <button
          className="stepper-btn"
          style={{ width: "100%", margin: "10px 0 0 0" }}
          onClick={() => {
            setMostrarCamara(true);
          }}
        >
          Abrir camara
        </button>
      )}
    </>
  );
};
