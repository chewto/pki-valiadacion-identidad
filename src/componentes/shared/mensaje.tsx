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
  }, [])

  return (
    <Alert color={colorMensaje} className="text-align">
      {textoMensaje}
    </Alert>
  );
};
