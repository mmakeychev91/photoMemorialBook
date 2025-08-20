// components/EmailConfirmationModal/EmailConfirmationModal.jsx
import React, { useState } from 'react';
import { Modal, Steps, Form, Input, Button, message, Alert } from 'antd';
import styles from './EmailConfirmationModal.module.scss'

const { Step } = Steps;

const EmailConfirmationModal = ({ 
    visible, 
    onCancel, 
    onSendCode, 
    onConfirm 
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('');

    const handleSendCode = async () => {
        setLoading(true);
        try {
            await onSendCode();
            message.success('Код подтверждения отправлен на вашу почту');
            setCurrentStep(1);
        } catch (error) {
            message.error(error.message || 'Ошибка при отправке кода');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmEmail = async () => {
        if (!code) {
            message.error('Введите код подтверждения');
            return;
        }

        setLoading(true);
        try {
            await onConfirm(code);
            message.success('Email успешно подтвержден!');
            onCancel();
        } catch (error) {
            message.error(error.message || 'Ошибка при подтверждении email');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        {
            title: 'Отправка кода',
            content: (
                <div>
                    <p style={{ marginBottom: 16 }}>Нажмите кнопку ниже, чтобы отправить код подтверждения на вашу электронную почту.</p>
                    <Button 
                        type="primary" 
                        onClick={handleSendCode}
                        loading={loading}
                    >
                        Отправить код подтверждения
                    </Button>
                </div>
            ),
        },
        {
            title: 'Ввод кода',
            content: (
                <Form layout="vertical">
                    <Form.Item
                        label="Код подтверждения"
                        required
                    >
                        <Input
                            placeholder="Введите код из письма"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={6}
                        />
                    </Form.Item>
                    <Button 
                        type="primary" 
                        onClick={handleConfirmEmail}
                        loading={loading}
                        block
                    >
                        Подтвердить email
                    </Button>
                </Form>
            ),
        },
    ];

    return (
        <Modal
            title="Подтверждение email"
            visible={visible}
            onCancel={onCancel}
            footer={null}
            width={500}
        >
            <Alert 
                message="Важно!" 
                description="Подтверждение email необходимо для восстановления доступа к аккаунту в случае утери пароля."
                type="info" 
                showIcon 
                style={{ marginBottom: 16 }}
            />
            
            <Steps current={currentStep} style={{ marginBottom: 24 }}>
                {steps.map((item, index) => (
                    <Step key={index} title={item.title} />
                ))}
            </Steps>
            
            <div>{steps[currentStep].content}</div>
        </Modal>
    );
};

export default EmailConfirmationModal;