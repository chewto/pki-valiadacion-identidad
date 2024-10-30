import axios from "axios";
import { useState, useEffect } from "react";
import {
  ValidadorFormdata,
  formdataKeys,
} from "@nucleo/validadores/validacion-identidad/validador-formdata";
import { URLS } from "@nucleo/api-urls/validacion-identidad-urls";
import { useBrowser } from "@nucleo/hooks/useBrowser";
import { useDevice } from "@nucleo/hooks/useDevice";
import { useHour } from "@nucleo/hooks/useHour";
import { useDate } from "@nucleo/hooks/useDate";
import { RootState } from "@nucleo/redux/store";
import {
  setIp,
  setCoordenadas,
  setHoraFecha,
  setDispostivoNavegador,
} from "@nucleo/redux/slices/informacionSlice";
import { setFirmador } from "@nucleo/redux/slices/firmadorSlice";
import { useIos } from "@nucleo/hooks/useMobile";
import { useValidationRedirect } from "@nucleo/hooks/useValidationRedirect";
import { documentTypes } from "@nucleo/documents/documentsTypes";
import { FormularioFotoPersona } from "@pages/efirma/formulario-foto-persona";
import { FormularioDocumento } from "@pages/efirma/formulario-documento";
import { DocumentSelector } from "@pages/shared/document-selector";
import { AccesoCamara } from "@pages/efirma/acceso-camara";
import { Header } from "@components/ui/header";
import { PasosEnumerados } from "@components/ui/pasos-enumerados";
import { Advertencia } from "@components/ui/advertencia";
import { MensajeVerificacion } from "@components/ui/mensaje-verificacion";
import Card from "@components/ui/card";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import safari from "../assets/img/safari.png";
// import { useMobile } from "../nucleo/hooks/useMobile";
// import { CodigoQR } from "@components/shared/codigo-qr";
import Button from "@mui/material/Button";

export const ValidacionIdentidad: React.FC = () => {
  const validationName = "EFIRMA";

  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario");
  const tipoParam = params.get("tipo");

  const dispatch = useDispatch();

  const informacion = useSelector((state: RootState) => state.informacion);
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const validacionDocumento = useSelector(
    (state: RootState) => state.validacionDocumento
  );
  // const validacionCB = useSelector((state: RootState) => state.cb);
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

  useValidationRedirect(
    validationName,
    idUsuarioParam,
    `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`
  );

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

  const [retry, setRetry] = useState<boolean>(false);
  const [estadoValidacion, setEstadoValidacion] = useState<string>("");

  useEffect(() => {
    document.title = "Validacion identidad";

    axios
      .get(`${URLS.comprobarValidacion}?efirmaId=${idUsuarioParam}`)
      .then((res) => {
        console.log(res);
        const estadoValidacion: string = res.data.results.estado;
        if(estadoValidacion.length >= 1){
          const text = "se requiere nueva validación";
          const test = estadoValidacion.includes(text);
          setRetry(test);
          setEstadoValidacion(estadoValidacion);
        }
        if(estadoValidacion.length <= 0){
          setRetry(true)
          setEstadoValidacion(estadoValidacion);
        }
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
      validacionDocumento.porcentajesOCR.porcentajeNombreOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.porcentajeApellidoOCR,
      validacionDocumento.porcentajesOCR.porcentajeApellidoOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.porcentajeDocumentoOCR,
      validacionDocumento.porcentajesOCR.porcentajeDocumentoOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.nombreOCR,
      validacionDocumento.ocr.nombreOCR
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.apellidoOCR,
      validacionDocumento.ocr.apellidoOCR
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.documentoOCR,
      validacionDocumento.ocr.documentoOCR
    );

    ValidadorFormdata(formulario, formdataKeys.mrz, validacionDocumento.mrz);
    ValidadorFormdata(
      formulario,
      formdataKeys.codigoBarras,
      validacionDocumento.codigoBarras
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
          console.log(err);
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

  const componentsSteps = [
    <DocumentSelector
      tipoDocumento={informacion.tipoDocumento}
      documentList={documentTypes["hnd"]}
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
      id={idUsuarioParam}
      tipoDocumento={informacion.tipoDocumento}
      preview={informacion.anverso}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
      ladoDocumento={labelFoto.anverso}
      urlOCR={URLS.validarDocumentoAnverso}
    />,
    <FormularioDocumento
      id={idUsuarioParam}
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
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center xsm:px-1">
        <Card>
          <Header titulo="Validación de identidad" />
          <div className="m-0">
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
          <>
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
          </>
        </Card>

        {esIOS && navegador !== "Safari" && (
          <Advertencia
            titulo="Advertencia"
            contenido="Esta usando un dispositivo IOS, para realizar la validacion, use el navegador Safari"
            elemento={<img src={safari} className="w-1/4" />}
          />
        )}

        {!retry && (
          <Advertencia
            titulo="Su validación esta siendo procesada"
            contenido="Estado de la validación:"
            elemento={<b>{estadoValidacion}</b>}
          />
        )}

        {/* <>{esMobile ? <></> : <CodigoQR />}</> */}
      </main>
    </>
  );
};
