// src/pages/payment/PaymentPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Alert, Space, Divider, message, Spin } from 'antd';
import { usePaymentService } from '../../services/payment/payMentService';
import { Link } from 'react-router-dom';
import styles from './PaymentPage.module.scss';
import { useAuth } from '../../services/authService';
import { useEffect } from 'react';

const { Title, Paragraph, Text } = Typography;

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { createPayment } = usePaymentService();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const { fetchUserInfo, userInfo } = useAuth();

  // Проверяем доступ при загрузке страницы и при изменении userInfo
  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsCheckingAccess(true);

        // Если userInfo уже есть, проверяем его
        if (userInfo) {
          if (userInfo.has_access) {
            message.info('У вас уже есть доступ. Переходим на главную...');
            setTimeout(() => navigate('/home'), 2000);
            return;
          } else {
            // Если userInfo есть, но доступа нет, прекращаем проверку
            setIsCheckingAccess(false);
            return;
          }
        }

        // Если userInfo нет, запрашиваем его
        const userData = await fetchUserInfo();

        // Проверяем, есть ли доступ у пользователя
        if (userData?.has_access) {
          message.info('У вас уже есть доступ. Переходим на главную...');
          setTimeout(() => navigate('/home'), 2000);
          return;
        }
      } catch (error) {
        console.error('Ошибка при проверке доступа:', error);
        // Если ошибка, остаемся на странице оплаты
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [fetchUserInfo, navigate, userInfo]);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const paymentResponse = await createPayment();

      if (paymentResponse && paymentResponse.confirmation_url) {
        setPaymentUrl(paymentResponse.confirmation_url);
      }
      // Ошибка 403 обрабатывается в сервисе и показывает сообщение + редирект
    } catch (err: unknown) {
      // Общие ошибки (кроме 403, которая уже обработана в сервисе)
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании платежа';
      if (!errorMessage.includes('Доступ уже оплачен')) {
        // Показываем только если это не ошибка "уже оплачено"
        message.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPayment = () => {
    if (paymentUrl) {
      // Пытаемся открыть в текущем окне (работает в Safari)
      window.location.href = paymentUrl;
    }
  };

  // Если проверяем доступ, показываем спиннер
  if (isCheckingAccess) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Проверка доступа..." />
      </div>
    );
  }

  return (
    <div className={styles.paymentPage}>
      <div className={styles.container}>
        <Card className={styles.paymentCard}>
          <Space direction="vertical" size="large" className={styles.content}>
            <div className={styles.header}>
              <Title level={2}>❌ У вас заблокирован сервис</Title>
            </div>

            <Alert
              message="Требуется подписка"
              description="Для того чтобы продолжить пользоваться приложением необходимо оформить подписку."
              type="warning"
              showIcon
            />

            <div className={styles.infoSection}>
              <Paragraph>
                <Text strong>Стоимость подписки:</Text> 50 рублей в месяц
              </Paragraph>

              {!paymentUrl ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleSubscribe}
                    className={styles.subscribeButton}
                    block
                    loading={isProcessing}
                    disabled={isProcessing}
                  >
                    Получить ссылку для оплаты
                  </Button>
                </>
              ) : (
                <>
                  <Paragraph>
                    <Text strong>Ссылка для оплаты готова:</Text>
                  </Paragraph>

                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleOpenPayment}
                      className={styles.paymentLinkButton}
                      block
                    >
                      💳 Перейти к оплате
                    </Button>

                  </Space>
                </>
              )}

              <Divider />
              <Link className={styles.refreshButton} to="/">На главную</Link>


              <Paragraph className={styles.thankYou}>
                Приятного пользования! Спасибо что остаетесь с нами!
              </Paragraph>

              <Paragraph className={styles.support}>
                Возник вопрос? Напишите нам на почту {' '}
                <a href="mailto:pravsklad@mail.ru" className={styles.supportLink}>
                  pravsklad@mail.ru
                </a>
              </Paragraph>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;