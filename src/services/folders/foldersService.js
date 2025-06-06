import { useHttp } from './../../hooks/http.hook';
import _baseUrl from '../../urlConfiguration';
import useToken from '../../hooks/useToken/useToken'
import { useAuth } from '../authService';

export const useFoldersService = () => {
    const { fetchData } = useHttp();
    const { getAccessToken } = useToken();
    const { refreshToken } = useAuth();

    const getFolders = async (retry = true) => {
        try {
            return await fetchData({
                url: `${_baseUrl}/api/folders/`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`, // Используем метод из authService
                    'Accept': 'application/json'
                }
            });
        } catch (error) {
            console.log("Raw error:", error); // Посмотрите реальную структуру

            // Варианты проверки 401:
            const isUnauthorized = error.message.includes("Could not validate credentials");

            if (isUnauthorized && retry) {
                try {
                    // Пытаемся обновить токен
                    await refreshToken();
                    // Повторяем запрос с новым токеном
                    return await getFolders(false);
                } catch (refreshError) {
                    console.error("Token refresh failed:", refreshError.message);
                    throw refreshError;
                }
            }
            console.error("Request failed:", error.message);
            throw error;
        }
    };

    return { getFolders };
};