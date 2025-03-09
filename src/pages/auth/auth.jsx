import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button } from 'antd'
import { LoginLogo, EyeIcon, EyeOff } from '../../resource/img/svg';
import { useAuth } from '../../services/authService';
import styles from './auth.module.scss'

export let errorSetter;

const Auth = () => {
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordType, setPasswordType] = useState('password');

    const [errorMessage, setErrorMessage] = useState('');
    const { login, token } = useAuth();
    errorSetter = setErrorMessage;
    const togglePasswordType = useCallback(() => {
        setPasswordType((prevType) =>
            prevType === 'password' ? 'text' : 'password'
        );
    }, []);

    useEffect(() => {
        const inputEl = document.querySelector('.input-password');
        inputEl.type = passwordType;
    }, [passwordType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        login({ username, password });

    };

    return (
        <>
            <div className={styles.wrap}>
                <div className={`container ${styles.container}`}>
                    <Form className={styles.form} onSubmit={handleSubmit}>
                        {errorMessage && <p>{errorMessage}</p>}
                        <label className={styles.label}>
                            <span>Логин</span>
                            <Input
                                className={username ? 'input active' : 'input'}
                                type="text"
                                name="login"
                                required
                                onChange={(e) => setUserName(e.target.value)}
                                value={username}
                            />
                        </label>
                        <label className={styles.label}>
                            <span>Пароль</span>
                            <Input.Password
                                className={
                                    password ? 'input input-password active' : 'input input-password'
                                }
                                type={passwordType}
                                name="password"
                                required
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                            />
                        </label>
                        <Button className={styles.button} htmlType='submit' type="primary">
                            Отправить
                        </Button>
                    </Form>
                </div>
            </div>

        </>
    );
};

export default Auth;