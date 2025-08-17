import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, message, Modal, Steps } from 'antd';
import { ReactComponent as EyeIcon } from "../../resource/img/svg/form-eye.svg";
import { ReactComponent as EyeOff } from "../../resource/img/svg/form-eye-off.svg";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/authService';
import { Link } from 'react-router-dom';
import styles from './auth.module.scss';

const { Step } = Steps;

const Auth = () => {
    const [passwordType, setPasswordType] = useState('password');
    const [loading, setLoading] = useState(false);
    const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const navigate = useNavigate();
    const { login, token, forgetPassword, restorePassword } = useAuth();

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

    const handleForgotPassword = async () => {
        try {
            setLoading(true);
            await forgetPassword(email);
            message.success('Код подтверждения отправлен на вашу почту');
            setCurrentStep(1);
        } catch (error) {
            message.error(error.message || 'Ошибка при запросе сброса пароля');
        } finally {
            setLoading(false);
        }
    };

    const handleRestorePassword = async () => {
        try {
            setLoading(true);
            await restorePassword({ email, code, new_password: newPassword });
            message.success('Пароль успешно изменен');
            setForgotPasswordVisible(false);
            setCurrentStep(0);
        } catch (error) {
            message.error(error.message || 'Ошибка при восстановлении пароля');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        {
            title: 'Введите email',
            content: (
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: 'Пожалуйста, введите email!' }]}
                >
                    <Input 
                        placeholder="Ваш email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Item>
            ),
        },
        {
            title: 'Введите код и новый пароль',
            content: (
                <>
                    <Form.Item
                        label="Код подтверждения"
                        name="code"
                        rules={[{ required: true, message: 'Пожалуйста, введите код!' }]}
                    >
                        <Input 
                            placeholder="Код из письма" 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Новый пароль"
                        name="newPassword"
                        rules={[{ required: true, message: 'Пожалуйста, введите новый пароль!' }]}
                    >
                        <Input.Password
                            placeholder="Новый пароль"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </Form.Item>
                </>
            ),
        },
    ];

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
                    <Form.Item>
                        <div className={styles.footer}>
                            <div>
                                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                            </div>
                            <div className={styles.forgotPassword}>
                                <Button type="link" onClick={() => setForgotPasswordVisible(true)}>
                                    Забыли пароль?
                                </Button>
                            </div>
                        </div>
                    </Form.Item>
                </Form>
            </div>

            <Modal
                title="Восстановление пароля"
                visible={forgotPasswordVisible}
                onCancel={() => {
                    setForgotPasswordVisible(false);
                    setCurrentStep(0);
                }}
                footer={[
                    currentStep === 0 ? (
                        <Button 
                            key="next" 
                            type="primary" 
                            onClick={handleForgotPassword}
                            loading={loading}
                        >
                            Отправить код
                        </Button>
                    ) : (
                        <Button 
                            key="submit" 
                            type="primary" 
                            onClick={handleRestorePassword}
                            loading={loading}
                        >
                            Изменить пароль
                        </Button>
                    ),
                ]}
            >
                <Steps current={currentStep} style={{ marginBottom: 24 }}>
                    {steps.map((item) => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>
                <div>{steps[currentStep].content}</div>
            </Modal>
        </div>
    );
};

export default Auth;