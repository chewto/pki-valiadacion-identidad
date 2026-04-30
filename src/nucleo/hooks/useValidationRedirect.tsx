import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  URLS,
  validationRedirects,
} from "../api-urls/urls";
import api from "@nucleo/api-urls/api";

export const useValidationRedirect = (
  validationName: string,
  idUser: string | null,
  searchParams: string | null
) => {
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`${URLS.validationProvider}?entityId=${idUser}`).then((res) => {
      const provider = res.data.provider;
      if (provider !== validationName) {
        const pageNav =
          validationRedirects[provider as keyof typeof validationRedirects];
        navigate(`${pageNav}?${searchParams}`);
      }
    });
  }, []);
};
