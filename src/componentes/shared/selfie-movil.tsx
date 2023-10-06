import { useState, Dispatch, SetStateAction } from "react";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "../../styles/selfie-movil.component.css";
import { Button } from "reactstrap";
import Camera, { FACING_MODES, IMAGE_TYPES } from "react-html5-camera-photo";
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

  const capturarOtra = () => {
    setMostrarPreview(false);
    setPreview({
      ...preview,
      [ladoDocumento]: "",
    });
    setConteo(0);
  };

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const data = evento.target.files;
    if (data) {
      console.log(data[0]);

      const reader = new FileReader();

      reader.onloadend = () => {
        setPreview({
          ...preview,
          [evento.target.name]: reader.result as string,
        });
      };

      if (data) {
        reader.readAsDataURL(data[0]);
      }

      setMostrarPreview(true);
      setInformacion({
        ...informacion,
        [evento.target.name]: data[0],
      });
      setConteo(conteo + 1);
      setMostrarPreviewCamara(true);
    }
  };


  return (
    <>
      <div className="selfie-container">
        {!mostrarPreview && (
          <>
            <div className="video">
              {keyFoto === "foto_persona" && (
                <>
                  <Camera
                    idealResolution={{
                      width: mobile ? 500 : 600,
                      height: mobile ? 600 : 350,
                    }}
                    imageType={IMAGE_TYPES.JPG}
                    idealFacingMode={FACING_MODES.USER}
                    onTakePhoto={(dataURL) => {
                      tomarFoto(dataURL, keyFoto);
                    }}
                  />
                </>
              )}
              {keyFoto === "foto_persona" && (
                <div className="mascara">
                  <div className="indicador-persona"></div>
                </div>
              )}

              {keyFoto === "anverso" && (
                <label className="file-input-camara">
                  <input
                    name={ladoDocumento}
                    type="file"
                    accept="image/jpeg"
                    onChange={cambioArchivo}
                    style={{ display: "none", zIndex: "8000", background: '#5ecc7f' }}
                    capture="environment"
                  />
                  Usar camara trasera
                </label>
              )}

              {keyFoto === "reverso" && (
                <label className="file-input-camara">
                  <input
                    name={ladoDocumento}
                    type="file"
                    accept="image/jpeg"
                    onChange={cambioArchivo}
                    style={{ display: "none", zIndex: "8000", background: '#5ecc7f' }}
                    capture="environment"
                  />
                  Usar camara trasera
                </label>
              )}
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
