import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  URLS,
  validationRedirects,
} from "../api-urls/urls";
import api from "@nucleo/api-urls/api";

export const useValidationRedirect = (
  validationName: string,
  idUser: string | null | undefined,
  searchParams: string | null
) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Si no hay idUser definido, no hacer petición errónea
    if (!idUser) return;

    let isMounted = true;

    api
      .get(`${URLS.validationProvider}?entityId=${idUser}`)
      .then((res) => {
        if (!isMounted || !res.data) return;
        const provider = res.data.provider;
        if (provider && provider !== validationName) {
          const pageNav =
            validationRedirects[provider as keyof typeof validationRedirects];
          if (pageNav) {
            navigate(`${pageNav}?${searchParams ?? ""}`);
          }
        }
      })
      .catch((err) => {
        // Log silencioso defensivo para no romper la navegación actual
        console.warn("No se pudo verificar validationProvider, permaneciendo en el flujo:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [idUser, navigate, searchParams, validationName]);
};
