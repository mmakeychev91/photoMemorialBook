import styles from './startPage.module.scss';
import { Button, Modal, Form, Input, message, Spin, Alert } from 'antd';
import { useFoldersService } from "../../services/folders/foldersService";
import React, { useEffect, useState } from "react";
import Slider from '../../components/slider/slider';
import type { Folder } from '../../types';
import LogoutBtn from '../../components/logoutBtn/logoutBtn';
import { PlusOutlined } from '@ant-design/icons';

const StartPage = (): JSX.Element => {
    const { getFolders, createFolder } = useFoldersService();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                setLoading(true);
                const foldersData = await getFolders();
                setFolders(foldersData);
            } catch (err) {
                setError('Ошибка при загрузке данных');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFolders();
    }, []);

    const handleCreateFolder = async () => {
        try {
            const values = await form.validateFields();
            const newFolder = await createFolder(values.name);

            message.success(`Список "${newFolder.name}" создан!`);
            setFolders(prev => [...prev, newFolder]);
            form.resetFields();
            setIsModalVisible(false);
        } catch (err) {
            if (err instanceof Error) {
                message.error(err.message);
            } else {
                message.error("Не удалось создать список");
                console.error("Unknown error:", err);
            }
        }
    };

    if (loading) {
        return <Spin tip="Загрузка..." fullscreen />;
    }

    if (error) {
        return <Alert message={error} type="error" />;
    }

    return (
        <>
            {folders.length > 0 ? (
                <>
                    <Slider folders={folders} onCreateFolder={() => setIsModalVisible(true)} />
                </>
            ) : (
                <div className={styles.startMessage}>
                    <h1>Добро пожаловать в фотопомянник!</h1>
                    <p className={styles.text}>
                        Похоже, у вас еще не создано ни одного списка.
                        Создайте список, нажав на кнопку ниже.
                    </p>

                    <Button
                        className={styles.createBtn}
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                    >
                        Создать список
                    </Button>
                    <LogoutBtn />
                </div>
            )}

            

            {/* Модальное окно создания папки */}
            <Modal
                title="Создать новый список"
                open={isModalVisible}
                onOk={handleCreateFolder}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                okText="Создать"
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Название списка"
                        rules={[
                            { required: true, message: 'Введите название' },
                            { min: 2, message: 'Минимум 2 символа' },
                            { max: 50, message: 'Максимум 50 символов' }
                        ]}
                    >
                        <Input placeholder="Например: Родственники" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

export default StartPage;