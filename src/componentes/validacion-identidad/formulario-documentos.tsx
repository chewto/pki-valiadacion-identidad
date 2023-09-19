import { Dispatch, SetStateAction, useState } from "react";
import { FormGroup, Label, Input } from "reactstrap";
import "../../styles/styles.css";
import "../../styles/formulario-style.component.css";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";


interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
}

export const FormularioDocumentos: React.FC<Props> = ({
  informacion,
  setInformacion,
}) => {
  const [previewDocumento, setPreviewDocumento] = useState<PreviewDocumento>({
    anverso: "",
    reverso: "",
  });

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    const lector = new FileReader();

    if (archivo) {
      setInformacion({
        ...informacion,
        [evento.target.name]: archivo,
      });
    }

    lector.onload = () => {
      setPreviewDocumento({
        ...previewDocumento,
        [evento.target.name]: lector.result,
      });
    };

    if (archivo) lector.readAsDataURL(archivo);
  };

  return (
    <>
      <FormGroup>
        <Label>Anverso del documento</Label>
        <Input
          name="anverso"
          type="file"
          accept=".jpg, .jpeg, .png"
          onChange={cambioArchivo}
        />
      </FormGroup>

      {previewDocumento.anverso.length !== 0 && (
        <div className="img-container">
          <img src={previewDocumento.anverso} alt="anverso" />
        </div>
      )}

      <FormGroup>
        <Label>Reverso del documento</Label>
        <Input
          name="reverso"
          type="file"
          accept=".jpg, .jpeg, .png"
          onChange={cambioArchivo}
        />

        {previewDocumento.reverso.length !== 0 && (
          <div className="img-container">
            <img src={previewDocumento.reverso} alt="reverso" />
          </div>
        )}
      </FormGroup>
    </>
  );
};
