import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@nucleo/redux/store";
import { useEntityBranding } from "@nucleo/hooks/useEntityBranding";

interface Props{
  titulo: string;
}

export const Header:React.FC<Props> = ({titulo}) => {
  const [params] = useSearchParams();
  const firmador = useSelector((state: RootState) => state.firmador);

  const efirmaId = params.get("idUsuario") ?? firmador.idUsuario;
  const { logoUrl } = useEntityBranding(efirmaId);

  const [broken, setBroken] = useState<boolean>(false);
  useEffect(() => setBroken(false), [logoUrl]);

  return(
    <header className='w-full flex flex-col items-center'>
      {logoUrl && !broken && (
        <img src={logoUrl} alt="logo entidad" className='md:w-2/12 xsm:w-2/12' onError={() => setBroken(true)}/>
      )}
      <h2 className=" text-blue-600 text-center font-bold  md:text-lg xsm:text-sm  mb-0">{titulo}</h2>
    </header>
  )
}
