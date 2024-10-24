import { Alert, Spinner } from "reactstrap";
import "../../styles/mensaje-style.component.css";

interface Props {
  loading: boolean;
  error: boolean;
  mensaje: string;
}

export const MensajeVerificacion: React.FC<Props> = ({
  loading,
  error,
  mensaje
}) => {

  return (
    <div className="mensaje-container">
      <div className="mensaje-content">
        {loading && (
          <>
            <Alert color="secondary">{mensaje}</Alert>
            <Spinner color="primary" />
          </>
        )}

        {(error && !loading) && (
          <Alert color="danger">
            Error con la conexion al servidor
          </Alert>
        )} 
      </div>
    </div>
  );
};
