import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, message } from 'antd';
import { ReactComponent as EyeIcon } from "../../resource/img/svg/form-eye.svg";
import { ReactComponent as EyeOff } from "../../resource/img/svg/form-eye-off.svg";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/authService';
import styles from './auth.module.scss';

const Auth = () => {
    const [passwordType, setPasswordType] = useState('password');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, token } = useAuth();
    
    // Автоматический редирект при наличии токена
    useEffect(() => {
        if (token) {
            navigate('/home');
        }
    }, [token, navigate]);

    const togglePasswordType = useCallback(() => {
        setPasswordType((prevType) => 
            prevType === 'password' ? 'text' : 'password'
        );
    }, []);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login({ 
                username: values.username, 
                password: values.password 
            });
        } catch (error) {
            message.error(error.message || 'Ошибка авторизации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrap}>
            <div className={`container ${styles.container}`}>
                <Form
                    className={styles.form}
                    onFinish={onFinish}
                    initialValues={{ remember: true }}
                >
                    <Form.Item
                        name="username"
                        rules={[{ 
                            required: true, 
                            message: 'Пожалуйста, введите логин!' 
                        }]}
                    >
                        <Input 
                            placeholder="Логин" 
                            disabled={loading}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ 
                            required: true, 
                            message: 'Пожалуйста, введите пароль!' 
                        }]}
                    >
                        <Input.Password
                            placeholder="Пароль"
                            type={passwordType}
                            disabled={loading}
                            iconRender={(visible) => (
                                visible ? 
                                    <EyeOff onClick={togglePasswordType} /> : 
                                    <EyeIcon onClick={togglePasswordType} />
                            )}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            block
                        >
                            Войти
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Auth;