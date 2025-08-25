// src/services/payment/paymentService.ts
import { useHttp } from '../../hooks/http.hook';
import _baseUrl from '../../urlConfiguration';
import useToken from '../../hooks/useToken/useToken';
import { useAuth } from '../authService';
import { message } from 'antd';

export interface PaymentResponse {
  confirmation_url: string;
  payment_id?: string;
  status?: string;
}

export const usePaymentService = () => {
  const { fetchData } = useHttp();
  const { getAccessToken } = useToken();
  const { refreshToken } = useAuth();

  /**
   * Создает платеж и возвращает ссылку для оплаты
   */
  const createPayment = async (retry = true): Promise<PaymentResponse> => {
    try {
      const response = await fetchData({
        url: `${_baseUrl}/api/payment/create_payment`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response as PaymentResponse;
    } catch (error: unknown) {
      console.error("Ошибка при создании платежа:", error);

      // Получаем статус ошибки
      const errorStatus = (error as any)?.status;
      const errorMessage = error instanceof Error ? error.message : '';

      // Проверяем 403 ошибку (Forbidden - уже оплатили)
      const isAlreadyPaid = errorStatus === 403 || 
        errorMessage.includes('403') || 
        errorMessage.includes('Forbidden');

      if (isAlreadyPaid) {
        message.info('Вы уже оплатили подписку. Переходим на главную...', 3);
        setTimeout(() => {
          window.location.href = '/home';
        }, 2000);
        throw new Error("Доступ уже оплачен");
      }

      // Проверяем ошибку авторизации (401)
      const isUnauthorized = error instanceof Error &&
        error.message.includes("Could not validate credentials");

      if (isUnauthorized && retry) {
        try {
          await refreshToken();
          return await createPayment(false);
        } catch (refreshError: unknown) {
          console.error("Не удалось обновить токен:",
            refreshError instanceof Error ? refreshError.message : 'Unknown error');
          throw new Error("Не удалось обновить токен");
        }
      }

      const finalErrorMessage = error instanceof Error ? error.message : 'Ошибка при создании платежа';
      console.error("Ошибка запроса:", finalErrorMessage);
      throw new Error(finalErrorMessage);
    }
  };

  /**
   * Проверяет статус платежа
   */
  const checkPaymentStatus = async (paymentId: string, retry = true): Promise<any> => {
    try {
      const response = await fetchData({
        url: `${_baseUrl}/api/payment/check_status/${paymentId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'application/json'
        }
      });

      return response;
    } catch (error: unknown) {
      console.error("Ошибка при проверке статуса платежа:", error);

      // Проверяем ошибку авторизации (401)
      const isUnauthorized = error instanceof Error &&
        error.message.includes("Could not validate credentials");

      if (isUnauthorized && retry) {
        try {
          await refreshToken();
          return await checkPaymentStatus(paymentId, false);
        } catch (refreshError: unknown) {
          console.error("Не удалось обновить токен:",
            refreshError instanceof Error ? refreshError.message : 'Unknown error');
          throw new Error("Не удалось обновить токен");
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Ошибка при проверке статуса';
      console.error("Ошибка запроса:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  return { createPayment, checkPaymentStatus };
};