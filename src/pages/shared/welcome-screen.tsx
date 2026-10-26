import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@nucleo/redux/store";

interface Props {
  nextStep: () => void;
}

const STEPS_PREVIEW = [
  {
    icon: "📷",
    title: "Acceso a la cámara",
    description: "Permitirás el uso de tu cámara",
  },
  {
    icon: "🤳",
    title: "Foto personal",
    description: "Tomarás una selfie para verificar tu identidad",
  },
  {
    icon: "🪪",
    title: "Documento de identidad",
    description: "Capturarás ambos lados de tu documento",
  },
];

const STEPS_PREVIEW_NO_SELFIE = [
  {
    icon: "📷",
    title: "Acceso a la cámara",
    description: "Permitirás el uso de tu cámara",
  },
  {
    icon: "🪪",
    title: "Documento de identidad",
    description: "Capturarás ambos lados de tu documento",
  },
];

export const WelcomeScreen: React.FC<Props> = ({ nextStep }) => {
  const userData = useSelector((state: RootState) => state.firmador);
  const [visible, setVisible] = useState(false);
  const [stepsVisible, setStepsVisible] = useState<boolean[]>([]);

  const steps = userData.validacionVida
    ? STEPS_PREVIEW_NO_SELFIE
    : STEPS_PREVIEW;

  useEffect(() => {
    // Trigger entrada animada
    const t1 = setTimeout(() => setVisible(true), 100);

    // Animar pasos uno por uno
    const timers: ReturnType<typeof setTimeout>[] = [t1];
    steps.forEach((_, i) => {
      const t = setTimeout(() => {
        setStepsVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 400 + i * 200);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = userData.nombre
    ? `${userData.nombre.split(" ")[0]}`
    : "";

  return (
    <div
      className={`flex flex-col items-center transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* Saludo animado */}
      <div className="text-center my-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
          {displayName ? (
            <>
              ¡Hola,{" "}
              <span className="text-blue-600">{displayName}</span>!
            </>
          ) : (
            <>¡Bienvenido!</>
          )}
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Vamos a verificar tu identidad
        </p>
      </div>

      {/* Badge del tipo de documento */}
      {userData.tipoDocumento && (
        <div
          className="flex items-center gap-2 bg-blue-50 border border-blue-200
                      rounded-full px-4 py-1.5 mb-4 animate-fadeIn"
        >
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25
                 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25
                 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875
                 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294
                 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0
                 01-3.168-.789 3.376 3.376 0 016.338 0z"
            />
          </svg>
          <span className="text-blue-700 font-medium text-sm">
            {userData.tipoDocumento}
          </span>
        </div>
      )}

      {/* Pasos del proceso */}
      <div className="w-full max-w-sm space-y-2.5 mb-6">
        <p
          className="text-xs font-semibold text-slate-500 uppercase tracking-wide
                      text-center mb-3"
        >
          Pasos del proceso
        </p>
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 bg-white border border-slate-200
                        rounded-xl px-4 py-2 shadow-sm
                        transition-all duration-[400ms] ease-out
                        ${
                          stepsVisible[i]
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-4"
                        }`}
          >
            <span className="text-2xl flex-shrink-0" aria-hidden="true">
              {step.icon}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm leading-tight">
                {step.title}
              </p>
              <p className="text-slate-500 text-xs leading-tight">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Botón iniciar */}
      <button
        type="button"
        onClick={nextStep}
        className="group relative w-full max-w-sm px-6 py-3
                   bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                   text-white font-bold rounded-xl shadow-lg shadow-blue-200
                   transition-all duration-200
                   hover:shadow-xl hover:shadow-blue-300
                   focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span className="flex items-center justify-center gap-2">
          Iniciar verificación
          <svg
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </span>
      </button>

      <p className="text-xs text-slate-400 mt-3 text-center">
        El proceso tomará aproximadamente 2 minutos
      </p>
    </div>
  );
};
