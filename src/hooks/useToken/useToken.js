import { useState } from 'react';

export default function useToken() {
    const getToken = () => {
        const tokenData = localStorage.getItem('authData');
        return tokenData ? JSON.parse(tokenData) : null;
    };

    const [token, setTokenState] = useState(getToken());

    const saveToken = (authData) => {
        // Сохраняем все данные авторизации
        localStorage.setItem('authData', JSON.stringify(authData));
        setTokenState(authData);
    };

    const removeToken = () => {
        localStorage.removeItem('authData');
        setTokenState(null);
    };

    // Новый метод для получения только access_token
    const getAccessToken = () => {
        const authData = getToken();
        return authData?.access_token || null;
    };
    // Новый метод для получения только access_token
    const getRefreshToken = () => {
        const authData = getToken();
        return authData?.refresh_token || null;
    };

    return {
        token, // Теперь содержит ВСЕ данные: {access_token, refresh_token и т.д.}
        setToken: saveToken,
        removeToken,
        getToken,
        getAccessToken,
        getRefreshToken,
    };
}