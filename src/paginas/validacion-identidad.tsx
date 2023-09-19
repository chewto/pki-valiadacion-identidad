import axios from "axios";
import { useState, useEffect } from "react";
import {
  InformacionIdentidad,
  Respuesta,
} from "../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { Form, Button, Alert } from "reactstrap";
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
import { FormularioDocumentos } from "../componentes/validacion-identidad/formulario-documentos";
import { useParams } from "react-router-dom";
import { useGetFetch } from "../nucleo/hooks/useGetFetch";
import { SpinnerLoading } from "../componentes/shared/spinner-loading";
import { MensajeVerificacion } from "../componentes/shared/mensaje-verificacion";
import { URLS } from "../nucleo/api-urls/validacion-identidad-urls";

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
    registradoDB_antes: false,
  });

  const [loadingPost, setLoadingPost] = useState<boolean>(false);
  const [mostrarMensaje, setMostrar] = useState<boolean>(false);
  const [mostrarAlert, setMostrarAlert] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const loading = true;

  let { idFirma } = useParams<string>();

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
    console.log(mostrarAlert);
  }, [loadingPost, respuesta, mostrarAlert]);

  const enviar = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

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

    if (
      informacion.foto_persona !== "" &&
      informacion.anverso !== "" &&
      informacion.reverso !== ""
    ) {
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
    } else {
      setMostrarAlert(true);

      setTimeout(() => {
        setMostrarAlert(false);
      }, 3000);
    }
  };

  return (
    <>
      <main className="main-container">
        <div className="content-container">
          {!loading && <SpinnerLoading />}
          <h2 className="title">Validacion de identidad</h2>
          <div className="form-container">
            <Form onSubmit={enviar} style={{ margin: "17px" }}>
              <FormularioDocumentos
                informacion={informacion}
                setInformacion={setInformacion}
              />

              <FormularioFotoPersona
                informacion={informacion}
                setInformacion={setInformacion}
              />

              <Button type="submit" color="primary" block>
                Validar
              </Button>
            </Form>
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
          {mostrarAlert && (
            <Alert color="warning">
              Para realizar la verificacion, primero debes llenar todos los
              campos
            </Alert>
          )}
        </div>
      </main>
    </>
  );
};
