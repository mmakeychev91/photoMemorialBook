import {
    createContext,
    useContext,
    useMemo,
    useEffect,
    useState,
} from 'react';
import {
    useNavigate,
} from 'react-router-dom';

import _baseUrl from '../urlConfiguration';
import {
    useHttp,
} from '../hooks/http.hook';
import useToken from '../hooks/useToken/useToken';
import { TOKEN_REFRESH_THRESHOLD } from '../const';
import { TOKEN_EXPRES_IN } from '../const';
import { errorSetter } from '../pages/auth/auth';

const UserContext = createContext();

export const UserProvider = ({
    children,
}) => {

    const {
        fetchData,
    } = useHttp();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const { token, setToken, removeToken } = useToken();
    const tokenExpirationTime = TOKEN_EXPRES_IN || 0;
    const timeout = tokenExpirationTime - TOKEN_REFRESH_THRESHOLD;
    const login = async ({
        username,
        password,
    }) => {

        try {
            const result = await fetchData({
                url: `${_baseUrl}/v1/auth/login`,
                method: 'POST',
                data: {
                    login: username,
                    password: password,
                },
            });
            setToken(result.access_token); // your token
            navigate('/');
            setIsLogin(true);
        } catch (error) {
            errorSetter('Неверный логин или пароль');
        }




    };

    const getNewToken = async (oldToken) => {
        try {
            const result = await fetchData({
                url: `${_baseUrl}/v1/auth/refresh`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${oldToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return result.access_token;
        } catch (error) {
            removeToken();
            window.location.reload(false);
            navigate('/login');
            return null;
        }
    };
    const refreshToken = async () => {
        const oldToken = token;

        if (oldToken) {

            const newToken = await getNewToken(oldToken);
            if (newToken) {
                setToken(newToken);

                return newToken;
            } else {
                removeToken();
                window.location.reload(false);
                navigate('/login');
            }
        }

    };

    useEffect(() => {
        const timer = setTimeout(refreshToken, timeout * 1000);
        return () => clearTimeout(timer);

    }, [token]);


    const value = useMemo(
        () => ({
            token,
            login,
        }),
        [token]

    );
    return (<
        UserContext.Provider value={
            value
        } > {
            children
        } </ UserContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(UserContext);
};