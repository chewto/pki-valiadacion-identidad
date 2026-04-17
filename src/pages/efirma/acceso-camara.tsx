import { useEffect, useRef, useState } from "react";
import accesoCamara from '../../assets/img/acceso-camara.jpg'
import { useMobile } from "@nucleo/hooks/useMobile";

interface Props {
  nextStep: () => void;
}

export const AccesoCamara: React.FC<Props> = ({ nextStep }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [desplegarCamara, setDesplegarCamara] = useState<number>(0);

  const esMobile = useMobile()

  const iniciarCamara = () => {
    const video = videoRef.current;

  
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            if (video) {
              video.srcObject = stream;
              video.play();
              console.log("accesso permitido");
              setDesplegarCamara(1);
              video.srcObject.getVideoTracks().forEach((track) => track.stop())
            }
          })
          .catch(() => {
            setDesplegarCamara(2);
            console.log("accesso denegado");
          });
  
    }
  }

  useEffect(() => {

    console.log(esMobile)
    // setContinuarBoton(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if(desplegarCamara === 1){
      setTimeout(nextStep, 1000)
    }
  },[desplegarCamara, setDesplegarCamara,nextStep])

  return (
    <div className="flex flex-col items-center my-3">
      <video src="" ref={videoRef} style={{ display: "none" }}></video>

      {desplegarCamara == 0 && (
        <>
          <h3 className="text-lg font-bold text-slate-800">Permítenos usar su cámara</h3>
          <p className="xsm:text-sm md:text-base text-center text-slate-700 my-2">
            Si ve una ventana emergente que pida acceso a su cámara, por
            favor asegúrate de hacer clic en <strong>Permitir</strong>.
          </p>

          {!esMobile && (
            <img
              src={accesoCamara}
              alt="Ejemplo de la ventana emergente del navegador solicitando permiso de acceso a la cámara"
              className="my-2 rounded-md border border-slate-200 shadow-sm"
            />
          )}

          <button
            type="button"
            onClick={iniciarCamara}
            aria-label="Permitir que la aplicación acceda a la cámara de tu dispositivo"
            className="
              mt-3 px-6 py-2.5 rounded-lg font-semibold text-white
              bg-green-600 hover:bg-green-700 active:bg-green-800
              transition-colors duration-200
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500
            "
          >
            Permitir acceso a la cámara
          </button>
        </>
      )}

      {desplegarCamara == 1 && (
        <>
          <h3 className="text-lg font-bold text-slate-800">Acceso a la cámara concedido</h3>
          <p className="text-center text-slate-700">Puede continuar con la verificación.</p>
        </>
      )}

      {desplegarCamara == 2 && (
        <>
          <h3 className="text-lg font-bold text-red-700">Acceso a la cámara denegado</h3>
          <p className="text-center text-slate-700">
            Por favor, recargue la página y otorgue permiso de cámara cuando se solicite.
          </p>
        </>
      )}
    </div>
  );
};
