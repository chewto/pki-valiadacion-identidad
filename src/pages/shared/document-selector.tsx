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

      {/* fieldset + legend: grupo semántico ARIA para los radio buttons */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="text-left text-slate-800 sm:text-2xl text-lg font-semibold mb-2 float-none w-full">
          Seleccione un documento para la verificación
        </legend>

        <div className="flex flex-col gap-1 mt-1">
          {visibleOptions.map((opcion: string) => {
            const isSelected = tipoDocumento === opcion;
            const isPreviousSelection = opcion === userData.tipoDocumento;
            const optionId = `doc-option-${opcion.replace(/\s+/g, '-').toLowerCase()}`

            return (
              <label
                key={opcion}
                htmlFor={optionId}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer
                  transition-all duration-200
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }
                  ${tipoDocumento.length > 0 && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  id={optionId}
                  type="radio"
                  name="tipo_documento"
                  value={opcion}
                  onChange={onChange}
                  checked={isSelected}
                  disabled={tipoDocumento.length > 0}
                  className="accent-blue-600 w-4 h-4 flex-shrink-0"
                  aria-describedby={isPreviousSelection ? `${optionId}-prev` : undefined}
                />

                <div className="flex flex-row gap-2 items-center flex-1 min-w-0">
                  <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                    {opcion}
                  </span>

                  {isPreviousSelection && (
                    <span
                      id={`${optionId}-prev`}
                      className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap"
                    >
                      Selección previa
                    </span>
                  )}
                </div>

                {/* Checkmark visual cuando está seleccionado */}
                {isSelected && (
                  <svg aria-hidden="true" className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};