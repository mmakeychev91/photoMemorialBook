import { useState } from 'react';

export default function useToken() {
    const getToken = () => {
        const tokenString = localStorage.getItem('token');
        return tokenString ? JSON.parse(tokenString) : null;
    };

    const [token, setToken] = useState(getToken());

    const saveToken = (userToken) => {
        localStorage.setItem('token', JSON.stringify(userToken));
        setToken(userToken);
    };

    const removeToken = () => {
        if (token) {
            localStorage.removeItem('token');
            setToken(null);
        }

    };

    return {
        token,
        setToken: saveToken,
        removeToken,
        getToken,
    };
}