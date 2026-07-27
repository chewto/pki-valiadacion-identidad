import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { URLS } from './urls';
import { getCountry } from '@nucleo/hooks/useCountry';

// Creamos la instancia personalizada
const api = axios.create({
    baseURL: `${import.meta.env.VITE_BASE_URL}/validacion-back`,
});

// Add interceptor to default axios for all imports
axios.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('ekyc_token');
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
    (config) => {
        const token = sessionStorage.getItem('ekyc_token');
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