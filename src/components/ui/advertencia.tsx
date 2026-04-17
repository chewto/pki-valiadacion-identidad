import '@styles/modal-style.component.css'
import { useEffect, useRef, useId } from 'react'

interface Props{
  titulo: string;
  contenido: string;
  elemento: JSX.Element;
}

export const Advertencia: React.FC<Props> = ({ titulo, contenido, elemento }) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Focus trap: mantiene el foco dentro del modal mientras está abierto
  useEffect(() => {
    const dialogEl = dialogRef.current
    if (!dialogEl) return

    // Enfocar el contenedor del modal al abrirse
    dialogEl.focus()

    const focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter(el => el.offsetParent !== null) // solo elementos visibles

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: si el foco está en el primero, salta al último
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: si el foco está en el último, salta al primero
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    /* Backdrop */
    <div className="fixed inset-0 flex justify-center items-start pt-4 bg-black/50 z-40 animate-fadeIn">
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="
          bg-white rounded-xl shadow-2xl
          flex flex-col items-center
          xsm:mx-2 xsm:w-11/12 sm:w-10/12 md:max-w-lg
          max-h-[85vh] overflow-y-auto
          px-4 py-4
          outline-none
          animate-[scaleIn_200ms_ease-out]
        "
      >
        {/* Título — h2 para no romper jerarquía de la página */}
        <h2
          id={titleId}
          className="font-bold text-xl text-slate-800 mb-1 text-center"
        >
          {titulo}
        </h2>

        {/* Separador */}
        {contenido && (
          <>
            <hr className="w-full border-slate-200 my-2" />
            <p className="font-semibold text-slate-700 text-center text-sm">{contenido}</p>
          </>
        )}

        {/* Separador antes del elemento slot */}
        <hr className="w-full border-slate-200 my-2" />

        {/* Elemento dinámico (botones, listas, imágenes, etc.) */}
        <div className="w-full flex flex-col items-center">
          {elemento}
        </div>
      </div>
    </div>
  )
}