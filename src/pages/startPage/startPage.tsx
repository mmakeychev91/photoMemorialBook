import styles from './startPage.module.scss'
import { Button } from 'antd';
import { useFoldersService } from "../../services/folders/foldersService";
import React, { useEffect, useState } from "react";
import { Alert, Spin } from "antd";
import Slider from '../../components/slider/slider';
import type { Folder } from '../../types'
import LogoutBtn from '../../components/logoutBtn/logoutBtn';

const StartPage = (): JSX.Element => {
    const { getFolders } = useFoldersService();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
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

    if (loading) {
        return <Spin tip="Загрузка..." fullscreen />;
    }

    if (error) {
        return <Alert message={error} type="error" />;
    }

    if (hasFolders) {
        return <Slider folders={folders} />;
    }

    return (
        <div className="container">
            <div className={styles.startMessage}>
                <h1>Добро пожаловать в фотопомянник!</h1>
                <p className={styles.text}>Похоже, у вас еще не создано ни одного списка. Создайте список, нажав на кнопку "Создать". </p>
                <Button className={styles.createBtn} type="primary">Создать</Button>
                <LogoutBtn/>
            </div>
        </div>
    );
}

export default StartPage;