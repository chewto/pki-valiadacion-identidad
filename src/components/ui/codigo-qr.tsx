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
    <div className="qr-container">
      <p>Si desea continuar en su dispositivo movil, escanee el siguiente <a href="#codigo-qr">codigo QR</a></p>
      <QRCode value={direccion} className="qr" id="codigo-qr"/>
    </div>
  );
};
