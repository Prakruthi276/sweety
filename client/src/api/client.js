import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// The access token lives only in memory, never in localStorage
let accessToken = null;
let onAuthFailure = () => {};

export const setAccessToken = (token) => { accessToken = token; };
export const setAuthFailureHandler = (fn) => { onAuthFailure = fn; };

const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// One refresh at a time. Refresh tokens rotate, so two requests sharing one cookie
// would look like token reuse and the server would revoke every session
let refreshPromise = null;
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios // plain axios: no interceptors, so no loops
      .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
      .then((res) => {
        accessToken = res.data.accessToken;
        return accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = config?.url?.startsWith('/auth/');

    if (response?.status === 401 && config && !config._retry && !isAuthCall) {
      config._retry = true; // retry each request only once
      try {
        await refreshAccessToken();
        return api(config); // the request interceptor adds the new token
      } catch {
        accessToken = null;
        onAuthFailure(); // clears the user, the protected route goes to /login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
