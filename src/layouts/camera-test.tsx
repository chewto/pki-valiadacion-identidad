import { useEffect, useRef } from "react"

export default function CameraTest() {

  const videoRef = useRef<HTMLVideoElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {

    // navigator.mediaDevices.enumerateDevices()
    // .then((devices) => {
    //   devices.forEach((device) => {
    //     console.log(device.kind + ": " + device.label + " id = " + device.deviceId)
    //   })
    // })

    const constraints = {
      video: { facingMode: { ideal: "environment" } }
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        const video = videoRef.current
        if(video){
          video.srcObject = stream
          video.play()
          const takePhoto = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const context = canvas.getContext('2d')
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height)
              const dataUrl = canvas.toDataURL('image/png')
              const img = document.createElement('img')
              img.src = dataUrl
              document.body.appendChild(img)
            }
          }

          // buttonRef.addEventListener('click', takePhoto)
          buttonRef.current?.addEventListener('click', takePhoto)
        }
      })
      .catch((err) => {
        if(err.name === 'OverconstrainedError'){
          console.log('The constraints could not be satisfied by the available devices')
        }
      })
  },[])
  
  return (
    <div className="flex flex-col items-center">
      <h1>Camera Test</h1>
      <video ref={videoRef} autoPlay playsInline></video>
      <button ref={buttonRef} className="border-2 border-red-700 py-2 px-3  my-3">Tomar foto</button>
    </div>
  )
}