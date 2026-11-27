import { ensureToken } from '@nucleo/api-urls/api';
import { useState, useEffect, useCallback } from 'react';

export interface UseJWTReturn {
    token: string | null;
    loading: boolean;
    error: string | null;
    clearToken: () => void;
    refreshToken: () => Promise<string | null>;
}

const useJWT = (): UseJWTReturn => {
    const [token, setToken] = useState<string | null>(() => {
        try {
            return sessionStorage.getItem('ekyc_token');
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState<boolean>(!token);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            const newToken = await ensureToken(forceRefresh);
            setToken(newToken);
            setError(null);
            return newToken;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al obtener token';
            setError(msg);
            return null;
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
        try {
            sessionStorage.removeItem('ekyc_token');
        } catch {
            // sessionStorage opcional
        }
        setToken(null);
    };

    const refreshToken = async () => {
        return fetchToken(true);
    };

    return { token, loading, error, clearToken, refreshToken };
};

export default useJWT;
