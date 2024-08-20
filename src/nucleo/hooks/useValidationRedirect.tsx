import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  URLS,
  validationRedirects,
} from "../api-urls/validacion-identidad-urls";

export const useValidationRedirect = (
  validationName: string,
  idUser: string | null,
  id: string | null,
  type: string | null
) => {
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${URLS.validationProvider}?entityId=${idUser}`).then((res) => {
      const provider = res.data.provider;
      console.log(provider);
      if (provider !== validationName) {
        const pageNav =
          validationRedirects[provider as keyof typeof validationRedirects];
        navigate(`${pageNav}?id=${id}&idUsuario=${idUser}&tipo=${type}`);
      }
    });
  }, []);
};
