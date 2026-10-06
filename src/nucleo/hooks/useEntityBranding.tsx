import { useEffect, useState } from "react";
import { getEntityBranding } from "@nucleo/services/entity-branding.service";

export const useEntityBranding = (
  efirmaId: string | number | null | undefined
) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!efirmaId) return;

    let cancelled = false;
    setIsLoading(true);

    getEntityBranding(efirmaId)
      .then((res) => {
        if (!cancelled) setLogoUrl(res.logo);
      })
      .catch((err) => {
        console.error("Error obteniendo branding de la entidad:", err);
        if (!cancelled) setLogoUrl(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [efirmaId]);

  return { logoUrl, isLoading };
};
