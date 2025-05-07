import { useMobile } from "@nucleo/hooks/useMobile";
import { useRef, useEffect, useState } from "react";

const CameraTest: React.FC = () => {
  return (
    <main>
      <iframe className="w-screen h-screen" src="http://127.0.0.1:5007/camera" allow="camera;microphone"></iframe>
    </main>
  )
};

export default CameraTest;
