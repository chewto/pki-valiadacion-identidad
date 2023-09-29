import { Alert, Spinner } from "reactstrap";
import "../../styles/mensaje-style.component.css";
import { Dispatch, SetStateAction } from "react";
import { Mensaje } from "./mensaje";

interface Props {
  loadingPost: boolean;
  coincidencia: boolean;
  mostrarMensaje: boolean;
  setMostrarMensaje: Dispatch<SetStateAction<boolean>>;
  error: boolean;
  setError: Dispatch<SetStateAction<boolean>>;
}

export const MensajeVerificacion: React.FC<Props> = ({
  loadingPost,
  error
}) => {

  return (
    <div className="mensaje-container">
      <div className="mensaje-content">
        {loadingPost && (
          <>
            <Alert color="secondary">Verificando Información</Alert>
            <Spinner color="primary" />
          </>
        )}
{/* 
        {(coincidencia && !loadingPost) && (
          <>
            <Mensaje
              textoMensaje="El usuario fue reconocido en el documento"
              colorMensaje="success"
            />
          </>
        )}
        {(!coincidencia && !loadingPost && !error) && (
          <>
            <Mensaje
              textoMensaje="EL usuario no pudo ser reconocido en el documento"
              colorMensaje="warning"
            />
            <Button color="warning" onClick={cerrarMensaje}>
              Volver a intentar
            </Button>
          </>
        )}*/}
        {(error && !loadingPost) && (
          <>
            <Mensaje
              textoMensaje="Error con la conexion al servidor"
              colorMensaje="danger"
            />
          </>
        )} 
      </div>
    </div>
  );
};
