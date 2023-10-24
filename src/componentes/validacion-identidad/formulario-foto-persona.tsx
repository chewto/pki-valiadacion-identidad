import { Dispatch, SetStateAction, useState } from "react";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { CapturadorSelfie } from "../shared/selfie-movil";
import { Previsualizacion } from "../shared/previsualizacion";
import "../../styles/styles.css";
//import { SpinnerLoading } from "../shared/spinner-loading";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
  preview: PreviewDocumento;
  setPreview: Dispatch<SetStateAction<PreviewDocumento>>;
  ladoPreview: string;
  selfie: string;
  mano: string[];
  setMano: Dispatch<SetStateAction<string[]>>
}

export const FormularioFotoPersona: React.FC<Props> = ({
  informacion,
  setInformacion,
  preview,
  setPreview,
  ladoPreview,
  selfie
}) => {


  // const dedos = ['pulgar','indice', 'medio', 'anular', 'meñique']
  const [conteo, setConteo] = useState<number>(0);
  const [mostrarPreviewCamara, setMostrarPreviewCamara] =
    useState<boolean>(false);
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(false);

  function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomNumber(1, 5);


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
              margin: "23px 0 0 0",
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
      {/* )} */}
    </>
  );
};
