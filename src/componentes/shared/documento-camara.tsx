import Camera from "react-html5-camera-photo"
import 'react-html5-camera-photo/build/css/index.css'
import { FACING_MODES } from "react-html5-camera-photo"
import { useDispatch } from "react-redux"
import { setFotos } from "../../nucleo/redux/slices/informacionSlice"

export const Camara:React.FC = () => {

  const dispatch = useDispatch()

  const tomarFoto = (dataURL:string) => {
    dispatch(setFotos({labelFoto: '', data: dataURL}))
  }
  
  return(
  <div>
    <Camera 
    idealFacingMode={FACING_MODES.ENVIRONMENT}
    onTakePhoto={(dataURL) => {tomarFoto(dataURL)}}/>
  </div>
  )
}

