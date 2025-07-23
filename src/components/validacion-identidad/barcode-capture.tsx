import SpinnerLoading from "@components/ui/spinner-loading";
import { URLS } from "@nucleo/api-urls/urls";
import {  documentTypes } from "@nucleo/documents/documentsTypes";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Button } from "reactstrap";

export default function BarcodeCapture() {
  const [streamActivo, setStreamActivo] = useState<MediaStream>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<string>("");
  const [type, setType] = useState<string>("Cédula de extranjería");
  const [rectangle, setRectangle] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [data, setData] = useState<string[]>([]);

  const types = documentTypes["col"];

  // const rectangle = barcodes["pdf417"];

  function iniciarCamara() {
    // console.log('funcionando')
    // setMostrarCamara(true);
    // setInit(false)

    const constraints = {
      video: {
        facingMode: "environment", // 📌 Cámara trasera por defecto
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      },
    };

    if (streamActivo) {
      streamActivo.getTracks().forEach((track) => track.stop());
    }

    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          setStreamActivo(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.error("Error al acceder a la cámara:", err);
          alert("No se puede acceder a la cámara.");
        });
    }
  }

  const capturarFoto = () => {
    setLoading(true);
    const canvas = document.createElement("canvas");
    if (
      videoRef.current &&
      !videoRef.current.paused &&
      !videoRef.current.ended
    ) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      // Dibuja la imagen completa del video en el canvas
      if (ctx) {
        const x = rectangle.x * canvas.width;
        const y = rectangle.y * canvas.height;
        const width = rectangle.width * canvas.width;
        const height = rectangle.height * canvas.height;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(x, y, width, height);
        const canvasRecortada = document.createElement("canvas");
        canvasRecortada.width = width;
        canvasRecortada.height = height;
        const ctxRecortado = canvasRecortada.getContext("2d");

        if (ctxRecortado) {
          ctxRecortado.putImageData(imageData, 0, 0);
          const dataUrl = canvasRecortada.toDataURL("image/jpeg", 1.0);

          // setPreview(dataUrl)

          const data = {
            id: 1,
            image: dataUrl,
            documentType: type,
            documentSide: "reverso",
          };

          console.log(dataUrl, type);
          console.log(data);

          readBarcode(data);

          // dispatch(setFotos({ labelFoto: ladoDocumento, data: dataUrl }));

          // setMostrarCamara(false);

          // validarDocumento(
          //   id,
          //   dataUrl,
          //   informacionFirmador.nombre,
          //   informacionFirmador.apellido,
          //   informacionFirmador.documento,
          //   ladoDocumento,
          //   tipoDocumento,
          //   informacion.foto_persona
          // );
        }
      }
    }
  };

  const readBarcode = (body: any) => {
    axios
      .post(`${URLS.testBarcode}?id=1`, body)
      .then((res) => {
        setPreview(res.data.image);
        // setData(res.data.barcodeData);
        setData( (prevBarcode) => [...prevBarcode,...res.data.barcodeData])
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    iniciarCamara();
  }, []);

  useEffect(() => {
    console.log(data)
  }, [data, setData])

  return (
    <div className="">
      <div className="bg-white p-6 flex justify-center ">
        <div className="absolute flex z-20">
          {types.map((type: any) => (
            <button
              onClick={() => {
                setType(type.label);
                setRectangle(type.barcode);
              }}
              className="text-xs"
            >
              {type.label}
            </button>
          ))}
        </div>

        {preview.length >= 1 && !loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-2xl max-h-full overflow-y-auto">
              <img src={preview} alt="Captured" className="max-w-full h-auto" />
              <div>
          resultados: {data.map((result, index) => (
            <li key={index}>{JSON.stringify(result)}</li>
          ))}
              </div>

              <Button color="danger" onClick={() => setPreview("")} className="mt-4">
          Cerrar
              </Button>
            </div>
          </div>
        )}
        {loading && <div className="absolute w-2/4"><SpinnerLoading message="cargando" styles="" id="" /></div>}

        <>
          <div className="video-container border-2 border-black">
            <div className="mask-above">
              Una vez alineado correctamente, presione el botón para tomar la
              foto
            </div>
            <div className="mask-below">testing</div>
            <video ref={videoRef} autoPlay playsInline></video>
            <div
              className="rectangle-mask"
              style={{
                left: `${rectangle.x * 100}%`,
                top: `${rectangle.y * 100}%`,
                width: `${rectangle.width * 100}%`,
                height: `${rectangle.height * 100}%`,
              }}
            ></div>
          </div>
          <div className="buttons">
            <Button color="primary" onClick={capturarFoto}>
              📷 Capturar
            </Button>

            <Button color="danger" onClick={() => setPreview("")}>
              resetear
            </Button>
          </div>
        </>
      </div>
    </div>
  );
}
