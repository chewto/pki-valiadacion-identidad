import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CapturadorSelfie } from "../shared/selfie-movil";
import { Previsualizacion } from "../shared/previsualizacion";
import "../../styles/styles.css";
import { setFotos, setVaciarFoto } from "../../nucleo/redux/slices/informacionSlice";
import { useDispatch } from "react-redux";
import { Alert, Button } from "reactstrap";
//import { SpinnerLoading } from "../shared/spinner-loading";

interface Props {
  preview: string;
  selfie: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
}

export const FormularioFotoPersona: React.FC<Props> = ({
  preview,
  selfie,
  continuarBoton,
  setContinuarBoton,
}) => {
  
  const iphone = /iPhone/i.test(navigator.userAgent);

  const dispatch = useDispatch()

  useEffect(() => {
    setContinuarBoton(false);
  }, []);

  const [mostrarMensaje, setMostrarMensaje] = useState<boolean>(false)
  const [mostrarPreviewCamara, setMostrarPreviewCamara] =
    useState<boolean>(false);
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(iphone ? true : false);

  const [capturarOtraVez, setCapturarOtravez] = useState<boolean>(false);

  const capturarOtra = () => {
    dispatch(setVaciarFoto())
    setCapturarOtravez(false);
    setContinuarBoton(false)
  };

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    evento.preventDefault();
    setMostrarMensaje(false);

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
          setMostrarMensaje(true)
          setContinuarBoton(true)
          setMostrarPreviewCamara(true)
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const nuevoWidth = Math.floor(imagen.width / 2);
          const nuevoHeigth = Math.floor(imagen.height / 2);

          canvas.width = nuevoWidth;
          canvas.height = nuevoHeigth;

          ctx?.drawImage(imagen, 0, 0, nuevoWidth, nuevoHeigth);

          const imagenResized = canvas.toDataURL("image/jpeg");

          dispatch(setFotos({ labelFoto: selfie, data: imagenResized }));
        };
      }
    };

    evento.target.value = "";
  };

  return (
    <>
      <>
        <div
          style={{
            textAlign: "center",
            fontSize: "20px",
          }}
        >
          <p style={{margin: '0'}}>Realice un selfie para la verificación </p>
          <span className="advertencia"
            style={{
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            Por favor, quítese la gafas o gorra para realizar la verificación.
          </span>
        </div>

        {mostrarMensaje && (
          <Alert color="success">Seleccione continuar</Alert>
        )}

        {preview.length >= 1 && mostrarPreviewCamara && (
          <Previsualizacion preview={preview} nombrePreview={selfie} />
        )}

        {capturarOtraVez && (
          <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <Button color="success" onClick={capturarOtra}>
            Capturar otra vez, si la imagen no se ve correctamente
          </Button>
          </div>
        )}

        {mostrarCamara && (
          <>
            {iphone && (
              <label
              className="file-input"
              style={{
                background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
              }}
            >
              <input
                name={selfie}
                type="file"
                accept="image/jpeg"
                onChange={cambioArchivo}
                style={{
                  display: "none",
                  zIndex: "8000",
                  background: "#5ecc7f",
                }}
                capture="user"
              />
              {preview.length >= 1 ? (
                `Presione aqui si desea tomar otra selfie`
              ) : (
                `Tomar selfie`
              )}
            </label>
            )}
            {!iphone && !capturarOtraVez && (
              <CapturadorSelfie
                labelFoto={selfie}
                setMostrarPreviewCamara={setMostrarPreviewCamara}
                continuarBoton={continuarBoton}
                setContinuarBoton={setContinuarBoton}
                setCapturarOtravez={setCapturarOtravez}
                capturarOtravez={capturarOtraVez}
              />
            )}
          </>
        )}
        { !mostrarCamara && (
          <button
            className="stepper-btn"
            style={{ width: "100%", margin: "10px 0 0 0" }}
            onClick={() => {
              setMostrarCamara(true);
            }}
          >
            Tomar selfie
          </button>
        )}

      </>
    </>
  );
};
