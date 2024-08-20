import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";
import "../../styles/selfie-movil.component.css";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setFotos } from "../../nucleo/redux/slices/informacionSlice";
import { Spinner } from "reactstrap";
import { setIdCarpetas } from "../../nucleo/redux/slices/pruebaVidaSlice";
import { PruebaVida } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";

interface Props {
  label: string;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  setMostrarPreview: Dispatch<SetStateAction<boolean>>;
  setCapturarOtraVez: Dispatch<SetStateAction<boolean>>;
  setMostrarMensaje: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<boolean>>;
  idUsuarioFi: string | null;
}

export const ValidacionVida: React.FC<Props> = ({
  label,
  setContinuarBoton,
  setMostrarPreview,
  setCapturarOtraVez,
  setMostrarMensaje,
  setError,
  idUsuarioFi,
}) => {
  const iphone = /iPhone/i.test(navigator.userAgent);

  const dispatch = useDispatch();

  const videoRef = useRef<HTMLVideoElement>(null);
  const formData = new FormData();
  const [loading, setLoading] = useState<boolean>(false);

  let mediaRecorder: MediaRecorder | null = null;

  useEffect(() => {
    handleStartRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartRecording = async () => {
    const mimeType = iphone ? "video/mp4" : "video/webm";

    const video = videoRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            exact: "user",
          },
        },
        audio: true,
      });

      if (video) {
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.controls = false;
      }

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorder.start();

      mediaRecorder.ondataavailable = handleDataAvailable;

      setTimeout(handleStopRecording, 3000);
    } catch (e) {
      console.error(e)
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => {
          track.stop();
        });
      }
    }
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      handleUploadVideo(event.data);
    }
  };

  const handleUploadVideo = (videoData: Blob) => {
    setLoading(true);

    formData.append("video", videoData);

    axios({
      method: "post",
      url: `${URLS.pruebaVida}?id=${idUsuarioFi}`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((res) => {

        console.log(res)

        const preview: string = res.data.photo;

        const data: PruebaVida = {
          movimiento: res.data.movimientoDetectado,
          idCarpetaEntidad: res.data.idCarpetaEntidad,
          idCarpetaUsuario: res.data.idCarpetaUsuario,
        };

        if (res.status == 200) {
          if (preview.length >= 1) {
            dispatch(setFotos({ labelFoto: label, data: preview }));
            dispatch(setIdCarpetas(data));
            setContinuarBoton(true);
            setMostrarMensaje(true);
          }
        }
      })
      .finally(() => {
        setMostrarPreview(true);
        setCapturarOtraVez(true);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
      });
  };

  return (
    <>
      {!loading ? (
        <div className="selfie-container">
          <div className="mascara" style={{ zIndex: "500" }}>
            <div className="indicador-persona"></div>
          </div>
          <video
            ref={videoRef}
            className="video-captura"
            autoPlay
            muted
            controls={false}
          />
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Spinner />
        </div>
      )}
    </>
  );
};
