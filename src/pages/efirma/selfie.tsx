import faceTemplate from "@assets/img/face_template_OK.png";
import { URLS } from "@nucleo/api-urls/urls";
import { PruebaVida } from "@nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { setFotos } from "@nucleo/redux/slices/informacionSlice";
import { setIdCarpetas } from "@nucleo/redux/slices/pruebaVidaSlice";
import axios from "axios";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "reactstrap";
import "@styles/selfie.css";

interface Props {
  label: string;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  setMostrarPreview: Dispatch<SetStateAction<boolean>>;
  setCapturarOtraVez: Dispatch<SetStateAction<boolean>>;
  setSuccess: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<boolean>>;
  idUsuarioFi: number | string | null | undefined;
  setMessages: Dispatch<SetStateAction<string[]>>;
  counter: number;
  setCounter: Dispatch<SetStateAction<number>>;
  tries: number;
}

const Selfie: React.FC<Props> = ({
  label,
  setMostrarPreview,
  setCapturarOtraVez,
  setSuccess,
  setError,
  setMessages,
  counter,
  setCounter,
  tries,
}) => {
  const dispatch = useDispatch();

  const [params] = useSearchParams();

  const idUser = params.get("idUsuario");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [timer, setTimer] = useState<number>(4);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const constraints = { video: { facingMode: "user" }, audio: true };
        const mediaStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.log(err);
      }
    };
    initCamera();
    return () => stream?.getTracks().forEach((track) => track.stop());
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!stream) return;
    if (typeof MediaRecorder === "undefined") {
      return;
    }

    let chunks: Blob[] = [];

    // Detect Safari (iOS) vs otros
    const ua = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    // Priorizar tipos compatibles con Safari y otros
    const candidateTypes = isSafari
      ? [
          "video/mp4; codecs=avc1.42E01E",
          "video/mp4",
          "video/webm; codecs=vp9",
          "video/webm; codecs=vp8",
          "video/webm",
        ]
      : [
          "video/webm; codecs=vp9",
          "video/webm; codecs=vp8",
          "video/webm",
          "video/mp4; codecs=avc1.42E01E",
          "video/mp4",
        ];
    const mimeType =
      candidateTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (e) {
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blobType = mimeType || "application/octet-stream";
      const videoBlob = new Blob(chunks, { type: blobType });
      // const videoURL = URL.createObjectURL(videoBlob);

      if (videoRef.current) {
        // videoRef.current.srcObject = null;
        // videoRef.current.src = videoURL;
        videoRef.current.controls = false;
        videoRef.current.classList.remove("live-stream");
        videoRef.current.play().catch((e) => console.log(e));
      }

      saveMedia(videoBlob);

      setIsRecording(false);

      chunks = [];
    };

    setMediaRecorder(recorder);
    // eslint-disable-next-line
  }, [stream]);

  const recordVideo = () => {
    if (!mediaRecorder) return;
    setIsRecording(true);
    mediaRecorder.start();
    setTimeout(() => {
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
    }, 4000);

    let timerCount = timer;

    const recordingTimer = setInterval(() => {
      setTimer((prev) => prev - 1);
      timerCount -= 1;

      if (timerCount < 0) {
        clearInterval(recordingTimer);
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }
    }, 1000);

    const recordingIndicatorTimer = setInterval(() => {
      setIsRecording(true);

      if (timerCount < 0) {
        clearInterval(recordingIndicatorTimer);
      }
    }, 500);
  };

  const saveMedia = async (data: Blob) => {
    setLoading(true);
    const formData = new FormData();

    const blobType = data.type || "";
    const ext = blobType.startsWith("video/mp4") ? "mp4" : "webm";
    const filename = `video_${idUser}.${ext}`;
    formData.append("video_data", data, filename);

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

        if (counter < tries - 1) {
          setMessages((prevMessages) => [
            ...prevMessages,
            ...res.data.messages,
          ]);
        }
        if (counter == tries) {
          setMessages([]);
        }

        if (res.status == 200) {
          if (
            !res.data.photoResult.isReal &&
            res.data.movimientoDetectado == "!OK"
          ) {
            setCounter((state) => state + 1);
            // setTriesCounter((state) => state - 1)
          }

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

  // const resetToLiveView = () => {
  //   if (videoRef.current && stream) {
  //     videoRef.current.srcObject = stream;
  //     videoRef.current.controls = false;
  //     videoRef.current.classList.add("live-stream");
  //   }
  // };

  return (
    <div>
      {!loading ? (
        <>
          <div id="media-container" className="video-container">
            <img
              src={faceTemplate}
              className="mask"
              alt=""
              style={{ pointerEvents: "none" }}
            />

            {isRecording && (
              <div className="text-sm font-semibold opacity-90 absolute top-0 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 my-2 px-2 py-1 bg-white rounded-lg indicator">
                Grabando {timer} s
                <div className="w-3 h-3 transition-colors duration-300 rounded-xl bg-red-600"></div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="video"
              style={{
                transform: "scaleX(-1)", // Aplica efecto espejo
                // width: "100%",
                // height: "auto",
              }}
            />
          </div>

          <div className="flex justify-center">
            <button
              id="video-btn"
              onClick={recordVideo}
              disabled={isRecording}
              className={`py-2 px-3 mt-2 text-white font-bold rounded-md text-sm ${
                !isRecording ? "bg-blue-600" : "bg-blue-300"
              }`}
            >
              Grabar Video
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center my-2">
          <Spinner />
          <span>Validando rostro.</span>
        </div>
      )}
    </div>
  );
};

export default Selfie;
