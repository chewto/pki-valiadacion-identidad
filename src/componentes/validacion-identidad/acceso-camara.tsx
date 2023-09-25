import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button } from "reactstrap";
import "../../styles/acceso-camara.component.css";

interface Props {
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
}

export const AccesoCamara: React.FC<Props> = ({ setContinuarBoton }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [desplegarCamara, setDesplegarCamara] = useState<number>(0);
  const [accesoCamara, setAccesoCamara] = useState<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;

    if (accesoCamara) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            if (video) {
              video.srcObject = stream;
              video.play();
              console.log("accesso permitido");
              setDesplegarCamara(1);
              setContinuarBoton(true);
            }
          })
          .catch(() => {
            setDesplegarCamara(2);
            console.log("accesso denegado");
          });
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accesoCamara]);

  return (
    <div className="acceso-container">
      <video src="" ref={videoRef} style={{ display: "none" }}></video>

      {desplegarCamara == 0 && (
        <>
          <h3>Permitenos usar la camara</h3>
          <p>
            Veras una ventana emergente que te pedira accesso a tu camara. Por
            favor, asegurate de hacer click en permitir.
          </p>
          <Button color="success" onClick={() => setAccesoCamara(true)}>
            Permitir acceso a la camara
          </Button>
        </>
      )}

      {desplegarCamara == 1 && (
        <>
          <h3>El acceso a la camara concedido</h3>
          <p>Puede continuar con la verificacion</p>
        </>
      )}

      {desplegarCamara == 2 &&  (
        <>
          <h3>El acceso a la camara fue denegado</h3>
          <p>Por favor recargue la pagina</p>
        </>
      )}
    </div>
  );
};
