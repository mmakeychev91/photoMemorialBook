import { useHttp } from '../../hooks/http.hook';
import _baseUrl from '../../urlConfiguration';
import useToken from '../../hooks/useToken/useToken';
import { useAuth } from '../authService';

interface Folder {
    cards(cards: any): unknown;
    id: number;
    name: string;
}

interface ApiError extends Error {
    response?: {
        status: number;
        data?: {
            detail?: Array<{
                msg: string;
                loc?: string[];
                type?: string;
            }>;
        };
    };
}

export const useFoldersService = () => {
    const { fetchData } = useHttp();
    const { getAccessToken } = useToken();
    const { refreshToken } = useAuth();

    const getFolders = async (retry = true): Promise<Folder[]> => {
        try {
            return await fetchData({
                url: `${_baseUrl}/api/folders/`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Accept': 'application/json'
                }
            });
        } catch (error: unknown) {
            console.log("Raw error:", error);

            const isUnauthorized = error instanceof Error &&
                error.message.includes("Could not validate credentials");

            if (isUnauthorized && retry) {
                try {
                    await refreshToken();
                    return await getFolders(false);
                } catch (refreshError: unknown) {
                    console.error("Token refresh failed:",
                        refreshError instanceof Error ? refreshError.message : 'Unknown error');
                    throw new Error("Не удалось обновить токен");
                }
            }

            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            console.error("Request failed:", errorMessage);
            throw new Error(errorMessage);
        }
    };

    const getFolderById = async (id: number, retry = true): Promise<Folder> => {
        try {
            return await fetchData({
                url: `${_baseUrl}/api/folders/${id}/`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Accept': 'application/json'
                }
            });
        } catch (error: unknown) {
            console.log("Ошибка:", error);

            const isUnauthorized = error instanceof Error &&
                error.message.includes("Could not validate credentials");

            if (isUnauthorized && retry) {
                try {
                    await refreshToken();
                    return await getFolderById(id, false);
                } catch (refreshError: unknown) {
                    console.error("Не удалось обновить токен:",
                        refreshError instanceof Error ? refreshError.message : 'Unknown error');
                    throw new Error("Не удалось обновить токен");
                }
            }

            const errorMessage = error instanceof Error ? error.message : 'Ошибка запроса';
            console.error("Ошибка запроса:", errorMessage);
            throw new Error(errorMessage);
        }
    };

    const createFolder = async (name: string, retry = true): Promise<Folder> => {
        try {
            if (!name?.trim()) {
                throw new Error("Название папки не может быть пустым");
            }

            const response = await fetch(`${_baseUrl}/api/folders/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name
                }),
                credentials: 'include' // если нужны куки
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Ошибка сервера:", errorData);

                // Создаем ошибку с дополнительной информацией
                const error = new Error(errorData.message || "Ошибка сервера");
                (error as any).response = response;
                (error as any).data = errorData;
                throw error;
            }

            return await response.json();
        } catch (error: any) {
            console.error("Ошибка при создании папки:", error);

            // Обработка ошибки валидации (422)
            if (error.response?.status === 422) {
                const errorDetails = error.data?.detail;
                if (Array.isArray(errorDetails)) {
                    throw new Error(errorDetails[0]?.msg || "Неверные данные для создания папки");
                }
                throw new Error("Некорректные данные. Проверьте введенные значения");
            }

            // Обработка ошибки авторизации (401)
            if (error.message.includes("Could not validate credentials") && retry) {
                try {
                    await refreshToken();
                    return await createFolder(name, false);
                } catch (refreshError) {
                    throw new Error("Сессия устарела. Пожалуйста, войдите снова");
                }
            }

            // Общая обработка других ошибок
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Неизвестная ошибка при создании папки");
        }
    };

    const createCard = async (
        folderId: number,
        description: string,
        imageFile: File,
        retry = true
    ): Promise<any> => {
        try {
            // Проверка входных данных
            if (!description?.trim()) {
                throw new Error("Описание карточки не может быть пустым");
            }
            if (!imageFile) {
                throw new Error("Необходимо выбрать изображение для карточки");
            }

            // Подготовка формы с изображением
            const formData = new FormData();
            formData.append('image', imageFile);

            // Формирование URL с параметром description
            const url = new URL(`${_baseUrl}/api/folders/${folderId}/`);
            url.searchParams.append('description', description);

            // Отправка запроса
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Accept': 'application/json',
                },
                body: formData,
                credentials: 'include'
            });

            // Обработка ошибок сервера
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Ошибка сервера:", errorData);

                const error = new Error(errorData.message || "Ошибка при создании карточки");
                (error as any).response = response;
                (error as any).data = errorData;
                throw error;
            }

            return await response.json();

        } catch (error: any) {
            console.error("Ошибка при создании карточки:", error);

            // Обработка ошибки валидации (422)
            if (error.response?.status === 422) {
                const errorDetails = error.data?.detail;
                if (Array.isArray(errorDetails)) {
                    throw new Error(errorDetails[0]?.msg || "Некорректные данные для карточки");
                }
                throw new Error("Проверьте введённые данные");
            }

            // Обработка ошибки авторизации (401)
            if (error.message.includes("Could not validate credentials") && retry) {
                try {
                    await refreshToken();
                    return await createCard(folderId, description, imageFile, false);
                } catch (refreshError) {
                    throw new Error("Сессия устарела. Пожалуйста, войдите снова");
                }
            }

            // Общая обработка других ошибок
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Неизвестная ошибка при создании карточки");
        }
    };

    // Вспомогательная функция для проверки типа ошибки API
    function isApiError(error: unknown): error is {
        response: {
            status: number;
            data: {
                detail?: Array<{ msg: string }>
            }
        }
    } {
        return typeof error === 'object' && error !== null && 'response' in error;
    }

    return { getFolders, getFolderById, createFolder, createCard };
};