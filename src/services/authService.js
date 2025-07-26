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

    // Проверка наличия refresh token
    const hasRefreshToken = useCallback(() => {
        return !!token?.refresh_token;
    }, [token]);

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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };


    // Обновление токена
    const refreshToken = useCallback(async () => {
        if (!hasRefreshToken()) {
            removeToken();
            throw new Error('No refresh token available');
        }

        try {
            // 1. Добавляем refresh_token в URL как query-параметр
            const url = new URL(`${_baseUrl}/api/auth/refresh`);
            url.searchParams.append('refresh_token', token.refresh_token);

            // 2. Отправляем запрос с пустым телом (или оставляем form-data, если нужно)
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
        navigate('/login');
    }, [removeToken, navigate]);

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
        isLoading,
        isAuthenticated: !!token?.access_token,
        login,
        logout,
        refreshToken,
        hasRefreshToken,
        register
    }), [token, isLoading, login, logout, refreshToken, hasRefreshToken, register]);

    return (
        <UserContext.Provider value={value}>
            {!isLoading && children}
        </UserContext.Provider>
    );
};

export const useAuth = () => useContext(UserContext);