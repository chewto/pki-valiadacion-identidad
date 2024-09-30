import axios from "axios";
import { useState, useEffect } from "react";
import {
  ValidadorFormdata,
  formdataKeys,
} from "../nucleo/validadores/validacion-identidad/validador-formdata";
import { FormularioFotoPersona } from "@pages/efirma/formulario-foto-persona";
import { FormularioDocumento } from "@pages/efirma/formulario-documento";
import { DocumentSelector } from "@pages/shared/document-selector";
import { AccesoCamara } from "@pages/efirma/acceso-camara";
import { useSearchParams } from "react-router-dom";
import { MensajeVerificacion } from "@components/ui/mensaje-verificacion";
import { URLS } from "../nucleo/api-urls/validacion-identidad-urls";
import { Header } from "@components/ui/header";
import { useBrowser } from "../nucleo/hooks/useBrowser";
import { useDevice } from "../nucleo/hooks/useDevice";
import { useHour } from "../nucleo/hooks/useHour";
import { useDate } from "../nucleo/hooks/useDate";
import { PasosEnumerados } from "@components/ui/pasos-enumerados";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../nucleo/redux/store";
import {
  setIp,
  setCoordenadas,
  setHoraFecha,
  setDispostivoNavegador,
} from "../nucleo/redux/slices/informacionSlice";
import { setFirmador } from "../nucleo/redux/slices/firmadorSlice";
import { useIos } from "../nucleo/hooks/useMobile";
import { Advertencia } from "@components/ui/advertencia";
import safari from "../assets/img/safari.png";
// import { useMobile } from "../nucleo/hooks/useMobile";
// import { CodigoQR } from "@components/shared/codigo-qr";
import Button from "@mui/material/Button";
import { useValidationRedirect } from "../nucleo/hooks/useValidationRedirect";

