import { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

export const useHttp = () => {
  const axiosInstance = useRef(axios.create({
    // Базовые настройки Axios
    withCredentials: true,
    timeout: 10000,
  }));
  const refreshTokenRequest = useRef(null);

  // Интерсептор для добавления токена
  const setupRequestInterceptor = useCallback((getToken) => {
    return axiosInstance.current.interceptors.request.use(
      async (config) => {
        const token = getToken?.();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }, []);

  // Интерсептор для обработки 401 ошибки
  const setupResponseInterceptor = useCallback((onUnauthorized) => {
    return axiosInstance.current.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Важно: проверяем И статус 401 И наличие refresh token
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            onUnauthorized.hasRefreshToken()) { // Новая проверка
          originalRequest._retry = true;
          // ... остальная логика
        }
        
        return Promise.reject(error);
      }
    );
  }, []);

  const fetchData = useCallback(async (params) => {
    try {
      // Для form-data преобразуем URLSearchParams в строку
      const isFormData = params.headers?.['Content-Type'] === 'application/x-www-form-urlencoded';
      const data = isFormData && params.data instanceof URLSearchParams 
        ? params.data.toString() 
        : params.data;

      const response = await axiosInstance.current({
        baseURL: process.env.REACT_APP_API_URL || '',
        headers: {
          'Accept': 'application/json',
          ...params.headers,
        },
        ...params,
        data // Подменяем data для корректной обработки form-data
      });
      
      return response.data;
    } catch (error) {
      console.error('HTTP Request Failed:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
        config: {
          headers: error.config?.headers,
          data: error.config?.data
        }
      });

      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message || 
        error.message || 
        'Ошибка при выполнении запроса'
      );
    }
  }, []);

  // Инициализация интерсепторов
  const initialize = useCallback(({ getToken, onUnauthorized }) => {
    const requestInterceptor = setupRequestInterceptor(getToken);
    const responseInterceptor = setupResponseInterceptor(onUnauthorized);
    
    return () => {
      axiosInstance.current.interceptors.request.eject(requestInterceptor);
      axiosInstance.current.interceptors.response.eject(responseInterceptor);
    };
  }, [setupRequestInterceptor, setupResponseInterceptor]);

  return { 
    fetchData,
    initialize,
    axiosInstance: axiosInstance.current 
  };
};