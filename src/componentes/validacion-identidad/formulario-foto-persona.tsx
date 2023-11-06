import { useState } from "react";
import { CapturadorSelfie } from "../shared/selfie-movil";
import { Previsualizacion } from "../shared/previsualizacion";
import "../../styles/styles.css";
//import { SpinnerLoading } from "../shared/spinner-loading";

interface Props {
  preview: string;
  selfie: string;
}

export const FormularioFotoPersona: React.FC<Props> = ({
  preview,
  selfie
}) => {

  const [conteo, setConteo] = useState<number>(0);
  const [mostrarPreviewCamara, setMostrarPreviewCamara] =
    useState<boolean>(false);
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(false);


  return (
    <>
      {/* {porcentaje === undefined ? (
        <>
          <SpinnerLoading />
        </>
      ) : ( */}
        <>
          <div
            style={{
              textAlign: "center",
              fontSize: "22px",
            }}
          >
            <p>Realice un selfie para la verificación </p>
            <span style={{fontSize: '16px', margin: '0 0 10px 0', textAlign: 'center'}}>Por favor, quítese la gafas o gorra para realizar la verificación.</span>
          </div>

          {mostrarCamara ? (
            <CapturadorSelfie
              labelFoto={selfie}
              conteo={conteo}
              setConteo={setConteo}
              setMostrarPreviewCamara={setMostrarPreviewCamara}
            />
          ) : (
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

          {preview.length >= 1 && mostrarPreviewCamara && (
            <Previsualizacion preview={preview} nombrePreview={selfie} />
          )}
        </>
    </>
  );
};
