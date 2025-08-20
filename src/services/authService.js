import {
    createContext,
    useContext,
    useMemo,
    useEffect,
    useState,
    useCallback
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useHttp } from '../hooks/http.hook';
import useToken from '../hooks/useToken/useToken';
import _baseUrl from '../urlConfiguration';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const navigate = useNavigate();
    const { fetchData, initialize } = useHttp();
    const { token, setToken, removeToken } = useToken();
    const [isLoading, setIsLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null); // Добавляем состояние для информации о пользователе

    // Проверка наличия refresh token
    const hasRefreshToken = useCallback(() => {
        return !!token?.refresh_token;
    }, [token]);

    // Получение информации о пользователе
    const fetchUserInfo = useCallback(async () => {
        if (!token?.access_token) {
            setUserInfo(null);
            return null;
        }

        try {
            const response = await fetchData({
                url: `${_baseUrl}/api/auth/users/me`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token.access_token}`,
                    'Accept': 'application/json'
                }
            });
            setUserInfo(response);
            return response;
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            setUserInfo(null);
            return null;
        }
    }, [token, fetchData]);

    // Инициализация HTTP-клиента (только если есть токен)
    useEffect(() => {
        if (!hasRefreshToken()) {
            setIsLoading(false);
            return;
        }

        const cleanup = initialize({
            getToken: () => token?.access_token,
            onUnauthorized: refreshToken,
            hasRefreshToken
        });

        return cleanup;
    }, [token, initialize, hasRefreshToken]);

    // При загрузке и изменении токена получаем информацию о пользователе
    useEffect(() => {
        if (token?.access_token) {
            fetchUserInfo();
        } else {
            setUserInfo(null);
        }
    }, [token, fetchUserInfo]);

    // Авторизация пользователя
    const login = async ({ username, password }) => {
        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('username', username);
            params.append('password', password);
            params.append('scope', '');
            params.append('client_id', 'string');
            params.append('client_secret', 'string');

            const response = await fetchData({
                url: `${_baseUrl}/api/auth/login`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: params
            });

            setToken({
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                token_type: response.token_type,
                user_id: response.user_id
            });

            // Получаем информацию о пользователе после успешного логина
            await fetchUserInfo();

            navigate('/dashboard');
            return response;
        } catch (error) {
            console.error('Login error:', error.response?.data);
            throw new Error(error.response?.data?.detail || 'Ошибка авторизации');
        }
    };


    const register = async (userData) => {
        try {
            const response = await fetch(`${_baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                // Бросаем ошибку с детальной информацией
                throw new Error(
                    responseData.detail ||
                    responseData.message ||
                    'Registration failed'
                );
            }

            return responseData;
        } catch (error) {
            console.error('Registration error:', error);

            // Если это уже наша ошибка с сообщением, просто пробрасываем дальше
            if (error.message && error.message !== 'Registration failed') {
                throw error;
            }

            // Иначе создаем новую ошибку с общим сообщением
            throw new Error(error.response?.data?.detail || 'Ошибка регистрации');
        }
    };

    // Отправка кода подтверждения email
    const sendEmailConfirmCode = useCallback(async () => {
        if (!token?.access_token) {
            throw new Error('Требуется авторизация');
        }

        try {
            const response = await fetchData({
                url: `${_baseUrl}/api/auth/send-email-confirm-code`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.access_token}`,
                    'Accept': '*/*'
                }
            });
            return response;
        } catch (error) {
            console.error('Send email confirm code error:', error.response?.data);
            throw new Error(error.response?.data?.detail || 'Ошибка при отправке кода подтверждения');
        }
    }, [token, fetchData]);

    // Подтверждение email по коду
    const confirmEmailByCode = useCallback(async (code) => {
        if (!token?.access_token) {
            throw new Error('Требуется авторизация');
        }

        try {
            const response = await fetchData({
                url: `${_baseUrl}/api/auth/email-confirm-by-code`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: { code }
            });

            // Обновляем информацию о пользователе после подтверждения
            await fetchUserInfo();

            return response;
        } catch (error) {
            console.error('Email confirm error:', error.response?.data);
            throw new Error(error.response?.data?.detail || 'Ошибка при подтверждении email');
        }
    }, [token, fetchData, fetchUserInfo]);

    // Обновление токена
    const refreshToken = useCallback(async () => {
        if (!hasRefreshToken()) {
            removeToken();
            throw new Error('No refresh token available');
        }

        try {
            const url = new URL(`${_baseUrl}/api/auth/refresh`);
            url.searchParams.append('refresh_token', token.refresh_token);

            const response = await fetchData({
                url: url.toString(),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: 'string',
                    client_secret: 'string',
                }),
            });

            const newToken = {
                access_token: response.access_token,
                refresh_token: token.refresh_token,
            };

            setToken(newToken);
            return newToken.access_token;
        } catch (error) {
            console.error('Refresh failed:', error.response?.data);
            removeToken();
            navigate('/login');
            throw error;
        }
    }, [token, fetchData, navigate, removeToken, setToken, hasRefreshToken]);

    // Выход из системы
    const logout = useCallback(() => {
        removeToken();
        setUserInfo(null);
        navigate('/login');
    }, [removeToken, navigate]);

    const forgetPassword = async (email) => {
        try {
            const response = await fetchData({
                url: `${_baseUrl}/api/auth/forget-password-by-code`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: { email }
            });
            return response;
        } catch (error) {
            console.error('Forget password error:', error.response?.data);
            throw new Error(error.response?.data?.detail || 'Ошибка при запросе сброса пароля');
        }
    };

    const restorePassword = async ({ email, code, new_password }) => {
        try {
            const response = await fetchData({
                url: `${_baseUrl}/api/auth/restore-password-by-code`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: { email, code, new_password }
            });
            return response;
        } catch (error) {
            console.error('Restore password error:', error.response?.data);
            throw new Error(error.response?.data?.detail || 'Ошибка при восстановлении пароля');
        }
    };

    // Проверка авторизации при загрузке
    useEffect(() => {
        const checkAuth = async () => {
            if (!token?.access_token) {
                setIsLoading(false);
                return;
            }

            // Простая проверка наличия токена (без запроса к API)
            setIsLoading(false);
        };

        checkAuth();
    }, [token]);

    const value = useMemo(() => ({
        token,
        userInfo,
        isLoading,
        isAuthenticated: !!token?.access_token,
        isEmailConfirmed: userInfo?.is_email_confirmed || false,
        login,
        logout,
        refreshToken,
        hasRefreshToken,
        register,
        forgetPassword,
        restorePassword,
        sendEmailConfirmCode,
        confirmEmailByCode,
        fetchUserInfo // Добавляем функцию для ручного обновления информации о пользователе
    }), [token, userInfo, isLoading, login, logout, refreshToken, hasRefreshToken, register, sendEmailConfirmCode, confirmEmailByCode, fetchUserInfo]);

    return (
        <UserContext.Provider value={value}>
            {!isLoading && children}
        </UserContext.Provider>
    );
};

export const useAuth = () => useContext(UserContext);