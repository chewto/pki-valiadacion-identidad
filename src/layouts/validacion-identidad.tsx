import axios from "axios";
import { useState, useEffect, useRef, useMemo } from "react";
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
  setFotos,
} from "@nucleo/redux/slices/informacionSlice";
import {
  setCountry,
  setDirecciones,
  setFirmador,
  setLivenessTest,
} from "@nucleo/redux/slices/firmadorSlice";
import { useDetectBrowser, useDetectOs, useMobile } from "@nucleo/hooks/useMobile";
import { useValidationRedirect } from "@nucleo/hooks/useValidationRedirect";

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
import chrome from "../assets/img/chrome.png"
import { CodigoQR } from "@components/ui/codigo-qr";
import { PruebaVida } from "@nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { setIdCarpetas } from "@nucleo/redux/slices/pruebaVidaSlice";
import { FormularioFotoPersona } from "@pages/efirma/formulario-foto-persona";


interface Props {
  standalone: boolean;
}

export const ValidacionIdentidad: React.FC<Props> = ({ standalone }) => {
  const validationName = "EFIRMA";
  
  const { hash } = useParams();
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

  const getMediaUrl = standalone
    ? `${URLS.getMedia}?hash=${hash}`
    : `${URLS.getMedia}?id=${idUsuarioParam}`;

  const getCountry = standalone 
  ? `${URLS.getCountry}?hash=${hash}`
  : `${URLS.getCountry}?id=${idUsuarioParam}`

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

  const esMobile = useMobile();
  const isIOS = useDetectOs('IOS');
  const isSafari = useDetectBrowser('MOBILE SAFARI')
  const isAndroid = useDetectOs('ANDROID')
  const isChrome = useDetectBrowser('CHROME')

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

  const [documentList, setDocumentList] = useState<string[]>([])

  const [hasSent, setHasSent] = useState(false)

  const [useModel, setUseModel] = useState<boolean>(false)

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // pila con esto
    if (mainCounter >= validationParams.documentsTries + 1) {
      // enviar(true);
      console.log("validacion fallida");
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
          setUseModel(res.data.dato.usoModelo == null ? false : true)
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));

    if(!standalone){
      axios({
        method: 'get',
        url: `${URLS.getLivenessTest}?id=${idUsuarioParam}`
      }).then(res => {
        dispatch(setLivenessTest({data: res.data.validacionVida}))
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

      useEffect(() => {
    axios.get(getCountry)
    .then((res) => {
      const country = res.data.country
      const documents = res.data.documentList
      setDocumentList(state => [...state, ...documents])
      dispatch(setCountry({country: country}))
    })
  }, [dispatch, getCountry])

  useEffect(() => {
    if (informacionFirmador.validacionVida) {
      axios
        .get(getMediaUrl)
        .then((res) => {
          if(res.data.evidencias === false){
            window.location.href = standalone ? `${URLS.livenesstest}?hash=${hash}` : `${URLS.livenesstest}?id=${idUsuarioParam}&tipo=${tipoParam}`
          }
          dispatch(
            setFotos({ labelFoto: "foto_persona", data: res.data.photo })
          );

          const prueba: PruebaVida = {
            movimiento: res.data.lifeTest,
            idCarpetaEntidad: res.data.idCarpetaEntidad,
            idCarpetaUsuario: res.data.idCarpetaUsuario,
            // videoHash: res.data.videoHash,
          };

          dispatch(setIdCarpetas(prueba));
        })
        .finally(() => setLoading(false));
    }
  }, [dispatch, getMediaUrl, informacionFirmador.validacionVida]);

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
          documentsTries: documentsTries === null ? 2 : documentsTries,
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

    console.log('finalizando validacion')

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
      validacionDocumento.mrz.code
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
      'front_tries',
      `${validacionDocumento.sides.front.tries}`
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
      'back_tries',
      `${validacionDocumento.sides.back.tries}`
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

    // ValidadorFormdata(
    //   formulario,
    //   "video_hash",
    //   pruebaVida.videoHash != undefined ? pruebaVida.videoHash : "no hash"
    // );

    ValidadorFormdata(
      formulario,
      "video_hash",
      "no hash"
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

    ValidadorFormdata(
      formulario,
      "country",
      informacionFirmador.pais ?? ''
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
        console.log(state, idValidacion, idUsuario);

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

          console.log(formRef);
          formElement.submit();
        }
        }
        if (!standalone) {
        const newUrl = `${URLS.resultados}?id=${idValidacion}&idUsuario=${idUsuario}&tipo=${tipoParam}`;
        window.location.href = newUrl;
        }
      });
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

    
    const [activeSteps, setActiveSteps] = useState<number>(0);
    
    const handleNext = () => {
      setActiveSteps((prevActiveStep) => prevActiveStep + 1);
    };

    const steps = useMemo(() => {
      return informacionFirmador.validacionVida
      ? ["1", "2", "3", "4"]
      : ["1", "2", "3", "4", "5"];
    }, [informacionFirmador.validacionVida]);

    const componentsSteps = useMemo(() => {return informacionFirmador.validacionVida
    ? [
      <DocumentSelector
        tipoDocumento={informacion.tipoDocumento}
        documentList={documentList}
        continuarBoton={continuarBoton}
        setContinuarBoton={setContinuarBoton}
        useModel={standalone ? useModel : false}
        nextStep={handleNext}
      />,
      <AccesoCamara
        setContinuarBoton={setContinuarBoton}
        nextStep={handleNext}
      />,
      <FormularioDocumento
        id={standalone ? informacionFirmador.idUsuario : idUsuarioParam}
        tipoDocumento={informacion.tipoDocumento}
        preview={informacion.anverso}
        continuarBoton={continuarBoton}
        setContinuarBoton={setContinuarBoton}
        ladoDocumento={labelFoto.anverso}
        useModel={useModel}
        tries={validationParams.documentsTries}
        attendance={validationParams.validationAttendance}
        setMainCounter={setMainCounter}
        nextStep={handleNext}
      />,
      <FormularioDocumento
        id={standalone ? informacionFirmador.idUsuario : idUsuarioParam}
        tipoDocumento={informacion.tipoDocumento}
        preview={informacion.reverso}
        continuarBoton={continuarBoton}
        setContinuarBoton={setContinuarBoton}
        ladoDocumento={labelFoto.reverso}
        useModel={useModel}
        tries={validationParams.documentsTries}
        attendance={validationParams.validationAttendance}
        setMainCounter={setMainCounter}
        nextStep={handleNext}
      />,
      ]
    : [
      <DocumentSelector
        tipoDocumento={informacion.tipoDocumento}
        documentList={documentList}
        continuarBoton={continuarBoton}
        setContinuarBoton={setContinuarBoton}
        useModel={standalone ? useModel : false}
        nextStep={handleNext}
      />,
      <AccesoCamara
        setContinuarBoton={setContinuarBoton}
        nextStep={handleNext}
      />,
      <FormularioFotoPersona
        setContinuarBoton={setContinuarBoton}
        preview={informacion.foto_persona}
        selfie={labelFoto.foto_persona}
        id={standalone ? informacionFirmador.idUsuario : idUsuarioParam}
        nextStep={handleNext}
      />,
      <FormularioDocumento
        id={standalone ? informacionFirmador.idUsuario : idUsuarioParam}
        tipoDocumento={informacion.tipoDocumento}
        preview={informacion.anverso}
        continuarBoton={continuarBoton}
        setContinuarBoton={setContinuarBoton}
        ladoDocumento={labelFoto.anverso}
        useModel={useModel}
        tries={validationParams.documentsTries}
        attendance={validationParams.validationAttendance}
        setMainCounter={setMainCounter}
        nextStep={handleNext}
      />,
      <FormularioDocumento
        id={standalone ? informacionFirmador.idUsuario : idUsuarioParam}
        tipoDocumento={informacion.tipoDocumento}
        preview={informacion.reverso}
        continuarBoton={continuarBoton}
        setContinuarBoton={setContinuarBoton}
        ladoDocumento={labelFoto.reverso}
        useModel={useModel}
        tries={validationParams.documentsTries}
        attendance={validationParams.validationAttendance}
        setMainCounter={setMainCounter}
        nextStep={handleNext}
      />,
      ]}, [continuarBoton, documentList, idUsuarioParam, informacion.anverso, informacion.foto_persona, informacion.reverso, informacion.tipoDocumento, informacionFirmador.idUsuario, informacionFirmador.validacionVida, labelFoto.anverso, labelFoto.foto_persona, labelFoto.reverso, standalone, useModel, validationParams.documentsTries, validationParams.validationAttendance]);

    useEffect(() => {
    if (activeSteps === steps.length && !hasSent) {
      console.log("final de la validacion");
      enviar(false);
      setHasSent(true)
    }
    }, [activeSteps, steps, hasSent, handleNext]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex md:items-center md:mt-0 xsm:items-start  justify-center  xsm:px-1 md:pt-0 xsm:pt-5">
        <Card>
          <Header titulo="Validación de identidad" />
          <div className="m-0">
            <PasosEnumerados tipo="3" paso={activeSteps} />
            <div className="content-buttons">
              {/* <Button disabled={activeSteps === 0} onClick={handleBack}>
                Volver
              </Button> */}

              {/* {activeSteps <= steps.length - 2 && (
                <Button
                  disabled={!continuarBoton}
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  {continuarBoton ? "Continuar" : "Esperando"}
                </Button>
              )} */}

              {/* {activeSteps === steps.length  && (
                <Button
                  // disabled={!continuarBoton}
                  variant="contained"
                  color="primary"
                  onClick={() => enviar(false)}
                >
                  {continuarBoton ? "Finalizar" : "Esperando"}
                </Button>
              )} */}
            </div>
            {componentsSteps[activeSteps]}
             {/* {componentsSteps[2]}  */}
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

        {isIOS && !isSafari && (
          <Advertencia
            titulo="Advertencia"
            contenido="Está usando un dispositivo IOS, para realizar la validación, use el navegador Safari"
            elemento={<img src={safari} className="w-1/4" />}
          />
        )}

        {isAndroid && !isChrome && (
          <Advertencia
            titulo="Advertencia"
            contenido="Está usando un dispositivo Android, para realizar la validación, use el navegador Google Chrome"
            elemento={<img src={chrome} className="w-1/4" />}
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

        <>{!esMobile && <CodigoQR />}</>

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
