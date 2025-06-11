import styles from './startPage.module.scss';
import { Button, Modal, Form, Input, message, Spin, Alert, Upload } from 'antd';
import { useFoldersService } from "../../services/folders/foldersService";
import React, { useEffect, useState, useRef } from "react";
import Slider from '../../components/slider/slider';
import type { Folder } from '../../types';
import LogoutBtn from '../../components/logoutBtn/logoutBtn';
import { PlusOutlined } from '@ant-design/icons';

const StartPage = (): JSX.Element => {
    const { getFolders, createFolder, createCard } = useFoldersService();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCardModalVisible, setIsCardModalVisible] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [cardForm] = Form.useForm();

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

    const handleAddCard = (folderId: number, afterAdd?: () => void) => {
        setCurrentFolderId(folderId);
        setIsCardModalVisible(true);
        // Если передан колбэк, сохраняем его
        if (afterAdd) {
            afterAddCallback.current = afterAdd;
        }
    };
    // Используем useRef для сохранения колбэка
    const afterAddCallback = useRef<(() => void) | null>(null);

    const handleCreateCard = async () => {
        try {
          const values = await cardForm.validateFields();
      
          if (currentFolderId) {
            const imageFile = values.image?.[0]?.originFileObj;
            await createCard(currentFolderId, values.description, imageFile);
      
            message.success('Карточка добавлена!');
            cardForm.resetFields();
            setIsCardModalVisible(false);
      
            // Вызываем колбэк после успешного добавления
            if (afterAddCallback.current) {
              afterAddCallback.current();
              afterAddCallback.current = null; // Очищаем колбэк
            }
          }
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Ошибка при создании карточки');
          console.error(err);
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
                    <Slider
                        onEditFolder={(folderId) => console.log('Edit folder:', folderId)}
                        onDeleteFolder={(folderId) => console.log('Delete folder:', folderId)}
                        onAddCard={handleAddCard}
                        folders={folders}
                        onCreateFolder={() => setIsModalVisible(true)}
                    />
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
            {/* Модальное окно создания карточки */}
            <Modal
                title={`Добавить карточку в список`}
                open={isCardModalVisible}
                onOk={handleCreateCard}
                onCancel={() => {
                    setIsCardModalVisible(false);
                    cardForm.resetFields();
                }}
                okText="Добавить"
                cancelText="Отмена"
            >
                <Form form={cardForm} layout="vertical">
                    <Form.Item
                        name="description"
                        label="Описание"
                        rules={[
                            { required: true, message: 'Введите описание' },
                            { min: 2, message: 'Минимум 2 символа' },
                            { max: 100, message: 'Максимум 100 символов' }
                        ]}
                    >
                        <Input.TextArea
                            placeholder="Например: Алексея"
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label="Фотография (необязательно)"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => e.fileList}
                    >
                        <Upload
                            listType="picture-card"
                            beforeUpload={() => false} // Отменяем автоматическую загрузку
                            maxCount={1}
                            accept="image/*"
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Загрузить</div>
                            </div>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>



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
                            { max: 15, message: 'Максимум 15 символов' }
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