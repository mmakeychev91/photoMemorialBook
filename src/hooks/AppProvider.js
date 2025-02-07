import { UserProvider } from '../services/authService';

const AppProvider = ({ children }) => (
    <>
        <UserProvider>{children}</UserProvider>
    </>
);

export default AppProvider;