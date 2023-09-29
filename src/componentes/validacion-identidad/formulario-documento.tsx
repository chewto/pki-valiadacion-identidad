import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "../../styles/styles.css";
import "../../styles/formulario-style.component.css";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { CapturadorSelfie } from "../shared/selfie-movil";
import { Previsualizacion } from "../shared/previsualizacion";
import { useMobile } from "../../nucleo/hooks/useMobile";
import { Button } from "reactstrap";

interface Props {
  tipoDocumento: string;
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
  preview: PreviewDocumento;
  setPreview: Dispatch<SetStateAction<PreviewDocumento>>;
  ladoPreview: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  ladoDocumento: string;
}

export const FormularioDocumento: React.FC<Props> = ({
  tipoDocumento,
  informacion,
  setInformacion,
  preview,
  setPreview,
  ladoPreview,
  setContinuarBoton,
  ladoDocumento,
}) => {
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(false);
  const [mostrarPreviewCamara, setMostrarPreviewCamara] =
    useState<boolean>(false);
  const [mostrarPreviewInput, setMostrarPreviewInput] =
    useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(0);
  const mobile: boolean = useMobile();

  useEffect(() => {
    if (!mostrarPreviewInput) {
      setMostrarPreviewInput(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (conteo >= 1) setContinuarBoton(true);
    if (conteo === 0) setContinuarBoton(false);
    if (conteo === 0 && ladoPreview.length >= 1) setContinuarBoton(true);
  }, [conteo, setContinuarBoton, ladoPreview.length]);

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setMostrarPreviewInput(true);
    setMostrarPreviewCamara(false);
    setMostrarCamara(false);
    const archivo = evento.target.files?.[0];
    const lector = new FileReader();

    if (archivo) {
      setInformacion({
        ...informacion,
        [evento.target.name]: archivo,
      });
    }

    lector.onload = () => {
      setPreview({
        ...preview,
        [evento.target.name]: lector.result,
      });
    };

    if (archivo) lector.readAsDataURL(archivo);

    if (evento.target.name.length !== 0) setContinuarBoton(true);
  };

  return (
    <div className="documento-container">
      <h2 className="documento-title">
        Subir foto del {ladoDocumento} de su {tipoDocumento}
      </h2>

      <label className="file-input">
        <input
          name={ladoDocumento}
          type="file"
          accept=".jpg, .jpeg"
          onChange={cambioArchivo}
          style={{ display: "none" }}
        />
        Subir foto del {ladoDocumento} de su documento
      </label>

      {mobile &&
        (mostrarCamara ? (
          <CapturadorSelfie
            informacion={informacion}
            setInformacion={setInformacion}
            keyFoto={ladoDocumento}
            conteo={conteo}
            setConteo={setConteo}
            ladoDocumento={ladoDocumento}
            preview={preview}
            setPreview={setPreview}
            setMostrarPreviewCamara={setMostrarPreviewCamara}
          />
        ) : (
          <Button
            style={{ margin: "15px 0" }}
            block
            color="primary"
            onClick={() => {
              setMostrarCamara(true);
              setMostrarPreviewCamara(false);
              setMostrarPreviewInput(false);
              setContinuarBoton(false);
            }}
          >
            Tomar foto al {ladoDocumento} de su documento
          </Button>
        ))}
      {ladoPreview.length >= 1 && mostrarPreviewInput && (
        <Previsualizacion preview={ladoPreview} nombrePreview={ladoDocumento} />
      )}

      {ladoPreview.length >= 1 && mostrarPreviewCamara && (
        <Previsualizacion preview={ladoPreview} nombrePreview={ladoDocumento} />
      )}
    </div>
  );
};
