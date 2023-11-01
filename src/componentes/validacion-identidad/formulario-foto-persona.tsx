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
          </div>

          {mostrarCamara ? (
            <CapturadorSelfie
              informacion={informacion}
              setInformacion={setInformacion}
              keyFoto={selfie}
              conteo={conteo}
              setConteo={setConteo}
              preview={preview}
              setPreview={setPreview}
              ladoDocumento={selfie}
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

          {ladoPreview.length >= 1 && mostrarPreviewCamara && (
            <Previsualizacion preview={ladoPreview} nombrePreview={selfie} />
          )}
        </>
    </>
  );
};
