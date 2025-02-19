import axios from "axios";
import { useState, useEffect, useRef } from "react";
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
import {
  setDirecciones,
  setFirmador,
} from "@nucleo/redux/slices/firmadorSlice";
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
import { useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import safari from "../assets/img/safari.png";
// import { useMobile } from "../nucleo/hooks/useMobile";
// import { CodigoQR } from "@components/shared/codigo-qr";
import Button from "@mui/material/Button";

interface Props {
  standalone: boolean;
}

export const ValidacionIdentidad: React.FC<Props> = ({ standalone }) => {
  const { hash } = useParams();
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
  const pruebaVida = useSelector((state: RootState) => state.pruebaVida);

  const urlParams = standalone
    ? `id=${informacionFirmador.idValidacion}&idUsuario=${informacionFirmador.idUsuario}&tipo=${informacionFirmador.tipoValidacion}&hash=${hash}`
    : `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`;

  const url = standalone
    ? `${URLS.standaloneValidation}?${urlParams}`
    : `${URLS.ValidacionIdentidadTipo3}?${urlParams}`;

  const userDataUrl = standalone
    ? `${URLS.getUserData}?hash=${hash}`
    : `${URLS.obtenerFirmador}/${idUsuarioParam}`;

  const validationParamsUrl = standalone
    ? `${URLS.validationParameters}?hash=${hash}`
    : `${URLS.validationParameters}?efirmaId=${idUsuarioParam}`;

  // const lastValidationUrl = standalone
  //   ? `${URLS.comprobarValidacion}?hash=${informacionFirmador.idUsuario}`
  //   : `${URLS.comprobarValidacion}?efirmaId=${idUsuarioParam}`;
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

  const [generated, setGenerated] = useState<boolean>(true);

  const [continuarBoton, setContinuarBoton] = useState<boolean>(false);

  const [retry, setRetry] = useState<boolean>(false);
  const [estadoValidacion, setEstadoValidacion] = useState<string>("");

  const [mainCounter, setMainCounter] = useState<number>(0);

  const [validationParams, setValidationParams] = useState({
    validationAttendance: "",
    validationPercent: "",
    documentsTries: 0,
  });

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    console.log(informacion)
  },[])

  useEffect(() => {
    if (mainCounter >= validationParams.documentsTries + 1) {
      // enviar(true);
      setContinuarBoton(true)
      console.log('validacion fallida')
    }
  }, [mainCounter]);

  useEffect(() => {
    document.title = "Validacion identidad";

    axios({
      method: "get",
      url: userDataUrl,
    })
      .then((res) => {
        if (res.data.dato == null) {
          setGenerated(false);
        }

        dispatch(setFirmador(res.data.dato));
        if (standalone) {
          dispatch(setDirecciones(res.data.dato));
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    axios
      .get(
        standalone
          ? `${URLS.comprobarValidacion}?hash=${hash}`
          : `${URLS.comprobarValidacion}?efirmaId=${idUsuarioParam}`
      )
      .then((res) => {
        const estadoValidacion: string = res.data.results.estado;
        if (estadoValidacion.length >= 1) {
          const textList = [
            "se requiere nueva validación",
            "validación fallida",
          ];
          const isIncluided = (text: string) => {
            return estadoValidacion.includes(text);
          };
          const test = textList.some(isIncluided);
          setRetry(test);
          setEstadoValidacion(estadoValidacion);
        } else {
          setRetry(true);
          setEstadoValidacion(estadoValidacion);
        }
      });

    axios({
      method: "get",
      url: validationParamsUrl,
    })
      .then((res) => {
        const { validationPercent, validationAttendance, documentsTries } =
          res.data;

        setValidationParams({
          validationAttendance:
            validationAttendance === null
              ? "AUTOMATICA"
              : `${validationAttendance}`,
          validationPercent:
            validationPercent === null ? "60" : `${validationPercent}`,
          documentsTries: documentsTries,
        });
      })
      .catch(() => {
        setValidationParams({
          validationAttendance: "AUTOMATICA",
          validationPercent: "60",
          documentsTries: 2,
        });
      });
    geolocation();
    obtenerIp();
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
        console.error(error);
        dispatch(setIp({ ip: "ip inaccesible" }));
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

  const appendHiddenInput = (
    formElement: HTMLFormElement,
    name: string,
    value: string
  ) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    formElement.appendChild(input);
  };

  const enviar = async (failed: boolean) => {
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
      validacionDocumento.ocr.percentage.name
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.porcentajeApellidoOCR,
      validacionDocumento.ocr.percentage.lastName
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.porcentajeDocumentoOCR,
      validacionDocumento.ocr.percentage.ID
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.nombreOCR,
      validacionDocumento.ocr.data.name
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.apellidoOCR,
      validacionDocumento.ocr.data.lastName
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.documentoOCR,
      validacionDocumento.ocr.data.ID
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.mrz,
      validacionDocumento.mrz.code.raw
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.mrzPre,
      validacionDocumento.mrz.code.preprocessed
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.mrzName,
      validacionDocumento.mrz.data.name
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.mrzLastname,
      validacionDocumento.mrz.data.lastName
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.mrzNamePercent,
      validacionDocumento.mrz.percentages.name
    );
    ValidadorFormdata(
      formulario,
      formdataKeys.mrzLastnamePercent,
      validacionDocumento.mrz.percentages.lastName
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.codigoBarras,
      validacionDocumento.barcode
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.frontCode,
      validacionDocumento.sides.front.code
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.frontCountry,
      validacionDocumento.sides.front.country
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.frontCountryCheck,
      validacionDocumento.sides.front.countryCheck
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.frontType,
      validacionDocumento.sides.front.type
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.frontTypeCheck,
      validacionDocumento.sides.front.countryCheck
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.frontIsExpired,
      validacionDocumento.sides.front.isExpired ? "!OK" : "OK"
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.backCode,
      `${
        validacionDocumento.sides.back.code != undefined
          ? validacionDocumento.sides.back.code
          : ""
      }`
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.backCountry,
      `${
        validacionDocumento.sides.back.country != undefined
          ? validacionDocumento.sides.back.country
          : ""
      }`
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.backCountryCheck,
      `${
        validacionDocumento.sides.back.countryCheck != undefined
          ? validacionDocumento.sides.back.countryCheck
          : ""
      }`
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.backType,
      `${
        validacionDocumento.sides.back.type != undefined
          ? validacionDocumento.sides.back.type
          : ""
      }`
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.backTypeCheck,
      `${
        validacionDocumento.sides.back.typeCheck != undefined
          ? validacionDocumento.sides.back.typeCheck
          : ""
      }`
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.backIsExpired,
      `${validacionDocumento.sides.back.isExpired ? "!OK" : "OK"}`
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

    ValidadorFormdata(
      formulario,
      formdataKeys.validationAttendance,
      validationParams.validationAttendance
    );

    ValidadorFormdata(
      formulario,
      formdataKeys.validationPercent,
      validationParams.validationPercent
    );

    ValidadorFormdata(
      formulario,
      "callback",
      informacionFirmador.callback ?? ""
    );

    ValidadorFormdata(
      formulario,
      "face",
      validacionDocumento.face ? "OK" : "!OK"
    );

    ValidadorFormdata(
      formulario,
      "confidence",
      `${validacionDocumento.confidence}`
    );

    // ValidadorFormdata(
    //   formulario,
    //   'landmarks',
    //   validacionDocumento.landmarks
    // );

    if (!failed) {
      setMostrar(true);
      setLoading(true);

      let state = "";
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
          state = res.data.estadoVerificacion;
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
          setError(true);
        })
        .finally(() => {
          if (standalone) {
            if (formRef.current) {
              const formElement = formRef.current;
              appendHiddenInput(
                formElement,
                "idValidacion",
                idValidacion.toString()
              );
              appendHiddenInput(formElement, "idUsuario", idUsuario.toString());
              appendHiddenInput(formElement, "estadoValidacion", state);
              appendHiddenInput(
                formElement,
                "tipo",
                informacionFirmador.tipoValidacion?.toString() ?? ""
              );
              appendHiddenInput(
                formElement,
                "reintentoURL",
                window.location.href
              );
              formElement.submit();
            }
          }
          if (!standalone) {
            const newUrl = `${URLS.resultados}?id=${idValidacion}&idUsuario=${idUsuario}&tipo=${tipoParam}`;
            window.location.href = newUrl;
          }
        });

      // if(standalone){

      //   const redirectForm = new FormData();
      //   redirectForm.append("idValidacion", idValidacion.toString());
      //   redirectForm.append("idUsuario", idUsuario.toString());
      //   redirectForm.append("estadoValidacion", state);
      //   redirectForm.append("tipo", informacionFirmador.tipoValidacion?.toString() ?? "");
      //   redirectForm.append("reintentoURL", window.location.href);

      //   console.log(redirectForm.values())

      //   await axios({
      //     method: "post",
      //     url: `${informacionFirmador.redireccion}`,
      //     data: redirectForm,
      //     headers: {
      //       "Content-Type": "multipart/form-data",
      //     }
      //   }).then(res => console.log(res))
      //   // .finally(() => {
      //   //     const newUrl = `${informacionFirmador.redireccion}`;
      //   //     window.location.href = newUrl;
      //   //   });
      // }
    }

    if (failed) {
      ValidadorFormdata(formulario, "failed", "OK");

      ValidadorFormdata(
        formulario,
        "failed_back",
        validacionDocumento.sideResult.back
      );

      ValidadorFormdata(
        formulario,
        "failed_front",
        validacionDocumento.sideResult.front
      );

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
          window.location.href = `${URLS.rejected}?id=${idValidacion}&idUsuario=${idUsuario}&tipo=${tipoParam}`;
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
      documentList={documentTypes["col"]}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
    />,
    <AccesoCamara setContinuarBoton={setContinuarBoton} />,
    <FormularioFotoPersona
      setContinuarBoton={setContinuarBoton}
      preview={informacion.foto_persona}
      selfie={labelFoto.foto_persona}
      id={standalone ? informacionFirmador.idUsuario : idUsuarioParam}
    />,
    <FormularioDocumento
      id={standalone ? informacionFirmador.idValidacion : idUsuarioParam}
      tipoDocumento={informacion.tipoDocumento}
      preview={informacion.anverso}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
      ladoDocumento={labelFoto.anverso}
      urlOCR={URLS.validarDocumentoAnverso}
      tries={validationParams.documentsTries}
      attendance={validationParams.validationAttendance}
      setMainCounter={setMainCounter}
    />,
    <FormularioDocumento
      id={standalone ? informacionFirmador.idValidacion : idUsuarioParam}
      tipoDocumento={informacion.tipoDocumento}
      preview={informacion.reverso}
      continuarBoton={continuarBoton}
      setContinuarBoton={setContinuarBoton}
      ladoDocumento={labelFoto.reverso}
      urlOCR={URLS.validarDocumentoReverso}
      tries={validationParams.documentsTries}
      attendance={validationParams.validationAttendance}
      setMainCounter={setMainCounter}
    />,
  ];

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex md:items-center md:mt-0 xsm:items-start  justify-center  xsm:px-1 md:pt-0 xsm:pt-5">
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
                  onClick={() => enviar(false)}
                >
                  {continuarBoton ? "Finalizar" : "Esperando"}
                </Button>
              )}
            </div>
            {componentsSteps[activeSteps]}
            {/* {componentsSteps[3]} */}
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

        {!generated && (
          <Advertencia
            titulo="Su validación no ha sido generada"
            contenido=""
            elemento={<></>}
          />
        )}

        {/* <>{esMobile ? <></> : <CodigoQR />}</> */}

        <form
          ref={formRef}
          action={informacionFirmador.redireccion}
          method="POST"
          className="hidden"
        >
          <input type="submit" value="Submit" />
        </form>
      </main>
    </>
  );
};
