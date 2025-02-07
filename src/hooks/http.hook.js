import { useCallback } from 'react';
import axios from 'axios';

export const useHttp = () => {
    const fetchData = useCallback(async (params) => {
        try {
            const result = await axios.request(params);
            const data = result.data;

            return data;
        } catch (error) {
            console.error(error);
            throw new Error('Ошибка при выполнении запроса');
        }
    }, []);

    return { fetchData };
};