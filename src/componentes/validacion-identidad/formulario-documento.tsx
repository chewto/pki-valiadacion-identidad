/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import "../../styles/styles.css";
import "../../styles/formulario-style.component.css";
import { Previsualizacion } from "../shared/previsualizacion";
import { useMobile } from "../../nucleo/hooks/useMobile";
import { useDispatch, useSelector } from "react-redux";
import { setFotos } from "../../nucleo/redux/slices/informacionSlice";
import { RootState } from "../../nucleo/redux/store";
import axios, { AxiosResponse } from "axios";
import { setValidacionOCR } from "../../nucleo/redux/slices/validacionOCRSlice";
import { Alert, Spinner } from "reactstrap";
import "react-html5-camera-photo/build/css/index.css";
import Camera from "react-html5-camera-photo";
import { FACING_MODES } from "react-html5-camera-photo";
import { setValidacionCB } from "../../nucleo/redux/slices/validacionCB";
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";
import {imagePlaceholder} from '../dataurl'

interface Props {
  tipoDocumento: string;
  preview: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  ladoDocumento: string;
  urlOCR: string;
  codigoBarras: boolean;
}

export const FormularioDocumento: React.FC<Props> = ({
  tipoDocumento,
  preview,
  continuarBoton,
  setContinuarBoton,
  ladoDocumento,
  codigoBarras
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
  const [mostrarCamara, setMostrarCamara] = useState<boolean>(true);

  const mobile: boolean = useMobile();

  const elementoScroll = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (ladoDocumento === "reverso" && tipoDocumento === "Pasaporte") {
      dispatch(setFotos({ labelFoto: ladoDocumento, data: imagePlaceholder }));
      setContinuarBoton(true);
    }
  }, [ladoDocumento, tipoDocumento, setContinuarBoton, dispatch]);

  useEffect(() => {
    elementoScroll.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    evento.preventDefault();

    setMostrarMensaje(false);
    setContinuarBoton(false);

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
            informacion.foto_persona,
            codigoBarras
          );
        };
      }
    };

    evento.target.value = "";
  };

  const tomarFoto = (dataURL: string) => {
    setMostrarMensaje(false);
    setContinuarBoton(false);
    setMostrarCamara(false);

    dispatch(setFotos({ labelFoto: ladoDocumento, data: dataURL }));

    validarDocumento(
      dataURL,
      informacionFirmador.nombre,
      informacionFirmador.apellido,
      informacionFirmador.documento,
      ladoDocumento,
      tipoDocumento,
      informacion.foto_persona,
      codigoBarras
    );
  };

  const retomar = () => {
    setMostrarCamara(true);
    dispatch(setFotos({ labelFoto: ladoDocumento, data: "" }));
  };

  const validarDocumento = (
    imagenDocumento: string | ArrayBuffer | null,
    nombre: string,
    apellido: string,
    documento: string,
    ladoDocumento: string,
    tipoDocumento: string,
    imagenPersona: string,
    lectura:boolean
  ) => {
    setError(false);
    setLoading(true);
    nombre = nombre.toUpperCase();
    apellido = apellido.toUpperCase();

    const data = {
      lectura: lectura,
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
      url:
        ladoDocumento == "anverso"
          ? URLS.validarDocumentoAnverso
          : URLS.validarDocumentoReverso,
      data: data,
    })
      .then((res: AxiosResponse<any>) => {
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
          dispatch(setValidacionCB(res.data.codigoBarra));

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
      {tipoDocumento === 'Pasaporte' && ladoDocumento === 'anverso'  &&  <h2 className="documento-title">
        Subir foto del {placeholder} de su {tipoDocumento}
      </h2>}

      {tipoDocumento !== 'Pasaporte'  &&  <h2 className="documento-title">
        Subir foto del {placeholder} de su {tipoDocumento}
      </h2>}

      {mostrarMensaje && (
        <>
          <Alert color="warning" style={{ textAlign: "center" }}>
            Por favor, vuelva a intentarlo
          </Alert>
        </>
      )}

      {continuarBoton && (
        <>
          <Alert color="success" style={{ textAlign: "center" }}>
            Seleccione {ladoDocumento === "anverso" ? "continuar" : "finalizar"}
          </Alert>
        </>
      )}

      {preview.length >= 1 && !loading && tipoDocumento != 'Pasaporte' && (
        <Previsualizacion preview={preview} nombrePreview={ladoDocumento} />
      )}

      {preview.length >= 1 && !loading && tipoDocumento == 'Pasaporte' && ladoDocumento == 'anverso' && (
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

      {ladoDocumento === "reverso" && tipoDocumento === "Pasaporte" ? (
        <></>
      ) : (
        <>
          {mobile && (
            <>
              {mostrarCamara && preview.length <= 0 && (
                <>
                  <Camera
                    idealFacingMode={FACING_MODES.ENVIRONMENT}
                    onTakePhoto={(dataURL) => tomarFoto(dataURL)}
                  />
                  <div ref={elementoScroll}></div>
                </>
              )}
              {!mostrarCamara && !loading && (
                <button className="file-input" onClick={retomar}>
                  Tomar foto del {placeholder}
                </button>
              )}
            </>
          )}

          {!mobile && (
            <label
              className="file-input"
              style={{
                background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
              }}
            >
              <input
                name={ladoDocumento}
                type="file"
                accept="image/jpeg"
                onChange={cambioArchivo}
                style={{ display: "none" }}
              />
              {preview.length <= 0 &&
                `Subir foto del ${placeholder} de su ${tipoDocumento}`}
              {mostrarMensaje && "Reintentar subir documento"}
              {loading && <Spinner></Spinner>}
              {continuarBoton &&
                ladoDocumento === "anverso" &&
                "Pulse aqui para subir una nueva foto"}
              {error && "El servidor ha fallado"}
              {continuarBoton &&
                ladoDocumento === "reverso" &&
                "Pulse aqui para subir una nueva foto"}
            </label>
          )}
        </>
      )}
    </div>
  );
};
