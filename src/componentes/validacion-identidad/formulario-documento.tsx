/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "../../styles/styles.css";
import "../../styles/formulario-style.component.css";
import { Previsualizacion } from "../shared/previsualizacion";
import { useMobile } from "../../nucleo/hooks/useMobile";
import { useDispatch, useSelector } from "react-redux";
import { setFotos } from "../../nucleo/redux/slices/informacionSlice";
import { RootState } from "../../nucleo/redux/store";
import axios from "axios";
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";
import { setValidacionOCR } from "../../nucleo/redux/slices/validacionOCRSlice";
import { Alert, Spinner } from "reactstrap";
//import { getImageSizeFromDataURL } from "../../nucleo/services/optimizadorImg";
//import { getImageSizeFromDataURL, optimizadorImg } from "../../nucleo/services/optimizadorImg";

interface Props {
  tipoDocumento: string;
  preview: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  ladoDocumento: string;
}

export const FormularioDocumento: React.FC<Props> = ({
  tipoDocumento,
  preview,
  continuarBoton,
  setContinuarBoton,
  ladoDocumento,
}) => {
  const informacionFirmador = useSelector((state: RootState) => state.firmador);
  const informacion = useSelector((state: RootState) => state.informacion);
  const validacionOCR = useSelector((state: RootState) => state.ocr);
  const dispatch = useDispatch();

  const placeholder = ladoDocumento === "anverso" ? "frontal" : "reverso";
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [mostrarMensaje, setMostrarMensaje] = useState<boolean>(false);

  const mobile: boolean = useMobile();

  useEffect(() => {
    if (!mostrarPreview) {
      setMostrarPreview(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (preview.length <= 0) {
      setContinuarBoton(false);
    }

    // if (preview.length >= 1 && validacionOCR.rostro === true){
    //   setContinuarBoton(true)
    // }

    // if (conteo >= 3 && preview.length >= 1 && validacionOCR.rostro === false){
    //   setContinuarBoton(true)
    // }
  }, [
    conteo,
    setContinuarBoton,
    preview.length,
    tipoDocumento,
    validacionOCR.rostro,
  ]);

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setMostrarMensaje(false);
    console.log("asdasdasd");

    const archivo = evento.target.files?.[0];
    const lector = new FileReader();

    if (archivo) lector.readAsDataURL(archivo);

    lector.onload = () => {
      const dataURL = lector.result;
      const img = new Image();
      if (typeof dataURL === "string") {
        img.src = dataURL;

        const imagen = new Image();

        imagen.src = typeof dataURL === "string" ? dataURL : "";

        imagen.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const nuevoWidth = Math.floor(imagen.width / 2);
          const nuevoHeigth = Math.floor(imagen.height / 2);

          canvas.width = nuevoWidth;
          canvas.height = nuevoHeigth;

          ctx?.drawImage(imagen, 0, 0, nuevoWidth, nuevoHeigth);

          const imagenResized = canvas.toDataURL("image/jpeg");

          dispatch(setFotos({ labelFoto: ladoDocumento, data: imagenResized }));

          validarDocumento(
            imagenResized,
            informacionFirmador.nombre,
            informacionFirmador.apellido,
            informacionFirmador.documento,
            ladoDocumento,
            tipoDocumento,
            informacion.foto_persona
          );
        };
      }
    };

    evento.target.value = "";
  };

  // const getResolutionFromDataURL = (dataURL: any): string => {
  //   const img = new Image();

  //   img.onload = () => {
  //     const { width, height } = img;
  //     console.log(`Image resolution: ${width} x ${height}`)
  //   };

  //   img.src = dataURL;

  //   return `width: ${img.width}, height: ${img.height} `;
  // };

  const validarDocumento = (
    imagenDocumento: string | ArrayBuffer | null,
    nombre: string,
    apellido: string,
    documento: string,
    ladoDocumento: string,
    tipoDocumento: string,
    imagenPersona: string
  ) => {
    setError(false)
    setLoading(true);
    nombre = nombre.toUpperCase();
    apellido = apellido.toUpperCase();

    const data = {
      imagen: imagenDocumento,
      nombre: nombre,
      apellido: apellido,
      documento: documento,
      ladoDocumento: ladoDocumento,
      tipoDocumento: tipoDocumento,
      imagenPersona: imagenPersona,
    };

    const nombreFirmador = informacionFirmador.nombre.toUpperCase();
    const apellidoFirmador = informacionFirmador.apellido.toUpperCase();
    const documentoFirmador = informacionFirmador.documento.toUpperCase();

    axios({
      method: "post",
      url: URLS.validarDocumento,
      data: data,
    })
      .then((res) => {
        console.log(res.data);

        if (ladoDocumento === "anverso") {
          dispatch(setValidacionOCR(res.data));

          const ocr = res.data.ocr;

          let encontrados = 0;

          for (const valor in ocr) {
            if (nombreFirmador.includes(ocr[valor])) {
              encontrados += 1;
            }

            if (apellidoFirmador.includes(ocr[valor])) {
              encontrados += 1;
            }

            if (documentoFirmador.includes(ocr[valor])) {
              encontrados += 1;
            }
          }

          if (res.data.rostro && res.data.ladoValido && encontrados >= 1) {
            setConteo(0);
            setContinuarBoton(true);
          } else {
            setMostrarMensaje(true);
            setConteo((prev) => prev + 1);
          }

          if (conteo >= 1) {
            setMostrarMensaje(false);
            setContinuarBoton(true);
          }
        }

        if (ladoDocumento === "reverso") {
          if (res.data.ladoValido) {
            setConteo(0);
            setContinuarBoton(true);
          } else {
            setMostrarMensaje(true);
            setConteo((prev) => prev + 1);
          }

          if (conteo >= 1) {
            setMostrarMensaje(false);
            setContinuarBoton(true);
          }
        }
      })
      .catch((error) => {
        setError(true);
        setLoading(false);
        console.log(error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="documento-container">
      <h2 className="documento-title">
        Subir foto del {placeholder} de su {tipoDocumento}
      </h2>

      {mostrarMensaje && (
        <>
          <Alert color="warning" style={{textAlign: 'center'}}>Por favor, vuelva a intentarlo</Alert>
        </>
      )}

      {mobile ? (
        <label
          className="file-input"
          style={{
            background: preview.length >= 1 ? "#fd0d0d" : "#0d6efd",
          }}
        >
          <input
            name={ladoDocumento}
            type="file"
            accept="image/jpeg"
            onChange={cambioArchivo}
            style={{
              display: "none",
              zIndex: "8000",
              background: "#5ecc7f",
            }}
            capture="environment"
          />
          {preview.length >= 1 ? (
            <>
              {loading && <Spinner></Spinner>}
              {mostrarMensaje && "Reintentar subir documento"}
              {continuarBoton &&
                (ladoDocumento === "anverso"
                  ? "Seleccione siguiente para continuar"
                  : "Seleccione finalizar")}
            </>
          ) : (
            `Subir foto del ${placeholder} de su ${tipoDocumento}`
          )}
        </label>
      ) : (
        <label
          className="file-input"
          style={{
            background: preview.length >= 1 ? "#fd0d0d" : "#0d6efd",
          }}
        >
          <input
            name={ladoDocumento}
            type="file"
            accept="image/jpeg"
            onChange={cambioArchivo}
            style={{ display: "none" }}
          />
          {preview.length >= 1 ? (
            <>
              {loading && <Spinner></Spinner>}
              {mostrarMensaje && "Reintentar subir documento"}
              {continuarBoton &&
                (ladoDocumento === "anverso"
                  ? "Seleccione siguiente para continuar"
                  : "Seleccione finalizar")}
            </>
          ) : (
            `Subir foto del ${placeholder} de su ${tipoDocumento}`
          )}
        </label>
      )}

      {preview.length >= 1 && !loading && (
        <Previsualizacion preview={preview} nombrePreview={ladoDocumento} />
      )}

      {error && (
        <>
          <Alert color="danger">ha ocurrido un error con el servidor</Alert>
        </>
      )}

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
            margin: "20px 0",
          }}
        >
          <Spinner></Spinner>
        </div>
      )}
    </div>
  );
};
