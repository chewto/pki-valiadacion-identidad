import axios from "axios";
import { useState, useEffect } from "react";
import {
  InformacionIdentidad,
  PreviewDocumento,
  Respuesta,
} from "../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import {
  normalizeDocumento,
  normalizeNombre,
  ValidadorNombre,
  validadorDocumento,
} from "../nucleo/validadores/validacion-identidad/validadores-info";
import {
  ValidadorFormdata,
  formdataKeys,
} from "../nucleo/validadores/validacion-identidad/validador-formdata";
import { FormularioFotoPersona } from "../componentes/validacion-identidad/formulario-foto-persona";
import { FormularioDocumento } from "../componentes/validacion-identidad/formulario-documento";
import { useParams } from "react-router-dom";
// import { useGetFetch } from "../nucleo/hooks/useGetFetch";
import { SpinnerLoading } from "../componentes/shared/spinner-loading";
import { MensajeVerificacion } from "../componentes/shared/mensaje-verificacion";
import { URLS } from "../nucleo/api-urls/validacion-identidad-urls";
import Stepper from "awesome-react-stepper";
import { Header } from "../componentes/shared/header";
import { SelectorTipoDocumento } from "../componentes/validacion-identidad/selector-tipo-documento";
import { AccesoCamara } from "../componentes/validacion-identidad/acceso-camara";

export const ValidacionIdentidad: React.FC = () => {
  const formulario = new FormData();

  // const {data, loading, error} = useGetFetch('234234')

  const [informacion, setInformacion] = useState<InformacionIdentidad>({
    nombres: "jesus enrique",
    apellidos: "lozada salazar",
    numero_documento: "30265611",
    anverso: "",
    reverso: "",
    foto_persona: "",
  });

  const [respuesta, setRespuesta] = useState<Respuesta>({
    coincidencia_documento_rostro: false,
    persona_reconocida: "",
    status: "",
  });

  const [previewDocumento, setPreviewDocumento] = useState<PreviewDocumento>({
    anverso: "",
    reverso: "",
    foto_persona: ""
  });

  const [tipoDocumento, setTipoDocumento] = useState<string>('')

  const [loadingPost, setLoadingPost] = useState<boolean>(false);
  const [mostrarMensaje, setMostrar] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [continuarBoton, setContinuarBoton] = useState<boolean>(false)

  const loading = true;

  const { idFirma } = useParams<string>();

  useEffect(() => {
    document.title = "Validacion identidad";
    // setInformacion(
    //   ...informacion,
    //   nombres: data.nombres,
    //   apellidos: data.apellidos,
    //   numero_document: data.numeroDocumento
    // )
    console.log(idFirma);
  }, [idFirma]);

  useEffect(() => {
    console.log(loadingPost);
    console.log(respuesta);
  }, [loadingPost, respuesta]);

  const enviar = (step:number) => {

    console.log(step)

    const documentoNormalizado: string = normalizeDocumento(
      informacion.numero_documento
    );
    const documentoValidado: boolean = validadorDocumento(documentoNormalizado);

    const nombreNormalizado: string = normalizeNombre(informacion.nombres);
    const nombreValidado: boolean = ValidadorNombre(nombreNormalizado);

    const apellidoNormalizado: string = normalizeNombre(informacion.apellidos);
    const apellidoValidado: boolean = ValidadorNombre(apellidoNormalizado);

    if (nombreValidado && apellidoValidado && documentoValidado) {
      ValidadorFormdata(formulario, formdataKeys.nombres, nombreNormalizado);
      ValidadorFormdata(
        formulario,
        formdataKeys.apellidos,
        apellidoNormalizado
      );
      ValidadorFormdata(
        formulario,
        formdataKeys.numero_documento,
        documentoNormalizado
      );
    }

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

    if(tipoDocumento !== ""){
      ValidadorFormdata(formulario, formdataKeys.tipoDocumento, tipoDocumento)
    }

    if (
      informacion.foto_persona !== "" &&
      informacion.anverso !== "" &&
      informacion.reverso !== ""
    ) {
      console.log(formulario);
      setMostrar(true);
      setLoadingPost(true);

      axios({
        method: "post",
        url: URLS.validacionDocumentoRostro,
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
          setError(true);
        })
        .finally(() => {
          setLoadingPost(false);
        });
    }
  };

  return (
    <>
      <main className="main-container">
        <div className="content-container">
          {!loading && <SpinnerLoading />}
          <Header titulo="Validacion de identidad"/>
          <div style={{ margin: "17px" }}>
              <Stepper
                allowClickControl={false}
                strokeColor="#0d6efd"
                fillStroke="#0d6efd"
                activeColor="#0d6efd"
                activeProgressBorder="2px solid #0d6efd"
                backBtn={<button className="stepper-btn">Volver</button>}
                continueBtn={continuarBoton ? <button className="stepper-btn">Siguiente</button> : <button className="stepper-btn" disabled >Siguiente</button>}
                // onContinue={()=> console.log('presion')}
                submitBtn={
                  informacion.foto_persona !== "" &&
                  informacion.anverso !== "" &&
                  informacion.reverso !== "" ? (
                    <button className="stepper-btn">Verificar</button>
                  ) : (
                    <button className="stepper-btn" disabled>Verificar</button>
                  )
                }
                onSubmit={enviar}
              >

                <AccesoCamara
                  setContinuarBoton={setContinuarBoton}
                />

                <SelectorTipoDocumento
                  tipoDocumento={tipoDocumento}
                  setTipoDocumento={setTipoDocumento}
                  continuarBoton={continuarBoton}
                  setContinuarBoton={setContinuarBoton}
                />

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
                  selfie='foto_persona'
                />
              </Stepper>
          </div>
          {mostrarMensaje === true && (
            <MensajeVerificacion
              loadingPost={loadingPost}
              coincidencia={respuesta.coincidencia_documento_rostro}
              mostrarMensaje={mostrarMensaje}
              setMostrarMensaje={setMostrar}
              error={error}
              setError={setError}
            />
          )}
          {/* {mostrarAlert && (
            <Alert color="warning">
              Para realizar la verificacion, primero debes llenar todos los
              campos
            </Alert>
          )} */}
        </div>
      </main>
    </>
  );
};
