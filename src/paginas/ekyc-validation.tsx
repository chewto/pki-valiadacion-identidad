import { useEffect, useState } from "react";
import { Selector } from "../componentes/eKYC-validation/selector";
import { Button } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useValidationRedirect } from "../nucleo/hooks/useValidationRedirect";
import axios from "axios";
import { URLS } from "../nucleo/api-urls/validacion-identidad-urls";
import { Advertencia } from "../componentes/shared/advertencia";
import { Header } from "../componentes/shared/header";

export const EKYCValidation: React.FC = () => {

  const validationName = 'EKYC_LLEIDA'

  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario");
  const tipoParam = params.get("tipo");
  
  const [validaciones, setValidaciones] = useState<string>('');

  useEffect(() => {
    axios
      .get(`${URLS.comprobarValidacion}?efirmaId=${idUsuarioParam}`)
      .then((res) => {
        console.log(res)
        const estadoValidacion = res.data.results.estado;
        setValidaciones(estadoValidacion);
      });
  }, [])


  useValidationRedirect(validationName, idUsuarioParam, `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`);


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
        <Header titulo="Validación de identidad"/>
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
              href={`${URLS.lleidaValidation}?typeDocument=${documentType}&coords=${coords}&efirmaId=${idUsuarioParam}&tipo=${tipoParam}`}
              style={{ textDecoration: "none", color: "#fff" }}
            >
              Continuar la validación.
            </a>
          </Button>
        </article>
        <Selector setDocumentType={setDocumentType} />
      </section>
      {validaciones.length >= 1 && validaciones !== 'se requiere nueva validación' && (
          <Advertencia
            titulo="Su validación esta siendo procesada"
            contenido="Estado de la validación:"
            elemento={<b>{validaciones}</b>}
          />
        )}
    </main>
  );
};
