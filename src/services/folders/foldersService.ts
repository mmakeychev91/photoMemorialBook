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

    const deleteCard = async (
        folderId: number,
        cardId: number,
        retry = true
    ): Promise<void> => {
        try {
            if (!folderId || !cardId) {
                throw new Error("Не указан ID папки или карточки");
            }
    
            const response = await fetch(`${_baseUrl}/api/folders/${folderId}/card/${cardId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Accept': 'application/json',
                },
                credentials: 'include'
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Ошибка сервера:", errorData);
    
                // Создаем кастомную ошибку с response
                const error = new Error(errorData.message || "Ошибка при удалении карточки") as ApiError;
                error.response = {
                    status: response.status,
                    data: errorData
                };
                throw error;
            }
    
            // Для DELETE запроса может не быть тела ответа
            if (response.status !== 204) {
                await response.json();
            }
        } catch (error: unknown) {
            console.error("Ошибка при удалении карточки:", error);
    
            // Проверяем тип ошибки
            if (isApiError(error)) {
                // Обработка ошибки "Не найдено" (404)
                if (error.response.status === 404) {
                    throw new Error("Карточка не найдена");
                }
    
                // Обработка ошибки авторизации (401)
                if (error.response.status === 401 && retry) {
                    try {
                        await refreshToken();
                        // Получаем новый токен и повторяем запрос
                        const newToken = getAccessToken();
                        if (!newToken) {
                            throw new Error("Не удалось получить новый токен");
                        }
                        return await deleteCard(folderId, cardId, false);
                    } catch (refreshError) {
                        throw new Error("Сессия устарела. Пожалуйста, войдите снова");
                    }
                }
            }
    
            // Проверяем сообщение об ошибке для случая, когда нет response
            if (error instanceof Error && error.message.includes("Could not validate credentials") && retry) {
                try {
                    await refreshToken();
                    return await deleteCard(folderId, cardId, false);
                } catch (refreshError) {
                    throw new Error("Сессия устарела. Пожалуйста, войдите снова");
                }
            }
    
            // Проброс оригинальной ошибки
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Неизвестная ошибка при удалении карточки");
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
        imageFile?: File,  // Сделали необязательным
        retry = true
    ): Promise<any> => {
        try {
            // Проверка входных данных (только description обязателен)
            if (!description?.trim()) {
                throw new Error("Описание карточки не может быть пустым");
            }

            // Подготовка формы (только если есть изображение)
            const formData = new FormData();
            if (imageFile) {
                formData.append('image', imageFile);
            }

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
                body: imageFile ? formData : undefined,  // Отправляем formData только если есть изображение
                credentials: 'include'
            });

            // Остальной код обработки ответа остаётся без изменений
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

            if (error.response?.status === 422) {
                const errorDetails = error.data?.detail;
                if (Array.isArray(errorDetails)) {
                    throw new Error(errorDetails[0]?.msg || "Некорректные данные для карточки");
                }
                throw new Error("Проверьте введённые данные");
            }

            if (error.message.includes("Could not validate credentials") && retry) {
                try {
                    await refreshToken();
                    return await createCard(folderId, description, imageFile, false);
                } catch (refreshError) {
                    throw new Error("Сессия устарела. Пожалуйста, войдите снова");
                }
            }

            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Неизвестная ошибка при создании карточки");
        }
    };

    const deleteFolder = async (folderId: number, retry = true): Promise<void> => {
        try {
            if (!folderId) {
                throw new Error("ID папки не может быть пустым");
            }

            const response = await fetch(`${_baseUrl}/api/folders/${folderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Accept': 'application/json',
                },
                credentials: 'include' // если нужны куки
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Ошибка сервера:", errorData);

                // Создаем ошибку с дополнительной информацией
                const error = new Error(errorData.message || "Ошибка при удалении папки");
                (error as any).response = response;
                (error as any).data = errorData;
                throw error;
            }

            // Для DELETE запроса может не быть тела ответа
            if (response.status !== 204) {
                return await response.json();
            }
        } catch (error: any) {
            console.error("Ошибка при удалении папки:", error);

            // Обработка ошибки валидации (422)
            if (error.response?.status === 422) {
                const errorDetails = error.data?.detail;
                if (Array.isArray(errorDetails)) {
                    throw new Error(errorDetails[0]?.msg || "Неверные данные для удаления папки");
                }
                throw new Error("Некорректные данные. Проверьте введенные значения");
            }

            // Обработка ошибки "Не найдено" (404)
            if (error.response?.status === 404) {
                throw new Error("Папка не найдена");
            }

            // Обработка ошибки авторизации (401)
            if (error.message.includes("Could not validate credentials") && retry) {
                try {
                    await refreshToken();
                    return await deleteFolder(folderId, false);
                } catch (refreshError) {
                    throw new Error("Сессия устарела. Пожалуйста, войдите снова");
                }
            }

            // Общая обработка других ошибок
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Неизвестная ошибка при удалении папки");
        }
    };

    const updateCard = async (
        folderId: number,
        cardId: number,
        description?: string,
        imageFile?: File,
        retry = true
    ): Promise<any> => {
        try {
            // Проверка входных данных
            if (!description?.trim() && !imageFile) {
                throw new Error("Необходимо указать новое описание или изображение");
            }

            // Формируем URL
            const url = new URL(`${_baseUrl}/api/folders/${folderId}/card/${cardId}`);
            if (description?.trim()) {
                url.searchParams.append('description', description);
            }

            // Подготавливаем FormData для изображения
            const formData = new FormData();
            if (imageFile) {
                formData.append('image', imageFile);
            }

            // Получаем токен
            const token = getAccessToken();
            if (!token) {
                throw new Error("Токен доступа не найден");
            }

            // Отправляем запрос
            const response = await fetch(url.toString(), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: imageFile ? formData : undefined,
                credentials: 'include'
            });

            // Обрабатываем ответ
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `Ошибка ${response.status}`;
                const error = new Error(errorMessage);
                (error as any).response = response;
                throw error;
            }

            return await response.json();

        } catch (error: unknown) {
            console.error("Ошибка при обновлении карточки:", error);

            // Обработка ошибки авторизации
            const isUnauthorized = error instanceof Error &&
                (error.message.includes("Could not validate credentials") ||
                    (error as any).response?.status === 401);

            if (isUnauthorized && retry) {
                try {
                    await refreshToken();
                    // Получаем новый токен и повторяем запрос
                    const newToken = getAccessToken();
                    if (!newToken) {
                        throw new Error("Не удалось получить новый токен");
                    }
                    return await updateCard(folderId, cardId, description, imageFile, false);
                } catch (refreshError: unknown) {
                    console.error("Не удалось обновить токен:",
                        refreshError instanceof Error ? refreshError.message : 'Unknown error');
                    throw new Error("Сессия устарела. Пожалуйста, войдите снова");
                }
            }

            // Проброс оригинальной ошибки
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Неизвестная ошибка при обновлении карточки");
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

    return { getFolders, getFolderById, createFolder, createCard, deleteFolder, updateCard, deleteCard };
};