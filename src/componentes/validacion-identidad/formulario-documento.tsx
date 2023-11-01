/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "../../styles/styles.css";
import "../../styles/formulario-style.component.css";
import { Previsualizacion } from "../shared/previsualizacion";
import { useMobile } from "../../nucleo/hooks/useMobile";
import {useDispatch} from 'react-redux'
import { setFotos } from "../../nucleo/redux/slices/informacionSlice";

//import axios from "axios";
//import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";
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
  setContinuarBoton,
  ladoDocumento,
}) => {
  const placeholder = ladoDocumento === 'anverso' ? 'frontal' : 'reverso'
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);
  const [conteo, setConteo] = useState<number>(0);
  // const [, setValidacion] = useState<number>(0);
  // const [, setValidacionMensaje] = useState<boolean>(false);
  // const [, setValidacionError] = useState<boolean>(false);
  const mobile: boolean = useMobile();

  const dispatch = useDispatch()

  useEffect(() => {
    if (!mostrarPreview) {
      setMostrarPreview(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (conteo === 0) setContinuarBoton(false);
    if (conteo >= 1 && preview.length >= 1) setContinuarBoton(true);
  }, [conteo, setContinuarBoton, preview.length, tipoDocumento]);

  const cambioArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setConteo(1)

    const archivo = evento.target.files?.[0];
    const lector = new FileReader();

    lector.onload = () => {

      const dataURL = lector.result

      const imagen = new Image()

      imagen.src = typeof dataURL === 'string' ? dataURL : ''

      imagen.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')

        const nuevoWidth = Math.floor(imagen.width / 2)
        const nuevoHeigth = Math.floor(imagen.height / 2)

        canvas.width = nuevoWidth
        canvas.height = nuevoHeigth

        ctx?.drawImage(imagen, 0, 0, nuevoWidth, nuevoHeigth)

        const imagenResized = canvas.toDataURL('image/jpeg')
  
        dispatch(setFotos({ladoDocumento: ladoDocumento, data: imagenResized}))
      }
    };

    if (archivo) lector.readAsDataURL(archivo);
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

  // const validarDocumento = (dataImagen:string | ArrayBuffer | null) => {

  //   const data = {
  //     imagen: dataImagen,
  //     tipoDocumento: tipoDocumento,
  //     ladoDocumento: ladoDocumento
  //   };

  //   axios({
  //     method: "post",
  //     url: URLS.validarDocumento,
  //     data: data,
  //   })
  //     .then((res) => {
  //       setValidacion(res.data.validacion);
  //       console.log(res);
  //       // if (res.data.validacion >= 55) {
  //       //   setConteo(2);
  //       // }
  //     })
  //     .catch((error) => {
  //       console.log(error)
  //       setValidacionError(true)
  //     })
  //     .finally(() => {
  //       setValidacionMensaje(true);
  //     });
  // };


  

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

      {preview.length >= 1 && (
        <Previsualizacion preview={preview} nombrePreview={ladoDocumento} />
      )}
    </div>
  );
};
