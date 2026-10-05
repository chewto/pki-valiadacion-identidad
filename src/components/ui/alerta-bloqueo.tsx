import { Advertencia } from "@components/ui/advertencia";
import { BlockingAlertType } from "@nucleo/interfaces/firma/location.interface";

interface Props {
  tipo: BlockingAlertType;
  /** Mensaje alternativo (por defecto, uno accionable por tipo). */
  mensaje?: string;
  onReintentar?: () => void;
  onCerrar?: () => void;
}

interface AlertContent {
  titulo: string;
  mensaje: string;
  instrucciones?: string[];
  botonReintentar: string;
}

const ALERT_CONTENT: Record<BlockingAlertType, AlertContent> = {
  vpn: {
    titulo: "VPN o proxy detectado",
    mensaje:
      "Detectamos que estás conectado mediante una VPN o proxy. Desactíalo para continuar con la firma.",
    botonReintentar: "Ya lo desactivé, reintentar",
  },
  proxy: {
    titulo: "Proxy detectado",
    mensaje:
      "Detectamos que estás usando un proxy. Desactíalo para continuar con la firma.",
    botonReintentar: "Ya lo desactivé, reintentar",
  },
  permission: {
    titulo: "Permiso de ubicación requerido",
    mensaje:
      "Para firmar necesitamos confirmar tu ubicación. Permite el acceso en tu navegador:",
    instrucciones: [
      "Toca el candado o el ícono de información en la barra de direcciones.",
      'Busca "Ubicación" y selecciona "Permitir".',
      "Vuelve a esta ventana y pulsa Reintentar.",
    ],
    botonReintentar: "Reintentar",
  },
  timeout: {
    titulo: "No se pudo obtener tu ubicación",
    mensaje:
      "Se agotó el tiempo de espera del GPS. Activa la ubicación en tu dispositivo e inténtalo de nuevo.",
    botonReintentar: "Reintentar",
  },
  unavailable: {
    titulo: "Ubicación no disponible",
    mensaje:
      "No pudimos determinar tu posición. Verifica que tu GPS esté activo e inténtalo de nuevo.",
    botonReintentar: "Reintentar",
  },
  mismatch: {
    titulo: "Ubicación no válida",
    mensaje:
      "Tu ubicación no coincide con la región permitida para esta firma. Desactiva tu VPN o desplázate a una ubicación válida.",
    botonReintentar: "Reintentar",
  },
  location_required: {
    titulo: "Se requiere tu ubicación",
    mensaje:
      "La validación no puede continuar sin tu ubicación. Permite el acceso cuando el navegador lo solicite.",
    botonReintentar: "Reintentar",
  },
  unknown: {
    titulo: "No se pudo completar la firma",
    mensaje: "Ocurrió un error inesperado. Vuelve a intentarlo.",
    botonReintentar: "Reintentar",
  },
};

const buttonBase =
  "w-full font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2";

/**
 * Modal de bloqueo para la firma: VPN detectada por la API,
 * permiso de ubicación denegado o fallos de GPS.
 * Compone Advertencia para reutilizar focus-trap y ARIA.
 */
export const AlertaBloqueo: React.FC<Props> = ({
  tipo,
  mensaje,
  onReintentar,
  onCerrar,
}) => {
  const content = ALERT_CONTENT[tipo];
  const texto = mensaje?.trim() ? mensaje : content.mensaje;

  return (
    <Advertencia
      zClass="z-[60]"
      titulo={content.titulo}
      contenido={texto}
      elemento={
        <div className="w-full flex flex-col gap-3">
          {content.instrucciones && (
            <ol className="text-sm text-slate-700 text-left list-decimal list-inside space-y-1 px-1">
              {content.instrucciones.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
          )}

          {onReintentar && (
            <button
              type="button"
              onClick={onReintentar}
              className={`${buttonBase} bg-blue-600 hover:bg-blue-700 text-white`}
            >
              {content.botonReintentar}
            </button>
          )}

          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className={`${buttonBase} bg-slate-200 hover:bg-slate-300 text-slate-800`}
            >
              Cerrar
            </button>
          )}
        </div>
      }
    />
  );
};
