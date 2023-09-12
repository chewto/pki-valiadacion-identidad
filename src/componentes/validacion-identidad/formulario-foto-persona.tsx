import { Dispatch, SetStateAction } from "react";
import { FormGroup, Input, Label } from "reactstrap";
import { InformacionIdentidad } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
}

export const FormularioFotoPersona: React.FC<Props> = ({
  informacion,
  setInformacion,
}) => {
  const cambioArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];

    if (archivo) {
      setInformacion({
        ...informacion,
        [event.target.name]: archivo,
      });

      console.log(informacion);
    }
  };

  return (
    <>
      <div>
        <FormGroup>
          <Label>Foto de su persona</Label>
          <Input
            name="foto_persona"
            type="file"
            accept=".jpg, .jpeg, .png"
            onChange={cambioArchivo}
          />
        </FormGroup>
      </div>
    </>
  );
};
