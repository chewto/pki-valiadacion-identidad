import {useEffect, useState} from 'react'
import QRCode from "react-qr-code";
import '../../styles/qr.component.css'
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { URLS } from '@nucleo/api-urls/urls';
import { Spinner } from 'reactstrap';

const URL = import.meta.env.VITE_QR_BASE_URL

interface resProp{
  enlace: string;
}

export const CodigoQR: React.FC = () => {

  const [params] = useSearchParams();
  
  const idSigner = params.get("idUsuario");

  const [qrValue, setQrValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios.get(`${URLS.getLink}?id=${idSigner}`)
    .then((res: {data: resProp}) => {
      setLoading(false);
      setQrValue(`${URL}/${res.data.enlace}`);
    })
  }, [])

  return (
    <div className="bg-white absolute shadow-xl rounded-lg left-0 bottom-0 mx-2 my-2 p-3 h-auto qr-container flex flex-col items-center">
      <p className='text-center text-xs'>Si desea continuar en su dispositivo móvil, escanee el siguiente código QR</p>
      {loading ? <Spinner color='primary' /> :<QRCode value={qrValue} className="w-full h-auto" id="codigo-qr"/>}
    </div>
  );
};
