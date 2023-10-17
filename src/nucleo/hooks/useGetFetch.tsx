import { useState, useEffect } from "react";
import { InformacionIdentidad } from "../interfaces/validacion-identidad/informacion-identidad.interface";

export const useGetFetch = (url: string | undefined) => {
  const [data, setData] = useState<InformacionIdentidad>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState();

  useEffect(() => {
    if (url) {
      fetch(url)
        .then((res) => res.json())
        .then((res) => setData(res))
        .catch((error) => setError(error))
        .finally(() => setLoading(false));
    }
  }, [url]);

  return { data, loading, error };
};
