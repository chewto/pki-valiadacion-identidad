import React, { useRef, useState, useEffect } from 'react';

export const VideoRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);

  const formData = new FormData();

  const [data, setData] = useState<any>();

  let mediaRecorder: MediaRecorder | null = null;
  const recordedChunks: Blob[] = [];

  const handleStartRecording = async () => {

    const video = videoRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })

    if(video){
      video.srcObject = stream;
    }

    if(!MediaRecorder.isTypeSupported('video/webm')){
      console.warn("video/webm is not supported")
    }

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm'
    })

    mediaRecorder.start()

    mediaRecorder.ondataavailable = handleDataAvailable;

    setTimeout(handleStopRecording, 3000);

  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
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
      recordedChunks.push(event.data);

      setData(event.data)


    }
  };

  const handleUploadVideo = () => {

    formData.append("video", data)

      fetch('http://127.0.0.1:4000/prueba', {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (response.ok) {
            console.log('Video uploaded successfully');
          } else {
            console.error('Failed to upload video');
          }
        })
        .catch((error) => {
          console.error('Error uploading video:', error);
        });
    
  };

  return (
    <>
      <video ref={videoRef} autoPlay muted />
      {!isRecording ? (
        <>
          <button onClick={handleStartRecording}>Start Recording</button>
          <button onClick={handleUploadVideo}>Upload Video</button>
          {recordedVideo && (
            <>
            
              <a href={URL.createObjectURL(recordedVideo)} download="recorded-video.webm">
                Download Video
              </a>
            </>
          )}
        </>
      ) : (
  
        <button onClick={handleStopRecording}>Stop Recording</button>
      )}
    </>
  );
};
