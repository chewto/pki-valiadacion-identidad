import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { setFotos } from "@nucleo/redux/slices/informacionSlice";
import { useDispatch } from "react-redux";
import { Spinner } from "reactstrap";

interface Props {
  ladoDocumento: string;
  tipoDocumento: string;
  sendDocument: () => void;
  preview: string;
  loading: boolean;
  setMessages: Dispatch<SetStateAction<string[]>>;
  setIsCorrupted: Dispatch<SetStateAction<boolean>>;
  setRetry: Dispatch<SetStateAction<boolean>>;
  retry: boolean;
  placeholder: string;
}

export default function Camera({
  ladoDocumento,
  placeholder,
  tipoDocumento,
  sendDocument,
  loading,
  setMessages,
  setIsCorrupted,
  setRetry,
  retry,
  preview,
}: Props) {
  const dispatch = useDispatch();
  const [horizontal, setHorizontal] = useState<boolean>(false);
  const [takePhoto, setTakePhoto] = useState<boolean>(false);

  const verificarOrientacion = () => {
    if (window.matchMedia("(orientation: landscape)").matches) {
      setHorizontal(true);
    } else {
      setHorizontal(false);
    }
  };

  useEffect(() => {
    window.addEventListener("orientationchange", verificarOrientacion);
    window.addEventListener("resize", verificarOrientacion);
    verificarOrientacion();
    return () => {
      window.removeEventListener("orientationchange", verificarOrientacion);
      window.removeEventListener("resize", verificarOrientacion);
    };
  }, []);

  useEffect(() => {
    console.log(horizontal);
  }, [horizontal]);

  const captureImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    setMessages([]);
    setRetry(false);
    setIsCorrupted(false);

    const archivo = event.target.files?.[0];
    const lector = new FileReader();

    if (archivo) lector.readAsDataURL(archivo);

    lector.onload = () => {
      const dataURL = lector.result;
      const img = new Image();
      if (typeof dataURL === "string") {
        img.src = dataURL;

        const imagen = new Image();

        imagen.src = typeof dataURL === "string" ? dataURL : "";

        imagen.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = imagen.width;
          canvas.height = imagen.height;

          ctx?.drawImage(imagen, 0, 0, imagen.width, imagen.height);

          const dataURLImage = canvas.toDataURL("image/jpeg", 1.0);

          if (dataURLImage.length >= 1) {
            dispatch(
              setFotos({ labelFoto: ladoDocumento, data: dataURLImage })
            );
            sendDocument();
          } else {
            setIsCorrupted(true);
          }
        };
      }
    };

    event.target.value = "";
  };

  return (
    <>
      {!horizontal && !takePhoto && (
        <div className="text-justify flex flex-col border-gray-300 border-1 bg-slate-100 gap-2 rounded-md p-2">
          <p className="m-0 text-sm">
            Por favor, gira tu teléfono en modo horizontal para tomar la foto
            del documento.
          </p>
          <p className="m-0 text-sm">
            Si el dispositivo no gira automaticamente verifica en ajustes que la
            rotación de pantalla esté habilitada.
          </p>
          <button onClick={() => setTakePhoto(true)} className="text-sm border-1 border-gray-200 ">
            Pulse aqui si no gira el dispositivo
          </button>
        </div>
      )}

      {horizontal && (
        <div className={`${loading ? "hidden" : "flex"} flex-col `}>
          <span className="text-center font-bold text-sm m-0 ">
        La foto debe mostrar el documento completo, todos los textos completamente enfocados y sin ningún tipo de sombra, de forma que se puedan reconocer todos los datos.
    </span>
          
          <label
            className="file-input text-center"
            style={{
              background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
            }}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={captureImage}
              className="opacity-0 w-0"
              disabled={loading}
            />
            {preview.length <= 0 &&
              `Subir foto del ${placeholder} de su ${tipoDocumento}`}
            {retry && "Reintentar subir documento"}
            {loading && <Spinner></Spinner>}
          </label>
        </div>
      )}

      {!horizontal && takePhoto && (
        <div className={`${loading ? "hidden" : "flex"} flex-col`}>
          <span className="text-center font-bold text-sm m-0 "> 
        La foto debe mostrar el documento completo, todos los textos completamente enfocados y sin ningún tipo de sombra, de forma que se puedan reconocer todos los datos.
    </span>
          <label
            className="file-input text-center"
            style={{
              background: preview.length >= 1 ? "#00ba13" : "#0d6efd",
            }}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={captureImage}
              className="opacity-0 w-0"
              disabled={loading}
            />
            {preview.length <= 0 &&
              `Subir foto del ${placeholder} de su ${tipoDocumento}`}
            {retry && "Reintentar subir documento"}
            {loading && <Spinner></Spinner>}
          </label>
        </div>
      )}

      {/* {open && (
        <>
          <span className="text-center text-sm mb-2">
            Presione el boton al final de la pantalla para tomar la foto del
            documento
          </span>
          <div className="w-full h-full flex justify-center items-center">
            <div
              className={`fixed inset-0 flex items-center justify-center z-40`}
            >
              <div className="bg-white p-6 w-screen h-screen z-40">
                <div className="video-container">
                  <div className="mask-above">
                    Una vez alineado correctamente, presione el botón para tomar
                    la foto
                  </div>
                  <div className="mask-below">
                    Por favor, coloque su documento dentro del recuadro rojo en
                    pantalla y asegúrese de que quede completamente visible y
                    enfocado
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    controls={false}
                    className="z-50"
                  ></video>
                  <div
                    className="rectangle-mask"
                    style={{
                      left: `${rectangulo.x * 100}%`,
                      top: `${rectangulo.y * 100}%`,
                      width: `${rectangulo.width * 100}%`,
                      height: `${rectangulo.height * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="buttons">
                  <Button color="primary" onClick={capturarFoto}>
                    📷 Capturar
                  </Button>

                  <Button color="danger" onClick={() => setOpen(false)}>
                    cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div ref={elementoScroll}></div>
        </>
      )}

      {!loading && !success && (
        <button
          className="file-input"
          onClick={() => {
            setOpen(true);
            iniciarCamara();
          }}
        >
          Tomar foto
        </button>
      )}

      {retry && !continuarBoton && (
        <Alert color="warning" className="text-center z-0">
          vuelva a intentarlo
        </Alert>
      )} */}

      {/* {!mostrarCamara && retry && (
                <button className="file-input" onClick={retomar}>
                  tomar foto de nuevo
                </button>
              )} */}
    </>
  );
}
