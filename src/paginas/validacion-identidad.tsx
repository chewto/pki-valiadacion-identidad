import axios from "axios";
import { useState, useEffect } from "react";
import {
  InformacionIdentidad,
  PreviewDocumento,
  Respuesta,
  Dato,
} from "../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import {
  ValidadorFormdata,
  formdataKeys,
} from "../nucleo/validadores/validacion-identidad/validador-formdata";
import { FormularioFotoPersona } from "../componentes/validacion-identidad/formulario-foto-persona";
import { FormularioDocumento } from "../componentes/validacion-identidad/formulario-documento";
import { useSearchParams } from "react-router-dom";
import { MensajeVerificacion } from "../componentes/shared/mensaje-verificacion";
import { URLSdesarollo } from "../nucleo/api-urls/validacion-identidad-urls";
import Stepper from "awesome-react-stepper";
import { Header } from "../componentes/shared/header";
import { SelectorTipoDocumento } from "../componentes/validacion-identidad/selector-tipo-documento";
import { AccesoCamara } from "../componentes/validacion-identidad/acceso-camara";
import { useBrowser } from "../nucleo/hooks/useBrowser";
import { useDevice } from "../nucleo/hooks/useDevice";
import { useHour } from "../nucleo/hooks/useHour";
import { useDate } from "../nucleo/hooks/useDate";
import { PasosEnumerados } from "../componentes/validacion-identidad/pasos-enumerados";
import { PruebaVitalidad } from "../componentes/validacion-identidad/prueba-vitalidad";

export const ValidacionIdentidad: React.FC = () => {
  const [params] = useSearchParams();

  const idParam = params.get("id");
  const idUsuarioParam = params.get("idUsuario")
  const tipoParam = params.get("tipo");

  const urlParams = `id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`

  const url = tipoParam === '3' ? `${URLSdesarollo.ValidacionIdentidadTipo3}?${urlParams}` : `${URLSdesarollo.ValidacionIdentidadTipo1}?${urlParams}`

  const urlFirmador = `${URLSdesarollo.obtenerFirmador}/${idUsuarioParam}`;

  const formulario = new FormData();

  const [informacionFirmador, setInformacionFirmador] = useState<Dato>({
    nombre: '',
    apellido: '',
    correo: '',
    documento: ''
  })

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

  const [respuesta, setRespuesta] = useState<Respuesta>({
    idValidacion: 0,
    idUsuario: 0,
    coincidenciaDocumentoRostro: false,
    estadoVerificacion: ""
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

    if(tipoParam === '3'){
      axios({
        method: 'get',
        url: urlFirmador
      })
      .then(res => {
        setInformacionFirmador(res.data.dato)
        console.log(res.data.dato)
      }).catch(err => console.log(err))
    }

    geolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=> {
    console.log(informacionFirmador)
  }, [informacionFirmador])

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

    if(tipoParam === '3'){
      ValidadorFormdata(formulario, formdataKeys.nombres, informacionFirmador.nombre)
      ValidadorFormdata(formulario, formdataKeys.apellidos, informacionFirmador.apellido)
      ValidadorFormdata(formulario, formdataKeys.email, informacionFirmador.correo)
      ValidadorFormdata(formulario, formdataKeys.numero_documento, informacionFirmador.documento)
    }

    if (
      informacion.foto_persona !== "" &&
      informacion.anverso !== "" &&
      informacion.reverso !== ""
    ) {
      console.log(informacion, informacionFirmador);
      setMostrar(true);
      setLoadingPost(true);

      console.log(url)

      let idValidacion = 0
      let idUsuario = 0

      await axios({
        method: "post",
        url: url,
        data: formulario,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res) => {
          console.log(res);
          setRespuesta(res.data);
          idValidacion = res.data.idValidacion;
          idUsuario = res.data.idUsuario;

          console.log(idValidacion, idUsuario)
        })
        .catch((err) => {
          console.error(err);
          setLoadingPost(false);
          setErrorPost(true);
        })
        .finally(() => {
          if(tipoParam === '1'){
            window.location.href = `${URLSdesarollo.resultados}?id=${idParam}&idUsuario=${idUsuarioParam}&tipo=${tipoParam}`
          }

          if(tipoParam === '3'){
            window.location.href = `${URLSdesarollo.resultados}?id=${idValidacion}&idUsuario=${idUsuario}&tipo=${tipoParam}`
          }
        })
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

            <div>
              {pasos >= 1 && (
                <PruebaVitalidad/>
              )}
            </div>
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
