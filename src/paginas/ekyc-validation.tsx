import { useEffect, useState } from "react";
import { Selector } from "../componentes/eKYC-validation/selector";
import { Button } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useValidationRedirect } from "../nucleo/hooks/useValidationRedirect";

export const EKYCValidation: React.FC = () => {

  const validationName = 'EKYC_LLEIDA'

  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario");
  const tipoParam = params.get("tipo");

  useValidationRedirect(validationName, idUsuarioParam, idParam, tipoParam);

  const url = "https://panama.efirma.pkiservices.co/ekyc";

  const [documentType, setDocumentType] = useState<string>("");
  const [coords, setCoords] = useState<string>("")

  useEffect(() => {
    geolocation()
  },[])

  const geolocation = () => {
    const mostrarPosicion = (posicion: GeolocationPosition) => {
      const latitude: number | string = `${posicion.coords.latitude}`;
      const longitude: number | string= `${posicion.coords.longitude}`;

      setCoords(`${latitude},${longitude}`)
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(mostrarPosicion);
    } else {
      const latitude = '0'
      const longitude = '0'
      setCoords(`${latitude}, ${longitude}`)
    }
  };

  return (
    <main className="main-container">
      <section className="content-container">
        <article className="content-buttons" style={{justifyContent: 'center'}}>
          <Button
          style={{
            margin: '10px 0'
          }}
          disabled={documentType.length <= 0 ? true : false}
          variant="contained"
          color="primary"
          >
            <a
              href={`${url}?type=${documentType}&coords=${coords}&efirmaId=${idUsuarioParam}`}
              style={{ textDecoration: "none", color: "#fff" }}
            >
              Continuar la validación.
            </a>
          </Button>
        </article>
        <Selector setDocumentType={setDocumentType} />
      </section>
    </main>
  );
};
