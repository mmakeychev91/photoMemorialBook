import { Form, Input, Button, message, Typography, Alert, Checkbox } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/authService';
import { useState, useCallback, useEffect } from 'react';
import _baseUrl from '../../urlConfiguration';
import styles from './register.module.scss';

interface FormValues {
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}

interface ApiError {
    response?: {
        data?: {
            detail?: string | Array<{ msg?: string }>;
        };
    };
    message?: string;
}

interface ErrorResponse {
    detail?: string | Array<{ msg?: string }>;
}

const { Title, Text } = Typography;

export const Register = () => {
    const [form] = Form.useForm<FormValues>();
    const [passwordType, setPasswordType] = useState('password');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const { register, login, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/home');
        }
    }, [isAuthenticated, navigate]);

    const togglePasswordType = useCallback(() => {
        setPasswordType(prev => prev === 'password' ? 'text' : 'password');
    }, []);

    const extractErrorMessage = (error: unknown): string => {
        if (typeof error === 'string') {
            return error;
        }

        if (error && typeof error === 'object' && 'message' in error) {
            const errorObj = error as { message?: string };
            return errorObj.message || 'Неизвестная ошибка';
        }

        const apiError = error as ApiError;
        if (apiError?.response?.data?.detail) {
            const detail = apiError.response.data.detail;

            if (Array.isArray(detail)) {
                return detail.map(item => item.msg || 'Ошибка валидации').join(', ');
            }

            return detail;
        }

        return 'Произошла неизвестная ошибка';
    };

    const onFinish = async (values: FormValues) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            console.log('Отправка данных на сервер:', {
                endpoint: `${_baseUrl}/api/auth/register`,
                data: {
                    username: values.email, // Используем email как username
                    email: values.email,
                    password: values.password
                }
            });

            // Отправляем данные на сервер, используя email как username
            const registerData = {
                username: values.email,
                email: values.email,
                password: values.password
            };
            
            const response = await register(registerData);
            console.log('Ответ сервера:', response);

            try {
                await login({
                    username: values.email, // Используем email для входа
                    password: values.password
                });
                message.success('Регистрация успешна! Вы автоматически вошли в систему.');
                navigate('/home');
            } catch (loginError) {
                message.success('Регистрация успешна! Теперь войдите в систему.');
                navigate('/login');
            }

        } catch (error) {
            console.error('Полная ошибка регистрации:', error);

            const errorMsg = extractErrorMessage(error);
            setErrorMessage(errorMsg);
            message.error(errorMsg);

            if (errorMsg.toLowerCase().includes('username') || errorMsg.toLowerCase().includes('логин')) {
                form.setFields([{ name: 'email', errors: [errorMsg] }]);
            } else if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('почт')) {
                form.setFields([{ name: 'email', errors: [errorMsg] }]);
            } else if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('парол')) {
                form.setFields([{ name: 'password', errors: [errorMsg] }]);
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.container}>
                <Title level={2} className={styles.title}>Регистрация</Title>

                {errorMessage && (
                    <Alert
                        message="Ошибка регистрации. Возможно введенный email уже занят"
                        description={errorMessage}
                        type="error"
                        showIcon
                        style={{ marginBottom: 20 }}
                    />
                )}

                <Form
                    form={form}
                    className={styles.form}
                    onFinish={onFinish}
                    initialValues={{ remember: true, agreeToTerms: false }}
                    onFieldsChange={() => setErrorMessage(null)}
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Пожалуйста, введите email!' },
                            { type: 'email', message: 'Некорректный email' }
                        ]}
                        validateStatus={errorMessage?.toLowerCase().includes('email') || errorMessage?.toLowerCase().includes('username') ? 'error' : ''}
                    >
                        <Input
                            placeholder="Email"
                            disabled={loading}
                            onChange={() => setErrorMessage(null)}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Пожалуйста, введите пароль!' },
                            { min: 6, message: 'Минимум 6 символов' },
                            { max: 30, message: 'Максимум 30 символов' }
                        ]}
                        validateStatus={errorMessage?.toLowerCase().includes('password') ? 'error' : ''}
                    >
                        <Input.Password
                            placeholder="Пароль"
                            type={passwordType}
                            disabled={loading}
                            onChange={() => setErrorMessage(null)}
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Пожалуйста, подтвердите пароль!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Пароли не совпадают!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            placeholder="Подтвердите пароль"
                            type={passwordType}
                            disabled={loading}
                            onChange={() => setErrorMessage(null)}
                        />
                    </Form.Item>

                    <Form.Item
                        name="agreeToTerms"
                        valuePropName="checked"
                        rules={[
                            {
                                validator: (_, value) =>
                                    value ? Promise.resolve() : Promise.reject(new Error('Для регистрации необходимо принять условия')),
                            },
                        ]}
                    >
                        <Checkbox className={styles.checkbox} disabled={loading}>
                            Я соглашаюсь с{' '}
                            <Link to="/user-agreement" target="_blank" rel="noopener noreferrer">
                                пользовательским соглашением
                            </Link>
                            ,{' '}
                            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                                политикой конфиденциальности
                            </Link>
                            {' '}и даю{' '}
                            <Link to="/data-processing-agreement" target="_blank" rel="noopener noreferrer">
                                согласие на обработку персональных данных
                            </Link>
                        </Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            Зарегистрироваться
                        </Button>
                    </Form.Item>

                    <div className={styles.footer}>
                        Уже есть аккаунт? <Link to="/login">Войти</Link>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Register;