import { useEffect, useSyncExternalStore } from 'react';

const SESSION_KEY = 'db_country';
const DEFAULT_COUNTRY = 'COL';

const countryMap: Record<string, string> = {
  COLOMBIA: 'COL',
  HONDUCERT: 'HND',
};

// País confirmado por el servicio (cabecera X-Fuente). Se mantiene en memoria
// para que la precarga del modelo pueda esperar a que el país esté resuelto.
let resolvedCountry: string | null = null;

interface CountrySnapshot {
  country: string;
  resolved: boolean;
}

let countrySnapshot: CountrySnapshot = {
  country: DEFAULT_COUNTRY,
  resolved: false,
};

const listeners = new Set<() => void>();

const readSessionCountry = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

const writeSessionCountry = (country: string): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, country);
  } catch {
    // La sesión es opcional.
  }
};

const publishCountry = (country: string | null): void => {
  if (country) resolvedCountry = country;
  const next: CountrySnapshot = {
    country: getCountry(),
    resolved: resolvedCountry !== null,
  };
  if (
    next.country === countrySnapshot.country &&
    next.resolved === countrySnapshot.resolved
  ) {
    return;
  }
  countrySnapshot = next;
  listeners.forEach((listener) => listener());
};

export const getCountry = (): string => {
  return resolvedCountry ?? readSessionCountry() ?? DEFAULT_COUNTRY;
};

export const getCountrySnapshot = (): CountrySnapshot => countrySnapshot;

export const subscribeCountry = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useCountryValue = (): CountrySnapshot =>
  useSyncExternalStore(subscribeCountry, getCountrySnapshot, getCountrySnapshot);

const useCountry = () => {
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const response = await fetch(`/`, { method: 'HEAD' });
        const xFuente = response.headers.get('X-Fuente');
        if (xFuente) {
          const country = countryMap[xFuente] || DEFAULT_COUNTRY;
          writeSessionCountry(country);
          publishCountry(country);
          return;
        }
        // Sin cabecera no se puede confirmar el país: se mantiene el valor por
        // defecto y se marca como resuelto para no bloquear la precarga.
        writeSessionCountry(DEFAULT_COUNTRY);
        publishCountry(DEFAULT_COUNTRY);
      } catch (error) {
        console.error('Error al obtener país:', error);
        writeSessionCountry(DEFAULT_COUNTRY);
        publishCountry(DEFAULT_COUNTRY);
      }
    };

    fetchCountry();
  }, []);

  return useCountryValue();
};

export default useCountry;
