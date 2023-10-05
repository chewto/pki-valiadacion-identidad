import axios from "axios";
import { useState, useEffect } from "react";
import {
  EvidenciasRes,
  InformacionIdentidad,
  PreviewDocumento,
  Respuesta,
} from "../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
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

export const ValidacionIdentidad: React.FC = () => {
  const [params] = useSearchParams();

  const tipoParam = params.get("tipo");
  const idParam = params.get("id");


  const formulario = new FormData();

  const [informacion, setInformacion] = useState<InformacionIdentidad>({
    anverso: "",
    reverso: "",
    foto_persona: "",
    dispositivo: useDevice(),
    navegador: useBrowser(),
    latitud: "",
    longitud: "",
    hora: useHour(),
    fecha: useDate(),
  });

  const [tipoDocumento, setTipoDocumento] = useState<string>("");

  const [, setEvidenciasID] = useState<EvidenciasRes>({
    idEvidencias: 0,
    idEvidenciasAdicionales: 0,
  });

  const [respuesta, setRespuesta] = useState<Respuesta>({
    coincidenciaDocumentoRostro: false,
    estadoVerificacion: "",
    evidencias: "",
    evidenciasAdicionales: "",
    tipoDocumento: "",
  });

  const [previewDocumento, setPreviewDocumento] = useState<PreviewDocumento>({
    anverso: "",
    reverso: "",
    foto_persona: "",
  });

  const [loadingPost, setLoadingPost] = useState<boolean>(false);
  const [mostrarMensaje, setMostrar] = useState<boolean>(false);
  const [errorPost, setErrorPost] = useState<boolean>(false);

  const [continuarBoton, setContinuarBoton] = useState<boolean>(false);
  const [pasos, setPasos] = useState<number>(0);

  useEffect(() => {
    document.title = "Validacion identidad";
    console.log(informacion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [informacion]);

  useEffect(() => {
    geolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(pasos);
  }, [pasos]);

  const avanzarPasos = () => {
    setPasos((prev) => prev + 1)
  }

  const volverPasos = () => {
    setPasos((prev) => prev - 1)
  }

  const geolocation = () => {
    const mostrarPosicion = (posicion: GeolocationPosition) => {
      const latitud: number = posicion.coords.latitude;
      const longitud: number = posicion.coords.longitude;

      setInformacion({
        ...informacion,
        latitud: `${latitud}`,
        longitud: `${longitud}`,
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(mostrarPosicion);
    } else {
      setInformacion({
        ...informacion,
        latitud: "no disponible",
        longitud: "no disponible",
      });
    }
  };

  const enviar = async (step: number) => {
    console.log(step);
    if (informacion.anverso !== "") {
      ValidadorFormdata(
        formulario,
        formdataKeys.anverso_documento,
        informacion.anverso
      );
    }

    if (informacion.reverso !== "") {
      ValidadorFormdata(
        formulario,
        formdataKeys.reverso_documento,
        informacion.reverso
      );
    }

    if (informacion.foto_persona !== "") {
      ValidadorFormdata(
        formulario,
        formdataKeys.foto_persona,
        informacion.foto_persona
      );
    }

    if (tipoDocumento !== "") {
      ValidadorFormdata(formulario, formdataKeys.tipoDocumento, tipoDocumento);
    }

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

    if (
      informacion.foto_persona !== "" &&
      informacion.anverso !== "" &&
      informacion.reverso !== ""
    ) {
      console.log(formulario);
      setMostrar(true);
      setLoadingPost(true);

      await axios({
        method: "post",
        url: `${URLS.verificacionEvidencias}/${idParam}`,
        data: formulario,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res) => {
          console.log(res);
          setRespuesta(res.data);
        })
        .catch((err) => {
          console.error(err);
          setLoadingPost(false);
          setErrorPost(true);
        });

      await axios({
        method: "get",
        url: `${URLS.obtenerEvidencias}/${idParam}`,
      })
        .then((res) => {
          console.log(informacion);
          console.log(res.data);
          const evidenciasId = res.data.idEvidencias;
          const evidenciasIdAdicionales = res.data.idEvidenciasAdicionales;

          setEvidenciasID({
            idEvidencias: evidenciasId,
            idEvidenciasAdicionales: evidenciasIdAdicionales,
          });

          window.location.href = `${URLS.resultados}?id-evidencias=${evidenciasId}&id-evidencias-adicionales=${evidenciasIdAdicionales}`;
        })
        .catch((err) => {
          console.error(err);
          setLoadingPost(false);
          setErrorPost(true);
        });
    }
  };

  return (
    <>
      <main className="main-container">
        <div className="content-container">
          <Header titulo="Validación de identidad" />
          <div style={{ margin: "17px", position: 'relative' }}>
            <PasosEnumerados
              tipo={tipoParam}
              paso={pasos}
            />
            <Stepper
              allowClickControl={false}
              strokeColor="#0d6efd"
              fillStroke="#0d6efd"
              activeColor="#0d6efd"
              activeProgressBorder="2px solid #0d6efd"
              backBtn={<button className="stepper-btn" onClick={volverPasos}>Volver</button>}
              continueBtn={
                continuarBoton ? (
                  <button className="stepper-btn" onClick={avanzarPasos}>Siguiente</button>
                ) : (
                  <button className="stepper-btn" disabled>
                    Siguiente
                  </button>
                )
              }
              // onContinue={()=> console.log('presion')}
              submitBtn={
                informacion.foto_persona !== "" &&
                informacion.anverso !== "" &&
                informacion.reverso !== "" ? (
                  <button className="stepper-btn">Verificar</button>
                ) : (
                  <button className="stepper-btn" disabled>
                    Verificar
                  </button>
                )
              }
              onSubmit={enviar}
            >
              <SelectorTipoDocumento
                tipoDocumento={tipoDocumento}
                setTipoDocumento={setTipoDocumento}
                continuarBoton={continuarBoton}
                setContinuarBoton={setContinuarBoton}
              />

              <AccesoCamara setContinuarBoton={setContinuarBoton} />

              <FormularioDocumento
                tipoDocumento={tipoDocumento}
                informacion={informacion}
                setInformacion={setInformacion}
                preview={previewDocumento}
                setPreview={setPreviewDocumento}
                ladoPreview={previewDocumento.anverso}
                continuarBoton={continuarBoton}
                setContinuarBoton={setContinuarBoton}
                ladoDocumento="anverso"
              />

              <FormularioDocumento
                tipoDocumento={tipoDocumento}
                informacion={informacion}
                setInformacion={setInformacion}
                preview={previewDocumento}
                setPreview={setPreviewDocumento}
                ladoPreview={previewDocumento.reverso}
                continuarBoton={continuarBoton}
                setContinuarBoton={setContinuarBoton}
                ladoDocumento="reverso"
              />

              <FormularioFotoPersona
                informacion={informacion}
                setInformacion={setInformacion}
                preview={previewDocumento}
                setPreview={setPreviewDocumento}
                ladoPreview={previewDocumento.foto_persona}
                selfie="foto_persona"
              />
            </Stepper>
          </div>
          {mostrarMensaje === true && (
            <MensajeVerificacion
              loadingPost={loadingPost}
              coincidencia={respuesta.coincidenciaDocumentoRostro}
              mostrarMensaje={mostrarMensaje}
              setMostrarMensaje={setMostrar}
              error={errorPost}
              setError={setErrorPost}
            />
          )}
        </div>
      </main>
    </>
  );
};
