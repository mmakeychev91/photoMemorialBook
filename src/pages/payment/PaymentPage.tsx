// src/pages/payment/PaymentPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Alert, Space, Divider, Spin, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { usePaymentService } from '../../services/payment/payMentService';
import styles from './PaymentPage.module.css';

const { Title, Paragraph, Text } = Typography;

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { createPayment } = usePaymentService();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const paymentResponse = await createPayment();

      if (paymentResponse && paymentResponse.confirmation_url) {
        // Открываем ссылку на оплату в новом окне
        window.open(paymentResponse.confirmation_url, '_blank');
        message.success('Ссылка для оплаты получена. Открываю страницу оплаты...');
      } else {
        message.error('Не удалось получить ссылку для оплаты');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании платежа';
      message.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={styles.paymentPage}>
      <div className={styles.container}>
        <Card className={styles.paymentCard}>
          <Space direction="vertical" size="large" className={styles.content}>
            <div className={styles.header}>
              <Title level={2}>❌ У вас закончился пробный период.</Title>
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

              <Paragraph>
                Для оформления подписки перейдите по ссылке:
              </Paragraph>

              <Button
                type="primary"
                size="large"
                onClick={handleSubscribe}
                className={styles.subscribeButton}
                block
                loading={isProcessing}
                disabled={isProcessing}
              >
                Перейти к оплате
              </Button>

              <Divider />

              <Paragraph className={styles.thankYou}>
                Приятного пользования! Спасибо что остаетесь с нами!

              </Paragraph>
              <Paragraph className={styles.thankYou}>
                Возник вопрос? Напиши нам на почту  <a href="mailto:pravsklad@mail.ru">pravsklad@mail.ru</a>
              </Paragraph>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;