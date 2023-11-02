import { Alert, Spinner } from "reactstrap";
import "../../styles/mensaje-style.component.css";
import { Dispatch, SetStateAction } from "react";
import { Mensaje } from "./mensaje";

interface Props {
  loadingPost: boolean;
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
