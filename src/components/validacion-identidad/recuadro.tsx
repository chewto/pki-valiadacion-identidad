
interface CameraOverlayProps {
  width?: string | number;
  height?: string | number;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ width = "100%", height = "100%" }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none', // Permite que los clics pasen al video si es necesario
      zIndex: 10
    }}>
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
          cx="50" cy="50" rx="30" ry="40" 
          fill="none" 
          stroke="white" 
          strokeWidth="0.5" 
          strokeDasharray="2"
        />
      </svg>
    </div>
  );
};

export const CameraView = () => {
  return (
    <div style={{ position: 'relative', width: '640px', height: '480px', overflow: 'hidden' }}>
      {/* Tu componente de Video / Webcam */}
      <video 
        autoPlay 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />

      {/* La capa superior con el óvalo */}
      <CameraOverlay />
      
      {/* Texto de instrucción opcional */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        width: '100%',
        textAlign: 'center',
        color: 'white',
        zIndex: 11
      }}>
        Coloque su rostro dentro del óvalo
      </div>
    </div>
  );
};