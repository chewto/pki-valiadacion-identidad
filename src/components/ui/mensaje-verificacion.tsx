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

  const handleReload = () => {
    window.location.reload();
  };

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
          <>
            <Alert color="danger" className="text-center w-full">
              {mensaje || "Error con la conexión al servidor"}
            </Alert>
            <button
              type="button"
              onClick={handleReload}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors shadow-sm"
            >
              Reintentar
            </button>
          </>
        )} 
      </div>
    </div>
  );
};
