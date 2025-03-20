import {useEffect, useState} from 'react'
import QRCode from "react-qr-code";
import '../../styles/qr.component.css'

export const CodigoQR: React.FC = () => {

  const [direccion, setDireccion] = useState<string>('')

  useEffect(()=> {
    setDireccion(window.location.href)
  },[])

  // useEffect(()=> {
  //   console.log(direccion)
  // }, [direccion])

  return (
    <div className="bg-white absolute shadow-xl rounded-lg left-0 bottom-0 mx-2 my-2 p-3 h-auto qr-container">
      <p className='text-center text-xs'>Si desea continuar en su dispositivo móvil, escanee el siguiente código QR</p>
      <QRCode value={direccion} className="w-full h-auto" id="codigo-qr"/>
    </div>
  );
};
