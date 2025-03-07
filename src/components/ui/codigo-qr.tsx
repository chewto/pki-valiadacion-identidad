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
    <div className="absolute left-0 top-3/4 flex flex-col items-center justify-center border-2 py-2 px-2 bg-white">
      <p className='text-center text-sm'>Si desea continuar en su dispositivo movil, escanee el siguiente codigo QR</p>
      <QRCode value={direccion} className="" id="codigo-qr"/>
    </div>
  );
};
