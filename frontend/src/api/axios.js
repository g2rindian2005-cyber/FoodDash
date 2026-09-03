import axios from 'axios';

// Base URL comes from Vite env (see frontend/.env.example). Defaults to "/api".
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // IMPORTANT: without a timeout, a request to a dead/unreachable backend
  // (e.g. the API server isn't running, or Nginx isn't proxying /api) hangs
  // forever. That leaves pages stuck on their loading state, which looks
  // exactly like "the page won't open". 10s keeps things responsive while
  // still allowing slow connections to succeed.
  timeout: 10000,
});

// Attach the JWT (if present) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error messages so pages can show err.message directly.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
