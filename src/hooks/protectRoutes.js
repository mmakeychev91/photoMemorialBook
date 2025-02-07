import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../services/authService';

export const ProtectRoutes = () => {
    const { token } = useAuth();

    return token ? <Outlet /> : <Navigate to="/login" exact />;
};