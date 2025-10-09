import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setTipoDocumento } from "@nucleo/redux/slices/informacionSlice";
import SuccessStep from "@components/ui/success-step";

interface Props {
  tipoDocumento: string;
  documentList: string[];
  continuarBoton: boolean;
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

  useEffect(() => {
    if (tipoDocumento.length >= 1) {
      // setContinuarBoton(true);
      setSuccessStep(true)

      setTimeout(() => {
        nextStep()
      },700)
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
          {tipoDocumento.length >= 1 && opcion === tipoDocumento ? (
            <input
            type="radio"
              name="tipo_documento"
              value={opcion}
              onChange={onChange}
              className={`${opcion == 'PASAPORTE' && useModel ? 'hidden' : ''} text-slate-800 font-semibold`}
              checked
              disabled={opcion == 'PASAPORTE' && useModel}
              />
            ) : (
              <input
              type="radio"
              name="tipo_documento"
              value={opcion}
              onChange={onChange}
              className={`${opcion == 'PASAPORTE'  && useModel ? 'hidden' : ''} text-slate-800 font-semibold`}
              disabled={opcion == 'PASAPORTE' && useModel}
              />
            )}
          <span className={`${opcion == 'PASAPORTE'  && useModel ? 'hidden' : ''}`}>{opcion}</span>
        </label>
      ))}
      </div>
    </div>
  );
};
