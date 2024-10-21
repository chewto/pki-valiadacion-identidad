/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useRef, useEffect, Dispatch, SetStateAction } from "react";
import { URLS } from "../../nucleo/api-urls/validacion-identidad-urls";

interface Props{
  porcentaje: number | undefined;
  setPorcentaje: Dispatch<SetStateAction<number | undefined>>
}

export const PruebaVitalidad: React.FC<Props> = ({ setPorcentaje}) => {
  const photos:string[] = []
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let interval:any;
    let count = 0;

    const capturePhoto = () => {
      const canvas = document.createElement('canvas');
      const video = videoRef.current

      if (video) {
        const context = canvas.getContext('2d');
        if(context){
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const photoUrl = canvas.toDataURL();

          photos.push(photoUrl);
          console.log(photos)

          count++;

          if (count === 9) {
            clearInterval(interval);
            const data = {
              imagenes: photos
            }
            axios({
              method:'post',
              url:URLS.validacionVida,
              data: data,
              headers: {
                "Content-Type": 'application/json'
              }
            })
            .then(res => {
              console.log(res)
              setPorcentaje(res.data)
            })
            .catch(error => console.log(error))

            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              track.stop();
            });
        }
        }
      }
    };

    const startCapture = () => {
      const constraints = { video: true };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          const video = videoRef.current;
          if(video){
            video.srcObject = stream;
            video.play();
          }

          interval = setInterval(capturePhoto, 1250);
        })
        .catch(error => {
          console.error('Error accessing webcam:', error);
        });
    };

    startCapture();

    return () => {
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <video ref={videoRef}  width="0" height="0" />
    </div>
  );
};
