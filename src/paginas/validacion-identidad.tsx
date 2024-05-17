import axios from "axios";
import { useState, useEffect } from "react";
import {
  ValidadorFormdata,
  formdataKeys,
} from "../nucleo/validadores/validacion-identidad/validador-formdata";
import { FormularioFotoPersona } from "../componentes/validacion-identidad/formulario-foto-persona";
import { FormularioDocumento } from "../componentes/validacion-identidad/formulario-documento";
//import { EditarImagen } from "../componentes/validacion-identidad/editar-imagen";
import { useSearchParams } from "react-router-dom";
import { MensajeVerificacion } from "../componentes/shared/mensaje-verificacion";
import { URLS } from "../nucleo/api-urls/validacion-identidad-urls";
//import Stepper from "awesome-react-stepper";
import { Header } from "../componentes/shared/header";
import { SelectorTipoDocumento } from "../componentes/validacion-identidad/selector-tipo-documento";
import { AccesoCamara } from "../componentes/validacion-identidad/acceso-camara";
import { useBrowser } from "../nucleo/hooks/useBrowser";
import { useDevice } from "../nucleo/hooks/useDevice";
import { useHour } from "../nucleo/hooks/useHour";
import { useDate } from "../nucleo/hooks/useDate";
import { PasosEnumerados } from "../componentes/validacion-identidad/pasos-enumerados";
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
import { Advertencia } from "../componentes/shared/advertencia";
import safari from "../assets/img/safari.png";
// import { useMobile } from "../nucleo/hooks/useMobile";
// import { CodigoQR } from "../componentes/shared/codigo-qr";
import Button from "@mui/material/Button";
import { VideoRecorder } from "../componentes/validacion-identidad/prueba-vida";


export const ValidacionIdentidad: React.FC = () => {
  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario");
  const tipoParam = params.get("tipo");

  const informacion = useSelector((state: RootState) => state.informacion);
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const validacionOCR = useSelector((state: RootState) => state.ocr);
  const validacionCB = useSelector((state:RootState) => state.cb)

  const dispatch = useDispatch();

  const urlParams = `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`;

  const url = `${URLS.ValidacionIdentidadTipo3}?${urlParams}`

  const urlFirmador = `${URLS.obtenerFirmador}/${idUsuarioParam}`;
  //const urlUsuario = `${URLS.obtenerData}?id=${idParam}`;

  const formulario = new FormData();

  const labelFoto = {
    anverso: "anverso",
    reverso: "reverso",
    foto_persona: "foto_persona",
  };

  // const esMobile = useMobile();

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

  const [validaciones, setValidaciones] = useState<number>(0)

  useEffect(() => {
    document.title = "Validacion identidad";

    axios.get(`${URLS.comprobarProceso}?idUsuarioEFirma=${idUsuarioParam}`)
      .then((res) => {
        const numeroValidaciones = res.data.validaciones
        setValidaciones(numeroValidaciones)
      })

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

  const enviar = async () => {
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

    ValidadorFormdata(
      formulario,
      formdataKeys.nombreCB,
      validacionCB.nombre
    );

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

    if (
      informacion.foto_persona !== "" &&
      informacion.anverso !== "" &&
      informacion.reverso !== ""
    ) {
      console.log(formulario);
      setMostrar(true);
      setLoading(true);

      let idValidacion = 0;
      let idUsuario = 0;

      await axios({
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

          console.log(idValidacion, idUsuario);
        })
        .catch((err) => {
          console.error(err);
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
  const [progreso, setProgreso] = useState<number>(0)
  
  const handleNext = () => {
    setActiveSteps((prevActiveStep) => prevActiveStep + 1);
    setProgreso((prev) => prev + 25)
  };

  const handleBack = () => {
    setActiveSteps((prevActiveStep) => prevActiveStep - 1);
    setProgreso((prev) => prev - 25)
  };

  const componentsSteps = [
    <SelectorTipoDocumento
      tipoDocumento={informacion.tipoDocumento}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
    />,
    <AccesoCamara setContinuarBoton={setContinuarBoton} />,
    <FormularioFotoPersona
      continuarBoton={continuarBoton}
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
          <div style={{ margin: "17px", position: "relative" }}>
            <PasosEnumerados tipo='3' paso={activeSteps} progreso={progreso}/>
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
                  {continuarBoton ? 'Continuar' : 'Esperando'}
                </Button>
              )}

              {activeSteps === steps.length - 1 && (
                <Button
                  disabled={!continuarBoton}
                  variant="contained"
                  color="primary"
                  onClick={enviar}
                >
                  {continuarBoton ? 'Finalizar' : 'Esperando'}
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
            elemento={<img src={safari} style={{width: '50%'}}/>}
          />
        )}

        {validaciones >= 1 && (
          <Advertencia
            titulo="Su validación esta siendo procesada"
            contenido=""
            elemento={<>Su validación se encuentra en proceso</>}
          />
        )}

        <VideoRecorder/>

        {/* <>{esMobile ? <></> : <CodigoQR />}</> */}
      </main>
    </>
  );
};
