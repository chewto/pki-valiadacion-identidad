import { useEffect, useState } from "react";
import { Selector } from "../componentes/validacion-identidad-b/selector";
import { Button } from "@mui/material";

export const EKYCValidation: React.FC = () => {
  const url = "https://localhost/efirma-validacion";

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
              href={`${url}?type=${documentType}&coords=${coords}`}
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
