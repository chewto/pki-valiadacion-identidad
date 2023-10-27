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
import { getImageSizeFromDataURL } from "../../nucleo/services/optimizadorImg";
//import { getImageSizeFromDataURL, optimizadorImg } from "../../nucleo/services/optimizadorImg";

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

      const dataURL = lector.result

      if(archivo && archivo.size && 1.5 * 1024 * 1024){
        
        console.log('comprimir')
        const img = new Image()
        if(typeof dataURL === 'string'){
          img.src = dataURL

          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')


            const maxWidthHeight = 800;

            let nuevoWidth = img.width
            let nuevoHeight = img.height

            if(nuevoWidth > maxWidthHeight || nuevoHeight > maxWidthHeight){
              if(nuevoWidth > nuevoHeight){
                nuevoHeight = Math.round((nuevoHeight * maxWidthHeight) / nuevoWidth)
                nuevoWidth = maxWidthHeight
              } else{
                nuevoWidth = Math.round((nuevoWidth * maxWidthHeight) / nuevoHeight)
                nuevoHeight = maxWidthHeight
              }
            }

            canvas.width = nuevoWidth
            canvas.height = nuevoHeight

            ctx?.drawImage(img, 0,0, nuevoWidth, nuevoHeight)

            const imagenComprimida = canvas.toDataURL()

            setPreview({
              ...preview,
              [evento.target.name]: dataURL
            })

            setInformacion({
              ...informacion,
              [evento.target.name]: imagenComprimida
            })

            getResolutionFromDataURL(dataURL)

            const mb = getImageSizeFromDataURL(imagenComprimida)

            console.log(mb)

            validarDocumento(imagenComprimida)
          }
        }


      } else {
        console.log('sin necesidad de comprimir')

      setPreview({
        ...preview,
        [evento.target.name]: dataURL,
      });

      setInformacion({
        ...informacion,
        [evento.target.name]: dataURL,
      });

      getResolutionFromDataURL(dataURL)

      const mb = getImageSizeFromDataURL(dataURL)

      console.log(mb)

      validarDocumento(lector.result)
    }
    };

    if (archivo) lector.readAsDataURL(archivo);
  };

  const getResolutionFromDataURL = (dataURL: any): string => {
    const img = new Image();
  
    img.onload = () => {
      const { width, height } = img;
      console.log(`Image resolution: ${width} x ${height}`)
    };
  
    img.src = dataURL;
  
    return `width: ${img.width}, height: ${img.height} `;
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
