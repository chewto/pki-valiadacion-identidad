import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function FaceCapture() {
  const [image, setImage] = useState<string>("");
  const [data, setData] = useState<Array<{brightness: number, antiSpoofing: boolean}>>([]);

  const socket = io("http://127.0.0.1:4000/");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("video_frame", (receivedData) => {
      const { frame, brightness, antiSpoofing } = receivedData;

      console.log(brightness, antiSpoofing)

      setImage(frame);
      setData([
        ...data,
        {
          brightness: brightness,
          antiSpoofing: antiSpoofing,
        }
      ]);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.off("connect");
      socket.off("video_frame");
      socket.off("disconnect");
    };
  }, []);

  return (
    <>
      {image.length <= 0 && (
        <iframe
          src="https://desarrollo.e-custodia.com/validacion-back/video-template"
          title="Flask App"
          className="flex justify-center h-screen w-full"
        ></iframe>
      )}

      {image.length >= 1 && (
        <div className="border-4">
          <div className="flex">
            <img src={image} alt="" className="border-2 border-red-500 w-3/6" />
            <div className="border-2 border-blue-500 w-3/6">
              {data.map((metadata) => (
                <>
                  <li>brillo: {metadata.brightness}</li>
                  <li>antiSpoofing: {metadata.antiSpoofing ? 'true' : 'false'}</li>
                </>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => {
                setImage("");
              }}
              className="px-2 py-1 bg-blue-500 text-white rounded-md"
            >
              retomar imagen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
