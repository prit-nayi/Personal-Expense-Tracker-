import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeRequests = 0;
let slowRequestTimer: any = null;

const notifySlowRequest = (isSlow: boolean) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('backend-slow-status', { detail: { isSlow } }));
  }
};

// Request interceptor to attach JWT token and track slow requests
apiClient.interceptors.request.use(
  (config) => {
    activeRequests++;
    if (activeRequests === 1) {
      slowRequestTimer = setTimeout(() => {
        if (activeRequests > 0) {
          notifySlowRequest(true);
        }
      }, 4000);
    }
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0 && slowRequestTimer) {
      clearTimeout(slowRequestTimer);
      notifySlowRequest(false);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for 401 handling and slow request completion
apiClient.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      if (slowRequestTimer) clearTimeout(slowRequestTimer);
      notifySlowRequest(false);
    }
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      if (slowRequestTimer) clearTimeout(slowRequestTimer);
      notifySlowRequest(false);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
