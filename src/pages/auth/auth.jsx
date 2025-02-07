import { useState, useEffect, useCallback } from 'react';

import { LoginLogo, EyeIcon, EyeOff } from '../../resource/img/svg';
import { useAuth } from '../../services/authService';

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
            <div>
                <div>
                    <h1>Фотопомянник</h1>
                </div>
                <div>
                    <form onSubmit={handleSubmit}>
                        <h2 >Вход в аккаунт</h2>
                        {errorMessage && <p>{errorMessage}</p>}
                        <label>
                            <span>Логин</span>
                            <input
                                className={username ? 'input active' : 'input'}
                                type="text"
                                name="login"
                                required
                                onChange={(e) => setUserName(e.target.value)}
                                value={username}
                            />
                        </label>
                        <label>
                            <span>Пароль</span>
                            <input
                                className={
                                    password ? 'input input-password active' : 'input input-password'
                                }
                                type={passwordType}
                                name="password"
                                required
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordType}
                            >
                                {passwordType === 'text' ? (
                                    <EyeOff className="eye-off" />
                                ) : (
                                    <EyeIcon className="eye-on" />
                                )}
                            </button>
                        </label>
                        <button type="submit">
                            Отправить
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Auth;