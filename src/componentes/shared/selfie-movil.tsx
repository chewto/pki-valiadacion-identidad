import { useState, Dispatch, SetStateAction } from "react";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "../../styles/selfie-movil.component.css";
import { Button, Input } from "reactstrap";
import Camera, { FACING_MODES } from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import { useMobile } from "../../nucleo/hooks/useMobile";

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
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [cambioCamara, setCambioCamara] = useState<any>(
    FACING_MODES.ENVIRONMENT
  );

  const mobile: boolean = useMobile();

  const toFile = async (dataURL: string | undefined, nombreArchivo: string) => {
    try {
      if (dataURL) {
        const response = await fetch(dataURL);
        const blob = await response.blob();
        const archivo = new File([blob], nombreArchivo, { type: blob.type });
        return archivo;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onChangeCamara = (event: React.ChangeEvent<HTMLInputElement>) => {
    const camara = event.target.value;
    setCambioCamara(camara);
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
    toFile(dataURL, "verificacion.jpg").then((res) => {
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
                idealFacingMode={cambioCamara}
                onTakePhoto={(dataURL) => {
                  tomarFoto(dataURL, keyFoto);
                }}
              />
              {mobile && (
                <Input
                  type="select"
                  onChange={onChangeCamara}
                  style={{ margin: "20px 0" }}
                >
                  <option value={FACING_MODES.ENVIRONMENT}>
                    Camara frontal
                  </option>
                  <option value={FACING_MODES.USER}>Camara trasera</option>
                </Input>
              )}
            </div>
          </>
        )}

        {mostrarPreview && (
          <>
            <div className="preview">
              <Button
                color="danger"
                onClick={capturarOtra}
              >
                Capturar otra vez
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
