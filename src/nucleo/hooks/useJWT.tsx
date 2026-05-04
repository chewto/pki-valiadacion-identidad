import { URLS } from '@nucleo/api-urls/urls';
import { useState, useEffect, useCallback } from 'react';

export interface TokenResponse {
    token: string;
    expires_at: string;
}

export interface UseJWTReturn {
    token: string | null;
    loading: boolean;
    error: string | null;
    clearToken: () => void;
}

const useJWT = (): UseJWTReturn => {
    const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('ekyc_token'));
    const [loading, setLoading] = useState<boolean>(!token);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async () => {
        try {
            setLoading(true);
            const fetchUrl = `${URLS.generateToken}${URLS.generateToken.includes('?') ? '&' : '?'}t=${Date.now()}`;
            const response = await fetch(fetchUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': import.meta.env.VITE_FRONTEND_API_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo obtener el token`);
            }

            const data: TokenResponse = await response.json();

            sessionStorage.setItem('ekyc_token', data.token);
            setToken(data.token);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!token) {
            fetchToken();
        }
    }, [token, fetchToken]);

    const clearToken = () => {
        sessionStorage.removeItem('ekyc_token');
        setToken(null);
    };

    return { token, loading, error, clearToken };
};

export default useJWT;