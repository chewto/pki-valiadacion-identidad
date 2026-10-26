import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { URLS } from './urls';
import { getCountry } from '@nucleo/hooks/useCountry';

// Token manager singleton
let tokenPromise: Promise<string> | null = null;

/**
 * Obtiene el token JWT, reutilizando una promesa compartida para evitar
 * solicitudes duplicadas concurrentes. Si `forceRefresh` es true, se ignora
 * el token almacenado y se solicita uno nuevo.
 */
async function obtainToken(forceRefresh = false): Promise<string> {
  const existing = sessionStorage.getItem('ekyc_token');
  if (!forceRefresh && existing) {
    return existing;
  }
  // Si ya hay una promesa en curso, reutilízala
  if (tokenPromise) {
    return tokenPromise;
  }
  tokenPromise = (async () => {
    try {
      const res = await axios.get(`${URLS.generateToken}?country=${getCountry()}`, {
        headers: {
          'x-api-key': import.meta.env.VITE_FRONTEND_API_KEY,
        },
      });
      const newToken = res.data.token;
      sessionStorage.setItem('ekyc_token', newToken);
      return newToken;
    } finally {
      // Reset para próximas renovaciones
      tokenPromise = null;
    }
  })();
  return tokenPromise;
}

/**
 * Exportado para que los hooks como useJWT puedan reutilizar la lógica.
 */
export async function ensureToken(forceRefresh = false): Promise<string> {
  return obtainToken(forceRefresh);
}



// Creamos la instancia personalizada
const api = axios.create({
    baseURL: `${import.meta.env.VITE_BASE_URL}/python`,
});

// Add interceptor to default axios for all imports
axios.interceptors.request.use(
    async (config) => {
        // Skip token acquisition for token generation endpoint
        if (config.url && config.url.includes(URLS.generateToken)) {
            return config;
        }
        const token = await obtainToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Bandera para no entrar en bucle si la renovación falla
let isRefreshing = false;

// --- INTERCEPTOR DE PETICIÓN (Request) ---
api.interceptors.request.use(
    async (config) => {
        // Skip token acquisition for token generation endpoint
        if (config.url && config.url.includes(URLS.generateToken)) {
            // ensure country param
            if (config.url && !/[?&]country=/.test(config.url)) {
                config.url += config.url.includes('?') ? `&country=${getCountry()}` : `?country=${getCountry()}`;
            }
            return config;
        }
        const token = await obtainToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.url && !/[?&]country=/.test(config.url)) {
            config.url += config.url.includes('?') ? `&country=${getCountry()}` : `?country=${getCountry()}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- INTERCEPTOR DE RESPUESTA (Response + Silent Refresh) ---
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Si el servidor responde 401 y no hemos intentado reintentar esta petición aún
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) return Promise.reject(error);

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.warn("JWT Expirado. Intentando renovación con API Key...");

                // Pedimos un nuevo token usando la API Key del .env (Vite usa import.meta.env)
                const res = await axios.get(`${URLS.generateToken}?country=${getCountry()}`, {
                    headers: {
                        'x-api-key': import.meta.env.VITE_FRONTEND_API_KEY
                    }
                });

                const newToken = res.data.token;
                sessionStorage.setItem('ekyc_token', newToken);

                // Actualizamos la petición original con el nuevo token y reintentamos
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }

                isRefreshing = false;
                return api(originalRequest);

            } catch (refreshError) {
                isRefreshing = false;
                console.error("No se pudo renovar el token. Sesión cerrada.");
                sessionStorage.removeItem('ekyc_token');
                // Opcional: Redirigir al inicio o mostrar modal de error
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;