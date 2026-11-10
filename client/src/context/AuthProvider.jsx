import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { refreshAccessToken, setAccessToken, setAuthFailureHandler } from '../api/client';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the startup refresh finishes

  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    let ignore = false;

    (async () => {
      try {
        await refreshAccessToken(); // uses the httpOnly cookie; shared if StrictMode runs this twice
        const { data } = await api.get('/auth/me');
        if (!ignore) setUser(data.user);
      } catch {
        if (!ignore) setUser(null); // no valid cookie: logged out
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name, email, password) => {
      await api.post('/auth/register', { name, email, password });
      await login(email, password); // the API does not log in on register, so do it here
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // even if the server cannot be reached, log out locally
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
