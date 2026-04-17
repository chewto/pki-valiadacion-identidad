interface Props {
  show: boolean;
}

export default function SuccessStep({ show }: Props) {
  return (
    /*
     * aria-live="assertive" + role="alert":
     * el lector de pantalla anuncia "Paso completado" de inmediato
     * cuando el componente pasa de oculto a visible.
     */
    <div
      aria-live="assertive"
      role="alert"
      aria-atomic="true"
      className={`
        bg-white border border-slate-200 shadow-lg
        ${show ? 'flex animate-scaleIn' : 'hidden'}
        flex-col justify-center items-center gap-2
        rounded-xl py-4 px-5
        absolute left-1/2 -translate-x-1/2
        md:w-auto md:min-w-[180px] xsm:w-52
        z-50
      `}
    >
      {/* Ícono de check con fondo verde redondeado */}
      <div className="bg-green-100 rounded-full p-2">
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          height="36px"
          viewBox="0 -960 960 960"
          width="36px"
          fill="#16a34a"
        >
          <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
        </svg>
      </div>

      <span className="text-slate-800 font-semibold text-sm text-center">
        ¡Paso completado!
      </span>
    </div>
  );
}
