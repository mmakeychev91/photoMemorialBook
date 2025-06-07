import styles from './startPage.module.scss'
import { Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../../services/authService';
import { useFoldersService } from "../../services/folders/foldersService";
import React, { useEffect, useState } from "react";
import { Alert, Spin } from "antd";
import Slider from '../../components/slider/slider';
import type {Folder, FolderDetail} from '../../types'

const StartPage = (): JSX.Element => {
    const { getFolders, getFolderById } = useFoldersService();
    const { logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [firstFolderDetail, setFirstFolderDetail] = useState<FolderDetail | null>(null);
    const [hasFolders, setHasFolders] = useState(false);

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                setLoading(true);
                const foldersData = await getFolders();
                setFolders(foldersData);
                setHasFolders(foldersData.length > 0);
            } catch (err) {
                setError('Ошибка при загрузке данных');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFolders();
    }, []);

    useEffect(() => {
        if (folders.length > 0) {
            const folderWithMinId = folders.reduce((min, current) => 
                (current.id < min.id ? current : min), 
                folders[0]
            );
            
            const fetchMinFolder = async () => {
                try {
                    const firstFolderDetailData = await getFolderById(folderWithMinId.id);
                    setFirstFolderDetail(firstFolderDetailData);
                    console.log("Folder detail loaded:", firstFolderDetailData);
                } catch (err) {
                    console.error('Ошибка при загрузке папки', err);
                }
            };
            fetchMinFolder();
        }
    }, [folders]); // Зависимость от folders

    if (loading) {
        return <Spin tip="Загрузка..." fullscreen />;
    }

    if (error) {
        return <Alert message={error} type="error" />;
    }

    if (hasFolders) {
        console.log(firstFolderDetail?.cards)
        return <Slider cards={firstFolderDetail?.cards || []}></Slider>;
    }

    return (
        <div className="container">
            <div className={styles.startMessage}>
                <Button className={styles.logoutBtn}
                    icon={<LogoutOutlined />}
                    onClick={logout}
                >
                </Button>
                <h1>Добро пожаловать в фотопомянник!</h1>
                <p className={styles.text}>Похоже, у вас еще не создано ни одного списка. Создайте список, нажав на кнопку "Создать". </p>
                <Button className={styles.createBtn} type="primary">Создать</Button>
            </div>
        </div>
    );
}

export default StartPage;