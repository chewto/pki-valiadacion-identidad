import { useState } from "react"
import Camera from "react-html5-camera-photo"
import 'react-html5-camera-photo/build/css/index.css'
import { FACING_MODES } from "react-html5-camera-photo"

export const Prueba:React.FC = () => {

  const [foto, setFoto] = useState('')

  const tomarFoto = (dataURL:string) => {
    setFoto(dataURL)
  }
  
  return(
  <div>
    <Camera 
    idealFacingMode={FACING_MODES.ENVIRONMENT}
    onTakePhoto={(dataURL) => {tomarFoto(dataURL)}}/>

    <img src={foto} alt="" />
  </div>
  )
}

