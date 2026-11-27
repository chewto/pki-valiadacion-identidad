import { useEffect, useState } from 'react';

const SESSION_KEY = 'db_country';
const DEFAULT_COUNTRY = 'COL';

const countryMap: Record<string, string> = {
  COLOMBIA: 'COL',
  HONDUCERT: 'HND',
  prueba01: 'COL',
  prueba02: 'HND',
};

let countryPromise: Promise<string> | null = null;
let currentCountry: string | null = null;
const listeners = new Set<(country: string) => void>();

export const getCountry = (): string => {
  if (currentCountry) return currentCountry;
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) {
      currentCountry = session;
      return session;
    }
  } catch {
    // sessionStorage inaccesible
  }
  return DEFAULT_COUNTRY;
};

export const ensureCountry = async (): Promise<string> => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) {
      currentCountry = session;
      return session;
    }
  } catch {
    // sessionStorage inaccesible
  }

  if (countryPromise) {
    return countryPromise;
  }

  countryPromise = (async () => {
    try {
      const response = await fetch(`/`, { method: 'HEAD' });
      const xFuente = response.headers.get('X-Fuente');
      if (xFuente) {
        const country = countryMap[xFuente] || countryMap[xFuente.trim()] || DEFAULT_COUNTRY;
        try {
          sessionStorage.setItem(SESSION_KEY, country);
        } catch {
          // sessionStorage opcional
        }
        currentCountry = country;
        listeners.forEach((listener) => listener(country));
        return country;
      }
    } catch (error) {
      console.error('Error al resolver país en ensureCountry:', error);
    }
    const fallback = DEFAULT_COUNTRY;
    try {
      sessionStorage.setItem(SESSION_KEY, fallback);
    } catch {
      // sessionStorage opcional
    }
    currentCountry = fallback;
    listeners.forEach((listener) => listener(fallback));
    return fallback;
  })();

  return countryPromise;
};

export const subscribeCountry = (listener: (country: string) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const useCountry = () => {
  const [country, setCountryState] = useState<string>(getCountry);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeCountry((newCountry) => {
      if (isMounted) setCountryState(newCountry);
    });

    ensureCountry().then((resolved) => {
      if (isMounted) setCountryState(resolved);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return country;
};

export default useCountry;
