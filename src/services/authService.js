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

    // Обновление токена
    const refreshToken = useCallback(async () => {
        if (!hasRefreshToken()) {
            removeToken();
            throw new Error('No refresh token available');
        }

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('refresh_token', token.refresh_token);
            params.append('client_id', 'string');
            params.append('client_secret', 'string');

            const response = await fetchData({
                url: `${_baseUrl}/api/auth/refresh`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: params
            });

            const newToken = {
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                token_type: response.token_type,
                user_id: response.user_id || token.user_id
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
        hasRefreshToken
    }), [token, isLoading, login, logout, refreshToken, hasRefreshToken]);

    return (
        <UserContext.Provider value={value}>
            {!isLoading && children}
        </UserContext.Provider>
    );
};

export const useAuth = () => useContext(UserContext);