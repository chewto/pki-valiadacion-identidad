import { Dispatch, SetStateAction, useState } from "react";
import { Button, FormGroup, Input, Label } from "reactstrap";
import { InformacionIdentidad } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { CapturadorSelfie } from "./selfie-movil";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
}

export const FormularioFotoPersona: React.FC<Props> = ({
  informacion,
  setInformacion,
}) => {
  const esMobile = () => {
    const regex =
      /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(navigator.userAgent);
  };

  const movil = esMobile();

  const [mostrarCamara, setMostrarCamara] = useState<boolean>(false)

  const alternarCamara = () => setMostrarCamara(!mostrarCamara)

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
      {movil ?(
        <Button color="primary" onClick={alternarCamara} style={{margin: '5px 0 23px 0'}}>Tomar foto</Button>
      ) :(<div>
        <FormGroup>
          <Label>Foto de su persona</Label>
          <Input
            name="foto_persona"
            type="file"
            accept=".jpg, .jpeg, .png"
            onChange={cambioArchivo}
          />
        </FormGroup>
      </div>)}


      {mostrarCamara && (
        <CapturadorSelfie
          informacion={informacion}
          setInformacion={setInformacion}
          alternarCamara={alternarCamara}
        />
      )}
    </>
  );
};
