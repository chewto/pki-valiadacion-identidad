import axios from "axios";
import { useState, useEffect } from "react";
import {
  ValidadorFormdata,
  formdataKeys,
} from "../nucleo/validadores/validacion-identidad/validador-formdata";
import { FormularioFotoPersona } from "../componentes/validacion-identidad/formulario-foto-persona";
import { FormularioDocumento } from "../componentes/validacion-identidad/formulario-documento";
import { useSearchParams } from "react-router-dom";
import { MensajeVerificacion } from "../componentes/shared/mensaje-verificacion";
import { URLS } from "../nucleo/api-urls/validacion-identidad-urls";
import Stepper from "awesome-react-stepper";
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
import { useMobile } from "../nucleo/hooks/useMobile";
import { CodigoQR } from "../componentes/shared/codigo-qr";

export const ValidacionIdentidad: React.FC = () => {

  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario");
  const tipoParam = params.get("tipo");

  const informacion = useSelector((state: RootState) => state.informacion);
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const validacionOCR = useSelector((state: RootState) => state.ocr);

  const dispatch = useDispatch();

  const urlParams = `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`;

  const url =
    tipoParam === "3"
      ? `${URLS.ValidacionIdentidadTipo3}?${urlParams}`
      : `${URLS.ValidacionIdentidadTipo1}?${urlParams}`;

  const urlFirmador = `${URLS.obtenerFirmador}/${idUsuarioParam}`;
  const urlUsuario = `${URLS.obtenerUsuario}?id=${idParam}`;

  const formulario = new FormData();

  const labelFoto = {
    anverso: "anverso",
    reverso: "reverso",
    foto_persona: "foto_persona",
  };

  const esMobile = useMobile();

  const hora = useHour();
  const fecha = useDate();
  dispatch(setHoraFecha({ hora: hora, fecha: fecha }));

  const dispositivo = useDevice();
  const navegador = useBrowser();
  dispatch(
    setDispostivoNavegador({ dispositivo: dispositivo, navegador: navegador })
  );

  const [loadingPost, setLoadingPost] = useState<boolean>(false);
  const [mostrarMensaje, setMostrar] = useState<boolean>(false);
  const [errorPost, setErrorPost] = useState<boolean>(false);

  const [continuarBoton, setContinuarBoton] = useState<boolean>(false);
  const [pasos, setPasos] = useState<number>(0);

  useEffect(() => {
    document.title = "Validacion identidad";

    axios.post(`${URLS.iniciarProceso}?id=${idParam}`)
    .then(res => console.log(res.data))

    axios({
      method: "get",
      url: tipoParam === "3" ? urlFirmador : urlUsuario,
    })
      .then((res) => {
        dispatch(setFirmador(res.data.dato));
      })
      .catch((err) => console.log(err));

    geolocation();
    obtenerIp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {

    setInterval(() => {
      axios.get(`${URLS.comprobarProceso}?id=${idParam}`)
      .then(res => {
        console.log(res.data.proceso.estado)
        if (res.data.proceso.estado === 'finalizado') {
          window.location.href = URLS.resultados
        }
      })
    }, 4000)
  }, [])

  const avanzarPasos = () => {
    setPasos((prev) => prev + 1);
  };

  const volverPasos = () => {
    setPasos((prev) => prev - 1);
  };

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

  const enviar = (step: number) => {
    console.log(step);

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
      formdataKeys.ocrNombre,
      validacionOCR.ocrNombre
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.ocrApellido,
      validacionOCR.ocrApellido
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.ocrDocumento,
      validacionOCR.ocrDocumento
    );

    if (tipoParam === "3") {
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
    }

    if (
      informacion.foto_persona !== "" &&
      informacion.anverso !== "" &&
      informacion.reverso !== ""
    ) {
      console.log(formulario);
      setMostrar(true);
      setLoadingPost(true);

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

          console.log(idValidacion, idUsuario);
        })
        .catch((err) => {
          console.error(err);
          setLoadingPost(false);
          setErrorPost(true);
        })
        .finally(() => {
          if (tipoParam === "1") {
            window.location.href = `${URLS.resultados}?id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`;
          }

          if (tipoParam === "3") {
            window.location.href = `${URLS.resultados}?id=${idValidacion}&idUsuario=${idUsuario}&tipo=${tipoParam}`;
          }
        });
    }
  };

  return (
    <>
      <main className="main-container">
        <div className="content-container">
          <Header titulo="Validación de identidad" />
          <div style={{ margin: "17px", position: "relative" }}>
            <PasosEnumerados tipo={tipoParam} paso={pasos} />
            <Stepper
              allowClickControl={false}
              strokeColor="#0d6efd"
              fillStroke="#0d6efd"
              activeColor="#0d6efd"
              activeProgressBorder="2px solid #0d6efd"
              contentBoxClassName="contenido"
              backBtn={
                <button
                  className="stepper-btn"
                  onClick={volverPasos}
                  style={{ position: "absolute", left: "10%", top: "10%" }}
                >
                  Volver
                </button>
              }
              continueBtn={
                continuarBoton ? (
                  <button
                    className="stepper-btn"
                    onClick={avanzarPasos}
                    style={{ position: "absolute", left: "71%", top: "10%" }}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    className="stepper-btn"
                    disabled
                    style={{ position: "absolute", left: "71%", top: "10%" }}
                  >
                    Siguiente
                  </button>
                )
              }
              submitBtn={
                informacion.foto_persona !== "" &&
                informacion.anverso !== "" &&
                informacion.reverso !== "" ? (
                  <button
                    className="stepper-btn"
                    style={{ position: "absolute", left: "71%", top: "10%" }}
                  >
                    Finalizar
                  </button>
                ) : (
                  <button
                    className="stepper-btn"
                    disabled
                    style={{ position: "absolute", left: "71%", top: "10%" }}
                  >
                    Finalizar
                  </button>
                )
              }
              onSubmit={enviar}
            >
              <SelectorTipoDocumento
                tipoDocumento={informacion.tipoDocumento}
                continuarBoton={continuarBoton}
                setContinuarBoton={setContinuarBoton}
              />

              <FormularioDocumento
                tipoDocumento={informacion.tipoDocumento}
                preview={informacion.anverso}
                continuarBoton={continuarBoton}
                setContinuarBoton={setContinuarBoton}
                ladoDocumento={labelFoto.anverso}
              />

              <FormularioDocumento
                tipoDocumento={informacion.tipoDocumento}
                preview={informacion.reverso}
                continuarBoton={continuarBoton}
                setContinuarBoton={setContinuarBoton}
                ladoDocumento={labelFoto.reverso}
              />

              <AccesoCamara setContinuarBoton={setContinuarBoton} />

              <FormularioFotoPersona
                preview={informacion.foto_persona}
                selfie={labelFoto.foto_persona}
              />
            </Stepper>
          </div>
          {mostrarMensaje === true && (
            <MensajeVerificacion
              loadingPost={loadingPost}
              mostrarMensaje={mostrarMensaje}
              setMostrarMensaje={setMostrar}
              error={errorPost}
              setError={setErrorPost}
            />
          )}
        </div>
        <>{esMobile ? <></> : <CodigoQR />}</>
      </main>
    </>
  );
};
