import { useState, Dispatch, SetStateAction } from "react";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "../../styles/selfie-movil.component.css";
import { Button } from "reactstrap";
import Camera, { FACING_MODES } from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import { useMobile } from "../../nucleo/hooks/useMobile";
import { convertidorFile } from "../../nucleo/services/convertidorFile";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
  keyFoto: string;
  conteo: number;
  setConteo: Dispatch<SetStateAction<number>>;
  ladoDocumento: string;
  preview: PreviewDocumento;
  setPreview: Dispatch<SetStateAction<PreviewDocumento>>;
  setMostrarPreviewCamara: Dispatch<SetStateAction<boolean>>;
}

export const CapturadorSelfie: React.FC<Props> = ({
  informacion,
  setInformacion,
  keyFoto,
  conteo,
  setConteo,
  ladoDocumento,
  preview,
  setPreview,
  setMostrarPreviewCamara,
}) => {
  const mobile: boolean = useMobile();

  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [cambioCamara, setCambioCamara] = useState<boolean>(true);

  const cambiarCamara = () => {
    setCambioCamara((prev) => !prev);
    console.log(cambioCamara);
  };

  const capturarOtra = () => {
    setMostrarPreview(false);
    setPreview({
      ...preview,
      [ladoDocumento]: "",
    });
    setConteo(0);
  };

  const tomarFoto = (dataURL: string, keyFotoParam: string) => {
    setMostrarPreview(true);
    setPreview({
      ...preview,
      [ladoDocumento]: dataURL,
    });
    convertidorFile(dataURL, "verificacion.jpg").then((res) => {
      if (res) {
        setInformacion({
          ...informacion,
          [keyFotoParam]: res,
        });
      }
    });
    setConteo(conteo + 1);
    setMostrarPreviewCamara(true);
  };

  return (
    <>
      <div className="selfie-container">
        {!mostrarPreview && (
          <>
            <div className="video">
              <Camera
                idealResolution={{
                  width: mobile ? 500 : 600,
                  height: mobile ? 400 : 350,
                }}
                idealFacingMode={
                  cambioCamara ? FACING_MODES.USER : FACING_MODES.ENVIRONMENT
                }
                onTakePhoto={(dataURL) => {
                  tomarFoto(dataURL, keyFoto);
                }}
              />

              <div className="mascara">
                {keyFoto === "foto_persona" && (
                  <div className="indicador-persona"></div>
                )}

                {keyFoto === "reverso" && (
                  <div className="indicador-documento"></div>
                )}
                {keyFoto === "anverso" && (
                  <div className="indicador-documento"></div>
                )}
              </div>

              <Button
                color="primary"
                style={{ margin: "60px 0 0 0", display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                onClick={cambiarCamara}
              >
                Cambiar camara
                <span className="material-symbols-outlined">autorenew</span>
              </Button>

              {/* <Input
                type="select"
                onChange={onChangeCamara}
                style={{ margin: "55px 0 0 0" }}
              >
                <option value={FACING_MODES.ENVIRONMENT}>Cámara frontal</option>
                <option value={FACING_MODES.USER}>Cámara trasera</option>
              </Input> */}
            </div>
          </>
        )}

        {mostrarPreview && (
          <>
            <div className="preview">
              <Button color="danger" onClick={capturarOtra}>
                Capturar otra vez
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
