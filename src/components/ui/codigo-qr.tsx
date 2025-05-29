import {useEffect, useState} from 'react'
import QRCode from "react-qr-code";
import '../../styles/qr.component.css'
import * as CryptoJS from 'crypto-js';

export const CodigoQR: React.FC = () => {

  // const { hash } = useParams();
  // const [params] = useSearchParams();
  
  // const idParam = params.get("id");
  // const idUsuarioParam = params.get("idUsuario");
  // const tipoParam = params.get("tipo");
  const secretKey = 'test';

  const [direccion, setDireccion] = useState<string>('');

  useEffect(() => {
    // Get the current URL
    const currentUrl = window.location.href;

    // Encrypt the current URL
    const encryptedData = CryptoJS.AES.encrypt(currentUrl, secretKey).toString();

    // Build the URL that points to the Verify component route
    const newUrl = `${window.location.origin}/validacion/#/verify/${encodeURIComponent(encryptedData)}`;
    setDireccion(newUrl);
  }, []);

  useEffect(() => {
    console.log(direccion);
  }, [direccion]);

  return (
    <div className="bg-white absolute shadow-xl rounded-lg left-0 bottom-0 mx-2 my-2 p-3 h-auto qr-container">
      <p className='text-center text-xs'>Si desea continuar en su dispositivo móvil, escanee el siguiente código QR</p>
      <QRCode value={direccion} className="w-full h-auto" id="codigo-qr"/>
    </div>
  );
};
