import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { InformacionIdentidad } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "../../styles/selfie-movil.component.css";
import { Button } from "reactstrap";
import Camera from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
  alternarCamara: () => void;
}

export const CapturadorSelfie: React.FC<Props> = ({
  informacion,
  setInformacion,
  alternarCamara,
}) => {
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | undefined>("");

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

  const capturarOtra = () => {
    setMostrarPreview(false);
    setPreview("");
  };

  const tomarFoto = (dataURL: string) => {
    setMostrarPreview(true);
    setPreview(dataURL);
    toFile(dataURL, "persona_verificacion.jpg").then((res) => {
      if (res) {
        setInformacion({
          ...informacion,
          foto_persona: res,
        });
      }
    });
  };

  useEffect(() => {
    console.log(informacion.foto_persona);
    console.log(preview);
  }, [informacion, preview, setInformacion]);

  return (
    <>
      <div className="modal-container">
        <div
          className="modal-content"
          style={{
            width: "90%",
            background: "#fff",
            borderRadius: "6px",
          }}
        >
          {!mostrarPreview && (
            <>
              <Button
                color="danger"
                onClick={alternarCamara}
                style={{
                  margin: "10px 0",
                }}
              >
                Cerrar
              </Button>
              <div className="video">
                <Camera
                  onTakePhoto={(dataURL) => {
                    tomarFoto(dataURL);
                  }}
                />
              </div>
            </>
          )}

          {mostrarPreview && (
            <>
              <div className="foto">
                <img src={preview} alt="preview"/>
              </div>
              <div className="actions-container">
                <Button
                  color="danger"
                  onClick={capturarOtra}
                  style={{
                    margin: "10px 0",
                  }}
                >
                  Capturar otra vez
                </Button>
                <Button
                  color="success"
                  onClick={alternarCamara}
                  style={{
                    margin: "10px 0",
                  }}
                >
                  Guardar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
