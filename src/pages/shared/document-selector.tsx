import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setTipoDocumento } from "@nucleo/redux/slices/informacionSlice";
import SuccessStep from "@components/ui/success-step";

interface DocumentList{
  barcode: string;
  type: string;
}

interface Props {
  tipoDocumento: string;
  documentList: DocumentList[];
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
  nextStep: () => void;
  useModel: boolean;
}

export const DocumentSelector: React.FC<Props> = ({
  tipoDocumento,
  documentList,
  nextStep, 
  useModel
}) => {

  const dispatch = useDispatch()
  const [successStep, setSuccessStep] = useState<boolean>(false)

  useEffect(()=> {
    // if(continuarBoton === true){
    //   setContinuarBoton(false)
    // }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(() => {
    if (tipoDocumento.length >= 1) {
      // setContinuarBoton(true);
      setSuccessStep(true)

      setTimeout(() => {
        nextStep()
      },3000)
    }
  }, [tipoDocumento.length]);

  const onChange = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const valor = evento.target.value;
    dispatch(setTipoDocumento({tipoDocumento: valor}))
  };

  return (
    <div className="flex flex-col">
      <SuccessStep show={successStep}/>
      <p className="text-left text-slate-800  sm:text-2xl text-lg font-semibold mb-0">
        Seleccione un documento para la verificación
      </p>
      <div className="mb-1 mt-2">

      {documentList.map((opcion, index) => (
        <label className="my-1 flex gap-1 hover:cursor-pointer" key={index}>
          {tipoDocumento.length >= 1 && opcion.type === tipoDocumento ? (
            <input
            type="radio"
              name="tipo_documento"
              value={opcion.type}
              onChange={onChange}
              className={`${opcion.type == 'PASAPORTE' && useModel ? 'hidden' : ''} text-slate-800 font-semibold`}
              checked
              disabled={opcion.type == 'PASAPORTE' && useModel}
              />
            ) : (
              <input
              type="radio"
              name="tipo_documento"
              value={opcion.type}
              onChange={onChange}
              className={`${opcion.type == 'PASAPORTE'  && useModel ? 'hidden' : ''} text-slate-800 font-semibold`}
              disabled={opcion.type == 'PASAPORTE' && useModel}
              />
            )}
          <span className={`${opcion.type == 'PASAPORTE'  && useModel ? 'hidden' : ''}`}>{opcion.type}</span>
        </label>
      ))}
      </div>
    </div>
  );
};
