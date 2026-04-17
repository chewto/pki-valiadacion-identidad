import { RootState } from "@nucleo/redux/store";
import { useSelector } from "react-redux";

interface Props {
  tipo: string | null;
  paso: number;
}

const STEP_LABELS_TIPO3_CON_SELFIE = ["Documento", "Cámara", "Selfie", "Anverso", "Reverso"];
const STEP_LABELS_TIPO3_SIN_SELFIE = ["Documento", "Cámara", "Anverso", "Reverso"];

export const PasosEnumerados: React.FC<Props> = ({ tipo, paso }) => {
  const informacionFirmador = useSelector((state: RootState) => state.firmador)

  const pasosTipo1 = [1, 2, 3, 4, 5];
  const pasosTipo2 = informacionFirmador.validacionVida
    ? [4, 5, 6, 7]
    : [4, 5, 6, 7, 8];

  // Etiquetas para el stepper tipo 3
  const labels3 = informacionFirmador.validacionVida
    ? STEP_LABELS_TIPO3_SIN_SELFIE
    : STEP_LABELS_TIPO3_CON_SELFIE;

  const totalTipo3 = pasosTipo2.length;
  // paso 0 = primer step visible (índice 0 en labels3)
  const currentLabelIndex = Math.min(paso, labels3.length - 1);

  return (
    <nav aria-label="Progreso del proceso de verificación" className="z-0">

      {tipo === "1" && (
        <div className="flex sm:justify-evenly xsm:justify-between my-1 z-0">
          {pasosTipo1.map((index) => (
            <div key={index}>
              {paso >= index && paso != 0 ? (
                <div className="step-checked" aria-label={`Paso ${index} completado`}>✓</div>
              ) : (
                <div
                  style={{ color: paso + 1 === index ? "#fff" : "#000" }}
                  aria-current={paso + 1 === index ? "step" : undefined}
                >
                  {index}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tipo === "3" && (
        <>
          {/* Indicador textual */}
          <p className="text-center text-xs text-slate-500 mb-1 font-medium z-0" aria-live="polite" >
            Paso <span className="font-bold text-blue-600">{currentLabelIndex + 1}</span> de{" "}
            <span className="font-bold">{totalTipo3}</span>
            {" — "}
            <span className="text-slate-700">{labels3[currentLabelIndex]}</span>
          </p>

          <div className="relative flex items-center justify-between w-full mb-1">
            {/* 1. Riel Gris (Fondo) */}
            <div className="absolute top-3.5 left-[14px] right-[14px] h-0.5 bg-slate-200 z-0 overflow-hidden">

              {/* 2. Línea AZUL (Hasta el paso actual) */}
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 ease-in-out"
                style={{
                  width: totalTipo3 <= 1
                    ? '0%'
                    : `${(currentLabelIndex / (totalTipo3 - 1)) * 100}%`
                }}
              />

              {/* 3. Línea VERDE (Completa si es el último, sino hasta el anterior) */}
              <div
                className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-500 ease-in-out z-10"
                style={{
                  width: totalTipo3 <= 1 || currentLabelIndex === 0
                    ? '0%'
                    : currentLabelIndex === totalTipo3 - 1 // ¿Es el último paso?
                      ? '100%'
                      : `${((currentLabelIndex - 1) / (totalTipo3 - 1)) * 100}%`
                }}
              />
            </div>

            {pasosTipo2.map((index, i) => {
              const isLastStep = currentLabelIndex === totalTipo3 - 1;

              // El paso está completado si ya pasó, o si es el último y estamos en él
              const isCompleted = i < currentLabelIndex || (isLastStep && i === currentLabelIndex);

              // Es el paso actual solo si NO es el último (porque el último ya se ve como completado)
              const isCurrent = i === currentLabelIndex && !isLastStep;

              return (
                <div key={index} className="relative flex flex-col items-center gap-1 z-20">
                  <div
                    className={`
                w-7 h-7 rounded-full flex items-center justify-center
                text-xs font-bold text-white transition-all duration-300
                ${isCompleted
                        ? 'bg-green-500 shadow-sm shadow-green-300'
                        : isCurrent
                          ? 'bg-blue-600 shadow-sm shadow-blue-300 ring-2 ring-blue-200'
                          : 'bg-slate-300'
                      }
              `}
                  >
                    {isCompleted ? "✓" : `${i + 1}`}
                  </div>

                  <span className={`text-[10px] leading-tight text-center max-w-[50px] ${isCompleted ? 'text-green-600 font-semibold' : isCurrent ? 'text-blue-600 font-semibold' : 'text-slate-400'
                    }`}>
                    {labels3[i] ?? ''}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </nav>
  );
};
