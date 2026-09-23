import { useEffect, useRef, useState } from "react";
import {
  getProgress,
  ValidationProgressData,
} from "@nucleo/services/validation-progress.service";

interface UseValidationProgressProps {
  idUsuario: string | number | null | undefined;
  country: string;
  enabled: boolean;
}

export const useValidationProgress = ({
  idUsuario,
  country,
  enabled,
}: UseValidationProgressProps) => {
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(!!enabled);
  const [progressData, setProgressData] = useState<ValidationProgressData | null>(null);
  const [initialStep, setInitialStep] = useState<number>(0);
  const [error, setError] = useState<unknown>(null);
  const didInitRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || didInitRef.current) return;
    didInitRef.current = true;

    const fetchProgress = async () => {
      try {
        const data = await getProgress(idUsuario, country);
        const paso = typeof data.paso === "number" ? data.paso : 0;
        setProgressData(data);
        setInitialStep(paso > 0 ? paso : 0);
      } catch (err) {
        console.error("Error consultando progreso de validación:", err);
        setError(err);
        setInitialStep(0);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [enabled, idUsuario, country]);

  return { isLoadingProgress, initialStep, progressData, error };
};