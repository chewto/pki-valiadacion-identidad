import { useEffect, useRef } from "react";
import { setFaceIndicator } from "@nucleo/redux/slices/pruebaVidaSlice";
import { useDispatch } from "react-redux";
interface CameraOverlayProps {
  width?: string | number;
  height?: string | number;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  width = "100%",
  height = "100%",
}) => {
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (containerRef.current) {
      const { width, height, left, top } =
        containerRef.current.getBoundingClientRect();

      dispatch(
        setFaceIndicator({
          x: left + width * 0.5, // Centro X en px
          y: top + height * 0.5, // Centro Y en px
          rx: width * 0.3, // Radio X en px (30% de 100)
          ry: height * 0.4, // Radio Y en px (40% de 100)
        }),
      );
    }
  }, [width, height,dispatch]); // Se recalcula si cambian las dimensiones

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // Permite que los clics pasen al video si es necesario
        zIndex: 10,
      }}
      ref={containerRef}
    >
      {containerRef.current ? (() => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = rect.width * 0.5;
        const y = rect.height * 0.5;
        const rx = rect.width * 0.3;
        const ry = rect.height * 0.4;

        // convert to SVG viewBox (0..100) coordinates
        const cx = (x / rect.width) * 100;
        const cy = (y / rect.height) * 100;
        const rxPct = (rx / rect.width) * 100;
        const ryPct = (ry / rect.height) * 100;

        // line endpoints in percent coordinates
        const hx1 = cx - rxPct;
        const hx2 = cx + rxPct;
        const vy1 = cy - ryPct;
        const vy2 = cy + ryPct;

        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          >
            {/* Horizontal axis across the ellipse (center line) */}
            <line
              x1={hx1}
              y1={cy}
              x2={hx2}
              y2={cy}
              stroke="lime"
              strokeWidth={0.5}
              strokeDasharray="2"
            />
            {/* Vertical axis across the ellipse (center line) */}
            <line
              x1={cx}
              y1={vy1}
              x2={cx}
              y2={vy2}
              stroke="lime"
              strokeWidth={0.5}
              strokeDasharray="2"
            />
            {/* Optional small center marker */}
            <circle cx={cx} cy={cy} r={0.6} fill="lime" />
          </svg>
        );
      })() : null}
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="rgba(0, 0, 0, 0.6)" // Color del sombreado (negro con 60% opacidad)
          fillRule="evenodd"
          /* M0,0 H100 V100 H0 Z  <- Dibuja el rectángulo exterior
             M50,50 m-30,0 a30,40 0 1,0 60,0 a30,40 0 1,0 -60,0 <- Dibuja el óvalo central
          */
          d="M0,0 H100 V100 H0 Z M50,50 m-30,0 a30,40 0 1,0 60,0 a30,40 0 1,0 -60,0"
        />

        {/* Opcional: Borde blanco para resaltar el óvalo */}
        <ellipse
          cx="50"
          cy="50"
          rx="30"
          ry="40"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          strokeDasharray="2"
        />
      </svg>
    </div>
  );
};