import { useEffect, useState } from "react";

import Card from "@components/ui/card";

import { useSearchParams } from "react-router-dom";
import { useValidationRedirect } from "@nucleo/hooks/useValidationRedirect";
import axios from "axios";
import { URLS } from "@nucleo/api-urls/validacion-identidad-urls";
// import { Advertencia } from "@components/ui/advertencia";
import { Header } from "@components/ui/header";
import CardContainer from "@components/ui/card-container";
// import { PasosEnumerados } from "@components/ui/pasos-enumerados";
import { DocumentSelector } from "@pages/shared/document-selector";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@nucleo/redux/store";
import {
  setCoordenadas,
  // setDispostivoNavegador,
  // setHoraFecha,
  // setIp,
} from "@nucleo/redux/slices/informacionSlice";
// import { useHour } from "@nucleo/hooks/useHour";
// import { useDate } from "@nucleo/hooks/useDate";
// import { useDevice } from "@nucleo/hooks/useDevice";
// import { useBrowser } from "@nucleo/hooks/useBrowser";
import { Button } from "reactstrap";
import { Advertencia } from "@components/ui/advertencia";
import { documentTypes } from "@nucleo/documents/documentsTypes";
// import Lleida from "@pages/ekyc-lleida/lleida";

export default function EKYCLleida() {
  const validationName = "EKYC_LLEIDA";

  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario");
  const tipoParam = params.get("tipo");

  useValidationRedirect(
    validationName,
    idUsuarioParam,
    `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`
  );

  const [retry, setRetry] = useState<boolean>(false);
  const [estadoValidacion, setEstadoValidacion] = useState<string>("");

  //agregar el includes para saber si se requiere nueva validacion
  useEffect(() => {
    axios
      .get(`${URLS.comprobarValidacion}?efirmaId=${idUsuarioParam}`)
      .then((res) => {
        console.log(res);
        const estadoValidacion: string = res.data.results.estado;
        const text = "se requiere nueva validación";
        const test = estadoValidacion.includes(text);
        setRetry(test);
        setEstadoValidacion(estadoValidacion);
      });
  }, []);

  const dispatch = useDispatch();

  const informacion = useSelector((state: RootState) => state.informacion);

  // const hora = useHour();
  // const fecha = useDate();
  // dispatch(setHoraFecha({ hora: hora, fecha: fecha }));

  // const dispositivo = useDevice();
  // const navegador = useBrowser();
  // dispatch(
  //   setDispostivoNavegador({ dispositivo: dispositivo, navegador: navegador })
  // );

  const [contiueButton, setContiueButton] = useState<boolean>(false);

  useEffect(() => {
    geolocation();
    // obtenerIp();
  }, []);

  // const obtenerIp = () => {
  //   axios({
  //     method: "get",
  //     url: URLS.obtenerIp,
  //   })
  //     .then((res) => {
  //       dispatch(setIp(res.data));
  //     })
  //     .catch((error) => {
  //       dispatch(setIp({ ip: "ip inaccesible" }));
  //       console.log(error);
  //     });
  // };

  const geolocation = () => {
    const mostrarPosicion = (posicion: GeolocationPosition) => {
      const latitud: number = posicion.coords.latitude;
      const longitud: number = posicion.coords.longitude;

      dispatch(
        setCoordenadas({ latitud: `${latitud}`, longitud: `${longitud}` })
      );
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(mostrarPosicion);
    } else {
      dispatch(
        setCoordenadas({ latitud: "no disponible", longitud: "no disponible" })
      );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center xsm:px-1">
      <Card>
        <Header titulo="Validación de identidad" />
        <div className="my-2 flex justify-center">
          <Button
            disabled={informacion.tipoDocumento.length <= 0 ? true : false}
            variant="contained"
            color="primary"
          >
            <a
              href={`${URLS.lleidaValidation}?typeDocument=${informacion.tipoDocumento}&coords=${informacion.latitud},${informacion.longitud}&efirmaId=${idUsuarioParam}&tipo=${tipoParam}`}
              style={{ textDecoration: "none", color: "#fff" }}
            >
              Continuar la validación.
            </a>
          </Button>
        </div>
        <DocumentSelector
          tipoDocumento={informacion.tipoDocumento}
          documentList={documentTypes['hndLleida']}
          continuarBoton={contiueButton}
          setContinuarBoton={setContiueButton}
        />
      </Card>

      {!retry && (
        <Advertencia
          titulo="Su validación esta siendo procesada"
          contenido=""
          elemento={<>Estado de la validación: {estadoValidacion}</>}
        />
      )}
    </main>
  );
}