export const ValidacionIdentidad: React.FC = () => {
  const validationName = "EFIRMA";

  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario");
  const tipoParam = params.get("tipo");

  const dispatch = useDispatch();

  const informacion = useSelector((state: RootState) => state.informacion);
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const validacionOCR = useSelector((state: RootState) => state.ocr);
  const validacionCB = useSelector((state: RootState) => state.cb);
  const pruebaVida = useSelector((state: RootState) => state.pruebaVida);

  const urlParams = `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`;

  const url = `${URLS.ValidacionIdentidadTipo3}?${urlParams}`;

  const urlFirmador = `${URLS.obtenerFirmador}/${idUsuarioParam}`;
  //const urlUsuario = `${URLS.obtenerData}?id=${idParam}`;

  const formulario = new FormData();

  const labelFoto = {
    anverso: "anverso",
    reverso: "reverso",
    foto_persona: "foto_persona",
  };

  // const esMobile = useMobile();

  useValidationRedirect(validationName, idUsuarioParam, `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`);

  const hora = useHour();
  const fecha = useDate();
  dispatch(setHoraFecha({ hora: hora, fecha: fecha }));

  const dispositivo = useDevice();
  const navegador = useBrowser();
  dispatch(
    setDispostivoNavegador({ dispositivo: dispositivo, navegador: navegador })
  );

  const esIOS = useIos();

  const [loading, setLoading] = useState<boolean>(true);
  const [mostrarMensaje, setMostrar] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [continuarBoton, setContinuarBoton] = useState<boolean>(false);

  const [validaciones, setValidaciones] = useState<string>("");

  useEffect(() => {
    document.title = "Validacion identidad";

    axios
      .get(`${URLS.comprobarValidacion}?efirmaId=${idUsuarioParam}`)
      .then((res) => {
        const estadoValidacion = res.data.results.estado;
        setValidaciones(estadoValidacion);
      });

    axios({
      method: "get",
      url: urlFirmador,
    })
      .then((res) => {
        dispatch(setFirmador(res.data.dato));
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));

    geolocation();
    obtenerIp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const obtenerIp = () => {
    axios({
      method: "get",
      url: URLS.obtenerIp,
    })
      .then((res) => {
        dispatch(setIp(res.data));
      })
      .catch((error) => {
        dispatch(setIp({ ip: "ip inaccesible" }));
        console.log(error);
      });
  };

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

  const enviar = () => {
    // await axios.post(`${URLS.finalizarProceso}?id=${idParam}`)

    ValidadorFormdata(
      formulario,
      formdataKeys.anverso_documento,
      informacion.anverso
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.reverso_documento,
      informacion.reverso
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.foto_persona,
      informacion.foto_persona
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.tipoDocumento,
      informacion.tipoDocumento
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.dispositivo,
      informacion.dispositivo
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.navegador,
      informacion.navegador
    );

    ValidadorFormdata(formulario, formdataKeys.latitud, informacion.latitud);
    ValidadorFormdata(formulario, formdataKeys.longitud, informacion.longitud);
    ValidadorFormdata(formulario, formdataKeys.hora, informacion.hora);
    ValidadorFormdata(formulario, formdataKeys.fecha, informacion.fecha);
    ValidadorFormdata(formulario, formdataKeys.ip, informacion.ip);
    ValidadorFormdata(
      formulario,
      formdataKeys.porcentajeNombreOCR,
      validacionOCR.porcentajes.porcentajeNombreOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.porcentajeApellidoOCR,
      validacionOCR.porcentajes.porcentajeApellidoOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.porcentajeDocumentoOCR,
      validacionOCR.porcentajes.porcentajeDocumentoOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.nombreOCR,
      validacionOCR.ocr.nombreOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.apellidoOCR,
      validacionOCR.ocr.apellidoOCR
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.documentoOCR,
      validacionOCR.ocr.documentoOCR
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.reconocidoCB,
      validacionCB.reconocido
    );

    ValidadorFormdata(formulario, formdataKeys.nombreCB, validacionCB.nombre);
    ValidadorFormdata(
      formulario,
      formdataKeys.apellidoCB,
      validacionCB.apellido
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.documentoCB,
      validacionCB.documento
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.nombres,
      informacionFirmador.nombre
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.apellidos,
      informacionFirmador.apellido
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.email,
      informacionFirmador.correo
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.numero_documento,
      informacionFirmador.documento
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.movimiento,
      pruebaVida.movimiento
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.idCarpetaEntidad,
      pruebaVida.idCarpetaEntidad
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.idCarpetaUsuario,
      pruebaVida.idCarpetaUsuario
    );

    if (
      informacion.foto_persona !== "" &&
      informacion.anverso !== "" &&
      informacion.reverso !== ""
    ) {
      setMostrar(true);
      setLoading(true);

      let idValidacion = 0;
      let idUsuario = 0;

      axios({
        method: "post",
        url: url,
        data: formulario,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res) => {
          idValidacion = res.data.idValidacion;
          idUsuario = res.data.idUsuario;
        })
        .catch((err) => {
          console.log(err)
          setLoading(false);
          setError(true);
        })
        .finally(() => {
          window.location.href = `${URLS.resultados}?id=${idValidacion}&idUsuario=${idUsuario}&tipo=${tipoParam}`;
        });
    }
  };

  const steps = ["1", "2", "3", "4", "5"];

  const [activeSteps, setActiveSteps] = useState<number>(0);

  const handleNext = () => {
    setActiveSteps((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveSteps((prevActiveStep) => prevActiveStep - 1);
  };

  const tiposDocumentos = [
    {
      id: 0,
      value: "Cédula de ciudadanía",
      label: "Cédula de ciudadanía"
    },
    {
      id: 1,
      value: "Cédula de extranjería",
      label: "Cédula de extranjería"
    },
    {
      id: 2,
      value: "Permiso por protección temporal",
      label: "Permiso por protección temporal"
    },
    {
      id: 3,
      value: "Tarjeta de identidad",
      label: "Tarjeta de identidad"
    },
    {
      id: 4,
      value: "Pasaporte",
      label: "Pasaporte"
    }
  ];

  const componentsSteps = [
    <DocumentSelector
      tipoDocumento={informacion.tipoDocumento}
      documentList={tiposDocumentos}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
    />,
    <AccesoCamara setContinuarBoton={setContinuarBoton} />,
    <FormularioFotoPersona
      setContinuarBoton={setContinuarBoton}
      preview={informacion.foto_persona}
      selfie={labelFoto.foto_persona}
    />,
    <FormularioDocumento
      tipoDocumento={informacion.tipoDocumento}
      preview={informacion.anverso}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
      ladoDocumento={labelFoto.anverso}
      urlOCR={URLS.validarDocumentoAnverso}
    />,
    <FormularioDocumento
      tipoDocumento={informacion.tipoDocumento}
      preview={informacion.reverso}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
      ladoDocumento={labelFoto.reverso}
      urlOCR={URLS.validarDocumentoReverso}
    />,
  ];

  return (
    <>
      <main className="main-container">
        <div className="content-container">
          <Header titulo="Validación de identidad" />
          <div className="m-4 relative">
            <PasosEnumerados tipo="3" paso={activeSteps} />
            <div className="content-buttons">
              <Button disabled={activeSteps === 0} onClick={handleBack}>
                Volver
              </Button>

              {activeSteps <= steps.length - 2 && (
                <Button
                  disabled={!continuarBoton}
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  {continuarBoton ? "Continuar" : "Esperando"}
                </Button>
              )}

              {activeSteps === steps.length - 1 && (
                <Button
                  disabled={!continuarBoton}
                  variant="contained"
                  color="primary"
                  onClick={enviar}
                >
                  {continuarBoton ? "Finalizar" : "Esperando"}
                </Button>
              )}
            </div>

            {componentsSteps[activeSteps]}
          </div>
          {mostrarMensaje && loading && (
            <MensajeVerificacion
              loading={loading}
              error={error}
              mensaje="Verificando Información"
            />
          )}
          {loading && (
            <MensajeVerificacion
              loading={loading}
              error={error}
              mensaje="Cargando Información"
            />
          )}
        </div>

        {esIOS && navegador !== "Safari" && (
          <Advertencia
            titulo="Advertencia"
            contenido="Esta usando un dispositivo IOS, para realizar la validacion, use el navegador Safari"
            elemento={<img src={safari} style={{ width: "50%" }} />}
          />
        )}

        {validaciones.length >= 1 && validaciones !== 'se requiere nueva validación' && (
          <Advertencia
            titulo="Su validación esta siendo procesada"
            contenido="Estado de la validación:"
            elemento={<b>{validaciones}</b>}
          />
        )}

        {/* <>{esMobile ? <></> : <CodigoQR />}</> */}
      </main>
    </>
  );
};
