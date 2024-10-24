import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Previsualizacion } from "@components/ui/previsualizacion";
import "@styles/styles.css";
import { setVaciarFoto } from "@nucleo/redux/slices/informacionSlice";
import { useDispatch } from "react-redux";
import { Alert, Button } from "reactstrap";
import { ValidacionVida } from "./validacion-vida";
import { useSearchParams } from "react-router-dom";
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

  const [mostrarMensaje, setMostrarMensaje] = useState<boolean>(false);
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
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
    setMostrarMensaje(false);
  };

  // const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
  //   evento.preventDefault();
  //   setMostrarMensaje(false);

  //   const archivo = evento.target.files?.[0];
  //   const lector = new FileReader();

  //   if (archivo) lector.readAsDataURL(archivo);

  //   lector.onload = () => {
  //     const dataURL = lector.result;
  //     const img = new Image();
  //     if (typeof dataURL === "string") {
  //       img.src = dataURL;

  //       const imagen = new Image();

  //       imagen.src = typeof dataURL === "string" ? dataURL : "";

  //       imagen.onload = () => {
  //         setMostrarMensaje(true);
  //         setContinuarBoton(true);
  //         setMostrarPreview(true);
  //         const canvas = document.createElement("canvas");
  //         const ctx = canvas.getContext("2d");

  //         const nuevoWidth = Math.floor(imagen.width / 2);
  //         const nuevoHeigth = Math.floor(imagen.height / 2);

  //         canvas.width = nuevoWidth;
  //         canvas.height = nuevoHeigth;

  //         ctx?.drawImage(imagen, 0, 0, nuevoWidth, nuevoHeigth);

  //         const imagenResized = canvas.toDataURL("image/jpeg");

  //         dispatch(setFotos({ labelFoto: selfie, data: imagenResized }));
  //       };
  //     }
  //   };

  //   evento.target.value = "";
  // };

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

      {mostrarMensaje && (
        <Alert color="success" style={{ textAlign: "center" }}>
          Seleccione continuar
        </Alert>
      )}
      {error && (
        <Alert color="danger" style={{ textAlign: "center" }}>
          Ha ocurrido un error en el servidor
        </Alert>
      )}

      {preview.length >= 1 && mostrarPreview && (
        <Previsualizacion preview={preview} nombrePreview={selfie} />
      )}
      
      {preview.length <= 0 && mostrarPreview && capturarOtraVez && (
        <Alert color="danger">No se ha detectado ningún rostro, vuelva a intentarlo.</Alert>
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
          setMostrarMensaje={setMostrarMensaje}
          setContinuarBoton={setContinuarBoton}
          setMostrarPreview={setMostrarPreview}
          setCapturarOtraVez={setCapturarOtravez}
          setError={setError}
          label={selfie}
          idUsuarioFi={idUsuarioParam}
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
