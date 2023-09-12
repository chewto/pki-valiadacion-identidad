import { Container } from "reactstrap";
import { Dispatch, SetStateAction } from "react";
import { InformacionIdentidad } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
}

export const MuestraDatos: React.FC<Props> = ({
  informacion,
  setInformacion,
}) => {
  // const cambioData = (evento: React.ChangeEvent<HTMLInputElement>) => {
  //   const valor = evento.target.value;

  //   setInformacion({
  //     ...informacion,
  //     [evento.target.name]: valor,
  //   });

  //   console.log(evento.target.name);
  // };

  return (
    <>
      <Container>
        <h3>Datos firmante</h3>
      </Container>
      <Container className="bg-light border" fluid>
        <p>Nombres: {informacion.nombres}</p>
      </Container>
      <Container className="bg-light border" fluid>
        <p>Apellidos: {informacion.apellidos}</p>
      </Container>
      <Container className="bg-light border" fluid>
        <p>Numero de documento: {informacion.numero_documento}</p>
      </Container>
    </>
  );
};
