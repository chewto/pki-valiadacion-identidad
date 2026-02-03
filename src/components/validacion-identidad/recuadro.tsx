import { useEffect, useRef } from "react";
import { setFaceIndicator } from "@nucleo/redux/slices/pruebaVidaSlice";
import { useDispatch } from "react-redux";

interface CameraOverlayProps {
  width?: string | number;
  height?: string | number;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = () => {
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height, left, top } = containerRef.current.getBoundingClientRect();
        
        // Calculamos un radio que sea el mismo para X e Y basado en el lado más corto
        // para asegurar que siempre sea un círculo perfecto.
        const circleRadius = Math.min(width, height) * 0.35; 

        dispatch(
          setFaceIndicator({
            x: left + width * 0.5,
            y: top + height * 0.5,
            rx: circleRadius,
            ry: circleRadius,
          })
        );
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [dispatch]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="overlay-mask">
            {/* Fondo blanco (lo que se ve) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Círculo negro (lo que se recorta/agujero) */}
            <circle cx="50%" cy="50%" r="35%" fill="black" />
          </mask>
        </defs>

        {/* Capa oscura con el agujero */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#overlay-mask)"
        />

        {/* Borde del círculo */}
        <circle
          cx="50%"
          cy="50%"
          r="35%"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="5"
        />
      </svg>
    </div>
  );
};