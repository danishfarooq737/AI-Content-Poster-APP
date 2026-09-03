import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/apiClient';
import { authService } from '../services/authService';

// On app load, attempt to silently restore a session using the httpOnly
// refresh cookie (if present) so a page refresh doesn't force a re-login.
export const useAuthBootstrap = () => {
  const { setAuth, clearAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const token = refreshRes.data.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
        const meRes = await authService.me();
        if (!cancelled) setAuth(meRes.data.user, token);
      } catch (_) {
        if (!cancelled) clearAuth();
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isInitialized };
};
