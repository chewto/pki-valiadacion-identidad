import { useState, useEffect } from "react";

export const useGetFetch = (url: string) => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState()

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((error) => setError(error))
      .finally(() => setLoading(false))
  }, [url]);

  return { data, loading, error };
};
