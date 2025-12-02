import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTipoDocumento } from "@nucleo/redux/slices/informacionSlice";
import SuccessStep from "@components/ui/success-step";
import { RootState } from "@nucleo/redux/store";

// Constante para evitar "magic strings"
const DOC_PASAPORTE = "PASAPORTE";

interface Props {
  tipoDocumento: string;
  documentList: string[];
  continuarBoton?: boolean; // Lo marqué opcional ya que no se usaba en el render
  nextStep: () => void;
  useModel: boolean;
}

export const DocumentSelector: React.FC<Props> = ({
  tipoDocumento,
  documentList,
  nextStep,
  useModel,
}: Props) => {
  const dispatch = useDispatch();
  
  // Selector optimizado
  const userData = useSelector((state: RootState) => state.firmador);
  
  const [successStep, setSuccessStep] = useState<boolean>(false);

  // 1. Filtrar opciones antes de renderizar
  // Si 'useModel' es true, sacamos el Pasaporte de la lista.
  const visibleOptions = useMemo(() => {
    return documentList.filter((opcion:string) => 
      !(opcion === DOC_PASAPORTE && useModel)
    );
  }, [documentList, useModel]);

  // 2. Efecto de auto-avance
  useEffect(() => {
    // Verificamos que haya un documento seleccionado y que NO estemos ya en proceso de éxito
    if (tipoDocumento && tipoDocumento.length > 0) {
      setSuccessStep(true);

      const timer = setTimeout(() => {
        nextStep();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [tipoDocumento, nextStep, successStep]);

  const onChange = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const valor = evento.target.value;
    dispatch(setTipoDocumento({ tipoDocumento: valor }));
  };

  return (
    <div className="flex flex-col">
      <SuccessStep show={successStep} />
      
      <p className="text-left text-slate-800 sm:text-2xl text-lg font-semibold mb-0">
        Seleccione un documento para la verificación
      </p>

      <div className="m-0">
        {visibleOptions.map((opcion:string) => {
            const isSelected = tipoDocumento === opcion;
            const isPreviousSelection = opcion === userData.tipoDocumento;

            return (
              <label 
                // Usar el valor único como key es mejor práctica que el index
                key={opcion} 
                className="my-2 flex gap-1 hover:cursor-pointer items-center"
              >
                <input
                  type="radio"
                  name="tipo_documento"
                  value={opcion}
                  onChange={onChange}
                  checked={isSelected}
                  // Ya no necesitamos la lógica de 'hidden' ni 'disabled' aquí
                  // porque filtramos la opción en 'visibleOptions'
                  className={`text-slate-800 font-semibold focus:ring-slate-800`}
                  disabled={tipoDocumento.length > 0}
                />

                <div className={`w-full flex flex-row gap-2 items-center ml-2 ${isSelected ? '': ''}`} >
                  <span className="text-slate-800 font-medium">
                    {opcion}
                  </span>

                  {isPreviousSelection && (
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      Opcion seleccionada previamente.
                    </span>
                  )}
                </div>
              </label>
            );
        })}
      </div>
    </div>
  );
};