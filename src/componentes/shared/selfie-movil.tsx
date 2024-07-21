import { Dispatch, SetStateAction, useRef, useEffect } from "react";
import "../../styles/selfie-movil.component.css";
import { Button } from "reactstrap";
import { useDispatch } from "react-redux";
import { setFotos } from "../../nucleo/redux/slices/informacionSlice";

interface Props {
  labelFoto: string;
  setMostrarPreviewCamara: Dispatch<SetStateAction<boolean>>;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  setCapturarOtravez: Dispatch<SetStateAction<boolean>>;
  capturarOtravez: boolean;
}

export const CapturadorSelfie: React.FC<Props> = ({
  labelFoto,
  setMostrarPreviewCamara,
  setContinuarBoton,
  setCapturarOtravez,
  capturarOtravez
}) => {

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStream = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

      setContinuarBoton(true)
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
        mediaStream.current = stream
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

      return () => {
        if(mediaStream.current){
          mediaStream.current.getVideoTracks().forEach((track) => {
            if(track.readyState == "live"){
              track.stop()
            }
          })
        }
      }
  }, []);

  return (
      <div className="selfie-container">
        {!capturarOtravez && (
          <>
            <div className="video">
              {labelFoto === "foto_persona" && (
                <>
                  <video 
                    ref={videoRef} 
                    className="video-captura" 
                    style={{ transform: 'scaleX(-1)', WebkitTransform: 'scaleX(-1)' }} >
                  </video>
                  <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

                  <Button color="success" onClick={() => tomarFoto(labelFoto)}>
                    Tomar selfie
                  </Button>
                </>
              )}

                <div className="mascara">
                  <div className="indicador-persona"></div>
                </div>
            </div>
          </>
        )}
      </div>
  );
};
