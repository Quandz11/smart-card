import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { MESSAGES } from '../constants/messages';
import { notify, NormalizedHttpError } from './notify';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const http = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token except for login
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.url?.includes('/api/auth/login')) {
      const token = localStorage.getItem('smartpass_admin_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap data and normalize errors
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const resData = response.data;
    if (resData && resData.pagination) {
      return {
        items: resData.data,
        total: resData.pagination.total,
        page: resData.pagination.page,
        limit: resData.pagination.limit,
      } as any;
    }
    if (resData && resData.success !== undefined) {
      return resData.data !== undefined ? resData.data : resData;
    }
    return resData;
  },
  (error: AxiosError<{ success?: boolean; message?: string }>) => {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.message;
    const isNetworkError = !error.response;

    // Network error / timeout
    if (isNetworkError) {
      const isTimeout =
        error.code === 'ECONNABORTED' ||
        (error.message && error.message.toLowerCase().includes('timeout'));
      const msg = isTimeout ? MESSAGES.NETWORK_TIMEOUT : MESSAGES.NETWORK_OFFLINE;
      notify.error(msg);
      const normalized: NormalizedHttpError = {
        status: 0,
        message: msg,
        isNetworkError: true,
      };
      return Promise.reject(normalized);
    }

    // 401 Unauthorized
    if (status === 401) {
      const isLoginUrl = error.config?.url?.includes('/api/auth/login');
      if (isLoginUrl) {
        const msg = backendMessage || MESSAGES.AUTH_INVALID_CREDENTIALS;
        const normalized: NormalizedHttpError = {
          status: 401,
          message: msg,
          isNetworkError: false,
        };
        return Promise.reject(normalized);
      } else {
        localStorage.removeItem('smartpass_admin_token');
        localStorage.removeItem('smartpass_admin_user');
        window.dispatchEvent(new Event('auth:logout'));
        notify.error(MESSAGES.AUTH_SESSION_EXPIRED);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        const normalized: NormalizedHttpError = {
          status: 401,
          message: MESSAGES.AUTH_SESSION_EXPIRED,
          isNetworkError: false,
        };
        return Promise.reject(normalized);
      }
    }

    // 403 Forbidden
    if (status === 403) {
      notify.error(MESSAGES.AUTH_FORBIDDEN);
      const normalized: NormalizedHttpError = {
        status: 403,
        message: MESSAGES.AUTH_FORBIDDEN,
        isNetworkError: false,
      };
      return Promise.reject(normalized);
    }

    // 500, 502, 503, 504
    if (status === 500) {
      notify.error(MESSAGES.SERVER_ERROR_500);
      const normalized: NormalizedHttpError = {
        status: 500,
        message: MESSAGES.SERVER_ERROR_500,
        isNetworkError: false,
      };
      return Promise.reject(normalized);
    }
    if (status === 502) {
      notify.error(MESSAGES.SERVER_ERROR_502);
      const normalized: NormalizedHttpError = {
        status: 502,
        message: MESSAGES.SERVER_ERROR_502,
        isNetworkError: false,
      };
      return Promise.reject(normalized);
    }
    if (status === 503) {
      notify.error(MESSAGES.SERVER_ERROR_503);
      const normalized: NormalizedHttpError = {
        status: 503,
        message: MESSAGES.SERVER_ERROR_503,
        isNetworkError: false,
      };
      return Promise.reject(normalized);
    }
    if (status === 504) {
      notify.error(MESSAGES.SERVER_ERROR_504);
      const normalized: NormalizedHttpError = {
        status: 504,
        message: MESSAGES.SERVER_ERROR_504,
        isNetworkError: false,
      };
      return Promise.reject(normalized);
    }

    // 400, 404, 409 and other 4xx:
    // Reject with normalized error containing verbatim backend message
    const msg = backendMessage || MESSAGES.GENERIC_ERROR;
    const normalized: NormalizedHttpError = {
      status: status || 400,
      message: msg,
      isNetworkError: false,
    };
    return Promise.reject(normalized);
  }
);

