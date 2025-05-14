import {useEffect, useState} from 'react'
import QRCode from "react-qr-code";
import '../../styles/qr.component.css'

export const CodigoQR: React.FC = () => {

  const [direccion, setDireccion] = useState<string>('')

  useEffect(()=> {
    setDireccion(window.location.href)
  },[])

  useEffect(()=> {
    console.log(direccion)
  }, [direccion])

  return (
    <div className="bg-white absolute shadow-xl rounded-lg left-0 bottom-0 mx-2 my-2 p-3 h-auto max-w-56 flex flex-col justify-center items-center">
      <p className='text-center text-xs'>Si desea continuar en su dispositivo movil, escanee el siguiente codigo QR</p>
      <QRCode value={direccion} className="w-3/4 h-auto" id="codigo-qr"/>
    </div>
  );
};
