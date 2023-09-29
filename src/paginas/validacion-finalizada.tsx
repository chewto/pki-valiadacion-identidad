import { Card, CardBody, CardText, CardTitle, Alert } from "reactstrap";
import "../styles/finalizacion.css";
import { useEffect } from "react";



export const ValidacionFinalizada: React.FC = () => {
  useEffect(() => {
    document.title = "Validación finalizada";

    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.forward();
    };

    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  return (
    <div className="finalizacion-container">
      <div>
        <Card>
          <CardBody>
            <CardTitle>
              <Alert color="success">Validación Finalizada</Alert>
            </CardTitle>
            <CardText></CardText>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
