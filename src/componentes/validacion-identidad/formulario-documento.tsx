import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "../../styles/styles.css";
import "../../styles/formulario-style.component.css";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { Previsualizacion } from "../shared/previsualizacion";
import { useMobile } from "../../nucleo/hooks/useMobile";
import axios from "axios";
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";

interface Props {
  tipoDocumento: string;
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
  preview: PreviewDocumento;
  setPreview: Dispatch<SetStateAction<PreviewDocumento>>;
  ladoPreview: string;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  ladoDocumento: string;
}

export const FormularioDocumento: React.FC<Props> = ({
  tipoDocumento,
  informacion,
  setInformacion,
  preview,
  setPreview,
  ladoPreview,
  setContinuarBoton,
  ladoDocumento,
}) => {
  const placeholder = ladoDocumento === 'anverso' ? 'frontal' : 'reverso'
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(0);
  const [, setValidacion] = useState<number>(0);
  const [, setValidacionMensaje] = useState<boolean>(false);
  const [, setValidacionError] = useState<boolean>(false);
  const mobile: boolean = useMobile();

  useEffect(() => {
    if (!mostrarPreview) {
      setMostrarPreview(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=> {
    console.log(informacion, preview)
  },[informacion,preview])

  useEffect(() => {
    if (conteo === 0) setContinuarBoton(false);
    if (conteo >= 1 && ladoPreview.length >= 1) setContinuarBoton(true);
  }, [conteo, setContinuarBoton, ladoPreview.length, tipoDocumento]);

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setConteo(1)

    const archivo = evento.target.files?.[0];
    const lector = new FileReader();

    lector.onload = () => {
      setPreview({
        ...preview,
        [evento.target.name]: lector.result,
      });

      setInformacion({
        ...informacion,
        [evento.target.name]: lector.result,
      });

      validarDocumento(lector.result)
    };

    if (archivo) lector.readAsDataURL(archivo);
  };

  const validarDocumento = (dataImagen:string | ArrayBuffer | null) => {

    const data = {
      imagen: dataImagen,
      tipoDocumento: tipoDocumento,
      ladoDocumento: ladoDocumento
    };

    axios({
      method: "post",
      url: URLS.validarDocumento,
      data: data,
    })
      .then((res) => {
        setValidacion(res.data.validacion);
        console.log(res);
        // if (res.data.validacion >= 55) {
        //   setConteo(2);
        // }
      })
      .catch((error) => {
        console.log(error)
        setValidacionError(true)
      })
      .finally(() => {
        setValidacionMensaje(true);
      });
  };

  return (
    <div className="documento-container">
      <h2 className="documento-title">
        Subir foto del {placeholder} de su {tipoDocumento}
      </h2>

      <label className="file-input">
        <input
          name={ladoDocumento}
          type="file"
          accept="image/jpeg"
          onChange={cambioArchivo}
          style={{ display: "none" }}
        />
        Subir foto del {placeholder} de su {tipoDocumento}
      </label>

      {mobile &&(
          <label className="file-input">
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
          Tomar foto al {placeholder} de su documento
        </label>)}


      {ladoPreview.length >= 1 && (
        <Previsualizacion preview={ladoPreview} nombrePreview={ladoDocumento} />
      )}
    </div>
  );
};
