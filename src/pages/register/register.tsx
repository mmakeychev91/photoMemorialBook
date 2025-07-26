import { Form, Input, Button, message, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/authService';
import { useState, useCallback, useEffect } from 'react';
import _baseUrl from '../../urlConfiguration';
import styles from './register.module.scss';

interface FormValues {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
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

const { Title } = Typography;

export const Register = () => {
    const [form] = Form.useForm<FormValues>();
    const [passwordType, setPasswordType] = useState('password');
    const [loading, setLoading] = useState(false);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: FormValues) => {
        setLoading(true);
        try {
          console.log('Отправка данных на сервер:', {
            endpoint: `${_baseUrl}/api/auth/register`,
            data: values
          });
      
          const response = await register(values);
          console.log('Ответ сервера:', response);
      
          await login(values);
          message.success('Регистрация успешна!');
          navigate('/home');
        } catch (error) {
          console.error('Полная ошибка:', {
            error,
            responseData: (error as ApiError)?.response?.data
          });
          // ... обработка ошибки
        } finally {
          setLoading(false);
        }
      };

    return (
        <div className={styles.wrap}>
            <div className={styles.container}>
                <Title level={2} className={styles.title}>Регистрация</Title>

                <Form
                    form={form}
                    className={styles.form}
                    onFinish={onFinish}
                    initialValues={{ remember: true }}
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: 'Пожалуйста, введите логин!' },
                            { min: 4, message: 'Минимум 4 символа' },
                            { max: 20, message: 'Максимум 20 символов' }
                        ]}
                    >
                        <Input placeholder="Логин" disabled={loading} />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Пожалуйста, введите email!' },
                            { type: 'email', message: 'Некорректный email' }
                        ]}
                    >
                        <Input placeholder="Email" disabled={loading} />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Пожалуйста, введите пароль!' },
                            { min: 6, message: 'Минимум 6 символов' },
                            { max: 30, message: 'Максимум 30 символов' }
                        ]}
                    >
                        <Input.Password
                            placeholder="Пароль"
                            type={passwordType}
                            disabled={loading}
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
                        />
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