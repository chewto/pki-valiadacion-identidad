import { useState, Dispatch, SetStateAction, useRef, useEffect } from "react";
import {
  InformacionIdentidad,
  PreviewDocumento,
} from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import "../../styles/selfie-movil.component.css";
import { Button } from "reactstrap";
//import { useMobile } from "../../nucleo/hooks/useMobile";

interface Props {
  informacion: InformacionIdentidad;
  setInformacion: Dispatch<SetStateAction<InformacionIdentidad>>;
  keyFoto: string;
  conteo: number;
  setConteo: Dispatch<SetStateAction<number>>;
  ladoDocumento: string;
  preview: PreviewDocumento;
  setPreview: Dispatch<SetStateAction<PreviewDocumento>>;
  setMostrarPreviewCamara: Dispatch<SetStateAction<boolean>>;
}

export const CapturadorSelfie: React.FC<Props> = ({
  informacion,
  setInformacion,
  keyFoto,
  conteo,
  setConteo,
  ladoDocumento,
  preview,
  setPreview,
  setMostrarPreviewCamara,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // const mobile: boolean = useMobile();

  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false);

  const tomarFoto = (keyFotoParam: string) => {
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

      // Do something with the captured selfie (e.g., save it, display it, etc.)
      setMostrarPreview(true);
      setPreview({
        ...preview,
        [ladoDocumento]: dataUrl,
      });
      setInformacion({
        ...informacion,
        [keyFotoParam]: dataUrl,
      });
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
    setMostrarPreview(false);
    setPreview({
      ...preview,
      [ladoDocumento]: "",
    });
    setConteo(0);
  };

  return (
    <>
      <div className="selfie-container">
        {!mostrarPreview && keyFoto === "foto_persona" && (
          <>
            <div className="video">
              {keyFoto === "foto_persona" && (
                <>
                  <span style={{fontSize: '13px', textAlign: "center"}}>Por favor, quítese la gafas o gorra para realizar la verificación.</span>
                  <video ref={videoRef} className="video-captura" style={{ transform: 'scaleX(-1)', WebkitTransform: 'scaleX(-1)' }} ></video>
                  <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

                  <Button color="success" onClick={() => tomarFoto(keyFoto)}>
                    Tomar selfie
                  </Button>
                  {/* <Camera
                    idealResolution={{
                      width: mobile ? 500 : 600,
                      height: mobile ? 600 : 350,
                    }}
                    imageType={IMAGE_TYPES.JPG}
                    idealFacingMode={FACING_MODES.USER}
                    onTakePhoto={(dataURL) => {
                      tomarFoto(dataURL, keyFoto);
                    }}
                  /> */}
                </>
              )}
              {keyFoto === "foto_persona" && (
                <div className="mascara">
                  <div className="indicador-persona"></div>
                </div>
              )}
            </div>
          </>
        )}

        {mostrarPreview && (
          <>
            <div className="preview">
              <Button color="danger" onClick={capturarOtra}>
                Capturar otra vez
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
