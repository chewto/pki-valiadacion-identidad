import { useState, Dispatch, SetStateAction, useRef, useEffect } from "react";
import "../../styles/selfie-movil.component.css";
import { Button } from "reactstrap";
import { useDispatch } from "react-redux";
import { setFotos, setVaciarFoto } from "../../nucleo/redux/slices/informacionSlice";

interface Props {
  labelFoto: string;
  conteo: number;
  setConteo: Dispatch<SetStateAction<number>>;
  setMostrarPreviewCamara: Dispatch<SetStateAction<boolean>>;
}

export const CapturadorSelfie: React.FC<Props> = ({
  labelFoto,
  conteo,
  setConteo,
  setMostrarPreviewCamara,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [capturarOtraVez, setCapturarOtravez] = useState<boolean>(false);

  const dispatch = useDispatch()

  const tomarFoto = (labelFotoParam: string) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match video stream
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const canvasWidth = video.clientWidth;
      const canvasHeight = canvasWidth / videoAspectRatio;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      context?.scale(-1, 1);
      context?.translate(-canvasWidth, 0);

      // Draw the current frame from the video stream onto the canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      context?.setTransform(1, 0, 0, 1, 0, 0);

      // Get the image data from the canvas as a data URL
      const dataUrl = canvas.toDataURL("image/jpeg");

      dispatch(setFotos({labelFoto: labelFotoParam, data: dataUrl}))

      // Do something with the captured selfie (e.g., save it, display it, etc.)
      setCapturarOtravez(true);


      setConteo(conteo + 1);
      setMostrarPreviewCamara(true);
    }
  };

  useEffect(() => {
    if (
      !("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices)
    ) {
      console.log("getUserMedia is not supported in this browser");
    }

    // Request camera access
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        // Camera access granted, stream contains the video stream
        if (videoRef.current) {
          videoRef.current.setAttribute("autoplay", "");
          videoRef.current.setAttribute("muted", "");
          videoRef.current.setAttribute("playsinline", "");
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((error) => {
        // Camera access denied or error occurred
        console.log("Error accessing camera:", error);
      });
  });

  const capturarOtra = () => {
    dispatch(setVaciarFoto())
    setCapturarOtravez(false);
    setConteo(0);
  };

  return (
    <>
      <div className="selfie-container">
        {!capturarOtraVez && labelFoto === "foto_persona" && (
          <>
            <div className="video">
              {labelFoto === "foto_persona" && (
                <>
                    <span style={{fontSize: '16px', margin: '0 0 10px 0', textAlign: 'center'}}>Por favor, quítese la gafas o gorra para realizar la verificación.</span>
                  <video ref={videoRef} className="video-captura" style={{ transform: 'scaleX(-1)', WebkitTransform: 'scaleX(-1)' }} ></video>
                  <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

                  <Button color="success" onClick={() => tomarFoto(labelFoto)}>
                    Tomar selfie
                  </Button>
                </>
              )}
              {labelFoto === "foto_persona" && (
                <div className="mascara">
                  <div className="indicador-persona"></div>
                </div>
              )}
            </div>
          </>
        )}

        {capturarOtraVez && (
          <>
            <div className="preview">
              <Button color="danger" onClick={capturarOtra}>
                Capturar otra vez, si la imagen no se ve correctamente
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
