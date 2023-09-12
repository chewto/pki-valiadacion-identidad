import { Dispatch, SetStateAction } from "react";
import { FormGroup, Label, Input } from "reactstrap";
import "../../styles/styles.css";
import { InformacionIdentidad } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
}

export const FormularioDocumentos: React.FC<Props> = ({
  informacion,
  setInformacion,
}) => {
  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];

    if (archivo) {
      setInformacion({
        ...informacion,
        [evento.target.name]: archivo,
      });
    }
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
      <FormGroup>
        <Label>Reverso del documento</Label>
        <Input
          name="reverso"
          type="file"
          accept=".jpg, .jpeg, .png"
          onChange={cambioArchivo}
        />
      </FormGroup>
    </>
  );
};
