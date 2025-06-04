import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../services/authService';

export const ProtectRoutes = () => {
    const { token } = useAuth();
    console.log('ProtectRoutes token check:', token); // debug
    
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};