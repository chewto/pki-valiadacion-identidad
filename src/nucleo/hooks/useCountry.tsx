import { useEffect } from 'react';

const SESSION_KEY = 'db_country';
const DEFAULT_COUNTRY = 'COL';

const countryMap: Record<string, string> = {
  COLOMBIA: 'COL',
  HONDUCERT: 'HND',
};

export const getCountry = (): string => {
  try {
    return sessionStorage.getItem(SESSION_KEY) || DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
};

const useCountry = () => {
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const response = await fetch(`/`, { method: 'HEAD' });
        const xFuente = response.headers.get('X-Fuente');
        if (xFuente) {
          const country = countryMap[xFuente] || DEFAULT_COUNTRY;
          sessionStorage.setItem(SESSION_KEY, country);
        }
      } catch (error) {
        console.error('Error al obtener país:', error);
        sessionStorage.setItem(SESSION_KEY, DEFAULT_COUNTRY);
      }
    };

    fetchCountry();
  }, []);
};

export default useCountry;
