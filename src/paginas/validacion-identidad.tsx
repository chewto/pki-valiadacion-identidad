import axios from "axios";
import { useState } from "react";
import {
  InformacionIdentidad,
  Respuesta,
} from "../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { Form, Button } from "reactstrap";
import {
  normalizeDocumento,
  normalizeNombre,
} from "../nucleo/validadores/validacion-identidad/validadores-info";
import {
  ValidadorNombre,
  validadorDocumento,
} from "../nucleo/validadores/validacion-identidad/validadores-info";
import {
  ValidadorFormdata,
  formdataKeys,
} from "../nucleo/validadores/validacion-identidad/validador-formdata";
import { FormularioFotoPersona } from "../componentes/validacion-identidad/formulario-foto-persona";
import { MuestraDatos } from "../componentes/validacion-identidad/muestra-datos";
import { FormularioDocumentos } from "../componentes/validacion-identidad/formulario-documentos";
import { FormularioSelfie } from "../componentes/validacion-identidad/selfie-movil";

export const ValidacionIdentidad: React.FC = () => {
  const formulario = new FormData();

  const [informacion, setInformacion] = useState<InformacionIdentidad>({
    nombres: "Jesus Enrique",
    apellidos: "Lozada Salzar",
    numero_documento: "30265611",
    anverso: "",
    reverso: "",
    foto_persona: "",
  });

  const [data, setData] = useState<Respuesta>({
    coincidencia_documento_rostro: false,
    persona_reconocida: "",
    registradoDB_antes: false,
  });

  const esMobile = () => {
    const regex =
      /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(navigator.userAgent);
  };

  const movil = esMobile();

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

    console.log(nombreNormalizado, apellidoNormalizado, documentoNormalizado);

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
      console.log("enviado");

      axios
        .post(
          "http://127.0.0.1:5000/verificacion-rostro-documento",
          formulario,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        )
        .then((res) => setData(res.data))
        .then(() => console.log(data));
    } else {
      console.log("los campos de las imagenes no han sido rellenados");
    }
  };

  return (
    <>
      <main className="main-container">
        <div className="container">
          <div className="data-container">
            <MuestraDatos
              informacion={informacion}
              setInformacion={setInformacion}
            />
          </div>
          <div className="form-container">
            <Form onSubmit={enviar} style={{'margin':'17px'}}>
              <FormularioDocumentos
                informacion={informacion}
                setInformacion={setInformacion}
              />

              {!movil && (
                <FormularioFotoPersona
                  informacion={informacion}
                  setInformacion={setInformacion}
                />
              )}

              {movil && (
                <FormularioSelfie
                  informacion={informacion}
                  setInformacion={setInformacion}
                />
              )}

              <Button block color="success">
                Validar
              </Button>
            </Form>
          </div>
          <div>
            {data.coincidencia_documento_rostro && (
              <div>La persona coincide con el documento</div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};
