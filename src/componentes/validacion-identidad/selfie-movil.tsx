import { useRef, useEffect, useState, Dispatch, SetStateAction } from "react";
import { InformacionIdentidad } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "../../styles/selfie.component.css";
import { Button } from "reactstrap";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
}

export const FormularioSelfie: React.FC<Props> = ({
  informacion,
  setInformacion,
}) => {
  let videoRef = useRef<HTMLVideoElement>(null);

  let selfieRef = useRef<HTMLCanvasElement>(null);

  const [imagen, setImagen] = useState<File>();
  const [guardarFoto, setGuardarFoto] = useState<boolean>(false);
  const [mostrarFoto, setMostrarFoto] = useState<boolean>(false);

  const getUserCamera = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((stream) => {
        let video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          video.play();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const toFile = async (dataURL: any, nombreArchivo: string) => {
    try{
      const response = await fetch(dataURL);
    const blob = await response.blob();
    const archivo = new File([blob], nombreArchivo, { type: blob.type });
    return archivo;
    } catch(error){
      console.log(error)
    }
  };

  const capturarSelfie = () => {
    setGuardarFoto(true);

    let width = 500;
    let height = width / (16 / 9);

    let selfie = selfieRef.current;
    let video = videoRef.current;

    if (selfie) {
      selfie.width = width;
      selfie.height = height;

      const imageUrl = selfieRef.current?.toDataURL("image/jpeg");

      if (imageUrl) {
        const archivo = toFile(imageUrl, "imagen.jpeg");
        archivo.then((res) => setImagen(res));
      }

      let ctx = selfie.getContext("2d");
      if (ctx && video) {
        setMostrarFoto(true)
        ctx.drawImage(video, 0, 0, selfie.width, selfie.height);
      }
    }
  };

  const usarFoto = () => {
    if (imagen) {
      setInformacion({
        ...informacion,
        foto_persona: imagen,
      });
    }
  };

  useEffect(() => {
    getUserCamera();
    console.log(imagen)
    console.log(informacion.foto_persona)
  }, [videoRef, imagen, informacion]);

  return (
    <>
      <div className="container">
        <div>
          <video ref={videoRef} className="video-container"></video>
          <canvas ref={selfieRef} className="foto-container" style={{
            width: mostrarFoto ? '80vw' : '0'
          }}></canvas>
          <Button onClick={capturarSelfie} color="primary" style={{
            margin: '20px 20px 20px 0'
          }}>
            Tomar foto
          </Button>
          {guardarFoto && (
            <Button color="success" onClick={usarFoto}>
              Usar esta foto
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
