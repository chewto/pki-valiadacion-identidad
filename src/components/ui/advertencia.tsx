import '@styles/modal-style.component.css'
import { useEffect, useRef, useId } from 'react'

interface Props {
  titulo: string;
  contenido?: string;
  elemento?: JSX.Element;
  onClose?: () => void;
  tipo?: 'warning' | 'info' | 'error' | 'success';
}

export const Advertencia: React.FC<Props> = ({ 
  titulo, 
  contenido, 
  elemento,
  onClose,
  tipo = 'warning'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Focus trap: mantiene el foco dentro del modal mientras está abierto
  useEffect(() => {
    const dialogEl = dialogRef.current
    if (!dialogEl) return

    dialogEl.focus()

    const focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter(el => el.offsetParent !== null)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const iconColors = {
    warning: 'bg-amber-100 text-amber-600 border-amber-200',
    info: 'bg-blue-100 text-blue-600 border-blue-200',
    error: 'bg-red-100 text-red-600 border-red-200',
    success: 'bg-emerald-100 text-emerald-600 border-emerald-200'
  }

  return (
    /* Backdrop con efecto blur */
    <div 
      className="fixed inset-0 flex justify-center items-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm z-50 animate-fadeIn"
      onClick={onClose ? () => onClose() : undefined}
    >
      {/* Dialog moderno con límite de altura para evitar desbordes en móvil y PC */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="
          bg-white rounded-2xl shadow-2xl border border-slate-100
          flex flex-col w-full max-w-lg
          max-h-[92vh] max-h-[92dvh]
          outline-none overflow-hidden
          animate-scaleIn
        "
      >
        {/* Cabecera estilizada */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-base font-bold flex-shrink-0 ${iconColors[tipo]}`}>
              {tipo === 'warning' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {tipo === 'info' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {tipo === 'error' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {tipo === 'success' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h2
              id={titleId}
              className="font-bold text-base sm:text-lg text-slate-800 m-0 leading-tight"
            >
              {titulo}
            </h2>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Cerrar ventana"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Cuerpo del modal con scroll interno suave si se necesita */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-3">
          {contenido && (
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center sm:text-left m-0">
              {contenido}
            </p>
          )}

          {/* Elemento dinámico */}
          {elemento && (
            <div className="w-full flex flex-col items-center">
              {elemento}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
