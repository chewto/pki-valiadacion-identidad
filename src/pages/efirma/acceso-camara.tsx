import { useEffect, useRef, useState } from "react";
import { Button } from "reactstrap";
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
      setTimeout(nextStep, 2500)
    }
  },[desplegarCamara, setDesplegarCamara,nextStep])

  return (
    <div className="flex flex-col items-center my-3">
      <video src="" ref={videoRef} style={{ display: "none" }}></video>

      {desplegarCamara == 0 && (
        <>
          <h3 className="text-lg font-bold text-slate-800 ">Permítenos usar su cámara</h3>
          <p className="xsm:text-sm md:text-base text-center text-slate-800">
            Si ve una ventana emergente que pida acceso a su cámara. Por
            favor, asegurate de hacer click en permitir.
          </p>

          {!esMobile && <img src={accesoCamara} alt="acceso ejemplo" className="my-2" />}
          <Button color="success" onClick={iniciarCamara}>
            Permitir acceso a la cámara
          </Button>
        </>
      )}

      {desplegarCamara == 1 && (
        <>
          <h3 className="text-lg font-bold text-slate-800">El acceso a la cámara concedido</h3>
          <p className="text-center text-slate-800">Puede continuar con la verificación</p>
        </>
      )}

      {desplegarCamara == 2 &&  (
        <>
          <h3 className="text-lg font-bold text-slate-800">El acceso a la cámara fue denegado</h3>
          <p className="text-center text-slate-800">Por favor recargue la página</p>
        </>
      )}
    </div>
  );
};
