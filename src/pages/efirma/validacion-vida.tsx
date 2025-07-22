/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";
import "../../styles/selfie-movil.component.css";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setFotos } from "../../nucleo/redux/slices/informacionSlice";
import { Button, Spinner } from "reactstrap";
import { setIdCarpetas } from "../../nucleo/redux/slices/pruebaVidaSlice";
import { PruebaVida } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import faceTemplate from "../../assets/img/face_template_OK.png";
import { useSearchParams } from "react-router-dom";

interface Props {
  label: string;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  setMostrarPreview: Dispatch<SetStateAction<boolean>>;
  setCapturarOtraVez: Dispatch<SetStateAction<boolean>>;
  setSuccess: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<boolean>>;
  idUsuarioFi: number | string | null | undefined;
  setMessages: Dispatch<SetStateAction<string[]>>;
  setDebugData: Dispatch<SetStateAction<string[]>>;
  setVideoData: Dispatch<SetStateAction<string[]>>;
}

export const ValidacionVida: React.FC<Props> = ({
  label,
  // setContinuarBoton,
  setMostrarPreview,
  setCapturarOtraVez,
  setSuccess,
  setError,
  // idUsuarioFi,
  setMessages,
  setDebugData,
  setVideoData,
}) => {
  const [params] = useSearchParams();

  const idUser = params.get("idUsuario");

  const dispatch = useDispatch();

  const videoRef = useRef<HTMLVideoElement>(null);
  const formData = new FormData();
  const [loading, setLoading] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<MediaStream | null>(null);
  const [recordingIndicator, setRecordingIndicator] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  // const [isCorrupted, setIsCorrupted] = useState<boolean>(false);

  const [counter, setCounter] = useState<number>(4);

  let mediaRecorder: MediaRecorder | null = null;

  useEffect(() => {
  
    // handleStartRecording();
    handleOpenCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCamera = async () => {
    const video = videoRef.current;

    try {

      const constraints = { video: { facingMode: 'user' }, audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (video) {
        setStreaming(stream);
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.controls = false;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
    setRecordingIndicator(true);

    let timerCount = counter;

    const recordingTimer = setInterval(() => {
      setCounter((prev) => prev - 1);
      timerCount -= 1;

      if (timerCount < 0) {
        clearInterval(recordingTimer);
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }
    }, 1000);

    const recordingIndicatorTimer = setInterval(() => {
      setRecordingIndicator((prev) => !prev);

      if (timerCount < 0) {
        clearInterval(recordingIndicatorTimer);
      }
    }, 500);

    const mimeType = "video/webm";

    if (streaming) {
      mediaRecorder = new MediaRecorder(streaming, {
        mimeType: mimeType,
      });
      mediaRecorder.start();
      mediaRecorder.ondataavailable = handleDataAvailable;
      setTimeout(handleStopRecording, 3000);
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

  const handleUploadVideo = async (videoData: Blob) => {
    setLoading(true);

    // Add a filename to the video when appending to FormData
    // const extension = videoData.type.split("/")[1] || "webm"; // Get 'mp4' or 'webm' from the mime type
    const fileName = `video_${idUser}.webm`;
    formData.append("video", videoData, fileName);

    formData.append("video", videoData);
    const videoUrl = URL.createObjectURL(videoData);
    const sizeKB = (videoData.size / 1024).toFixed(2);
    const xd = {
      url: videoUrl,
      peso: sizeKB,
    };
    setVideoData((prevData) => [...prevData, JSON.stringify(xd)]);

    // Show the size of the video in KB
    // setMessages((prev) => [...prev, `Tamaño del video: ${sizeKB} KB`]);

    let videoPath = "";

    await axios
      .post(URLS.saveVideo, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        const path = res.data;
        videoPath = path.ruta;
      });

    await axios
      .post(`${URLS.pruebaVida}?path=${videoPath}`)
      .then((res) => {
        const preview: string = res.data.photo;

        const data: PruebaVida = {
          movimiento: res.data.movimientoDetectado,
          videoHash: videoPath,
        };

        const debugString = JSON.stringify(res.data);
        setDebugData((prevData) => [...prevData, debugString]);

        setMessages((prevMessages) => [...prevMessages, ...res.data.messages]);

        if (res.status == 200) {
          if (preview.length >= 1) {
            dispatch(setFotos({ labelFoto: label, data: preview }));
            dispatch(setIdCarpetas(data));
          }
          if (preview.length >= 1 && res.data.messages.length <= 0) {
            // setContinuarBoton(true);
            setSuccess(true);
            setMessages([]);
          }
        }

        // if (res.status == 201) {
        //   setIsCorrupted(true);
        // }
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
      <div className="border-1 border-yellow-400 rounded-lg px-2 py-1 my-1 text-center bg-yellow-200 text-sm">
        Consejo: mantengase quieto en el indicador
      </div>

      {!loading ? (
        <div className=" flex flex-col items-center relative mt-1">
          <div className="flex justify-center">
            <div
              className="absolute w-full h-5/6 flex justify-center items-center"
              style={{ zIndex: "500" }}
            >
              <img
                src={faceTemplate}
                className="md:w-6/12 xsm:w-10/12"
                alt=""
              />
            </div>

            <div className="absolute top-0 xsm:left-3 md:left-7 flex justify-center items-center gap-1 mx-2 my-2 px-2 py-1 bg-white rounded-lg z-50 ">
              {counter} s
              <div
                className={`w-4 h-4 transition-colors duration-300 rounded-lg ${
                  recordingIndicator ? "bg-red-50" : "bg-red-600"
                }`}
              ></div>
            </div>

            <video
              ref={videoRef}
              className="rounded-lg w-12/12 h-full aspect-auto  transform scale-x-[-1] z-0"
              autoPlay
              muted
              controls={false}
            />
          </div>

          <div>
            <Button
              color="primary"
              disabled={recording}
              onClick={handleStartRecording}
              // className={`my-2 gap-2 ${isMobile ? 'fixed bottom-4 left-1/2 transform -translate-x-1/2 ': 'flex'}`}
              className={`my-2 mt-5`}
              // className={`my-2 gap-2`}
              style={{ display: "flex" }}
            >
              Tomar selfie
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z" />
                </svg>
              </span>
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Spinner />
        </div>
      )}
    </>
  );
};
