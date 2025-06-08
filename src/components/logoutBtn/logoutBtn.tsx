import styles from './logoutBtn.module.scss'
import { Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../../services/authService';

const LogoutBtn: React.FC = () => {
    const { logout } = useAuth();

    return (
        <Button className={styles.logoutBtn}
            icon={<LogoutOutlined />}
            onClick={logout}
        >Выйти
        </Button>
    );
};

export default LogoutBtn;