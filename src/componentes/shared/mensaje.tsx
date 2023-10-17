import { Alert } from "reactstrap"
import {useEffect} from 'react';

interface Props{
  textoMensaje: string;
  colorMensaje: string;
}

export const Mensaje:React.FC<Props> = ({textoMensaje, colorMensaje}) => {

  useEffect(() => {
    if(colorMensaje === 'success'){
      console.log('verificado con exito')
    }

    if(colorMensaje === 'warning'){
      console.log('no esta verificado')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Alert color={colorMensaje} className="text-align">
      {textoMensaje}
    </Alert>
  );
};
