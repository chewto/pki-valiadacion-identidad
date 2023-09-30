import axios from "axios";
import { useRef, useEffect, useState } from "react";

export const PruebaVitalidad: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);
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

          setPhotos(prevPhotos => [...prevPhotos, photoUrl]);

          count++;

          if (count === 5) {
            clearInterval(interval);
            const data = {
              imagenes: photos
            }
            axios({
              method:'post',
              url:'http://127.0.0.1:5000/validacion-vida',
              data: data,
              headers: {
                "Content-Type": 'application/json'
              }
            })
            .then(res => console.log(res))
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

          interval = setInterval(capturePhoto, 2000);
        })
        .catch(error => {
          console.error('Error accessing webcam:', error);
        });
    };

    startCapture();

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1>Photo Capture Component</h1>
      <video ref={videoRef}  width="640" height="480" />
      <div>
        {photos.map((photo, index) => (
          <img key={index} src={photo} alt={`Photo ${index + 1}`} />
        ))}
        {photos.length}
      </div>
    </div>
  );
};
