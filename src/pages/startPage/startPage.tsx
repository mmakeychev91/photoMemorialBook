import styles from './startPage.module.scss';
import { Button, Modal, Form, Input, message, Spin, Alert, Upload } from 'antd';
import { useFoldersService } from "../../services/folders/foldersService";
import React, { useEffect, useState, useRef } from "react";
import Slider from '../../components/slider/slider';
import type { Folder } from '../../types';
import LogoutBtn from '../../components/logoutBtn/logoutBtn';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../services/authService'; // Импортируем хук аутентификации
import EmailConfirmationModal from '../../components/EmailConfirmationModal/EmailConfirmationModal'; // Компонент для подтверждения email

const StartPage = (): JSX.Element => {
    const { getFolders, createFolder, createCard, deleteFolder, updateFolder } = useFoldersService();
    const { userInfo, isEmailConfirmed, sendEmailConfirmCode, confirmEmailByCode } = useAuth(); // Получаем информацию о пользователе
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCardModalVisible, setIsCardModalVisible] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [cardForm] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditFolderModalVisible, setIsEditFolderModalVisible] = useState(false);
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [editFolderForm] = Form.useForm();
    const [isUpdatingFolder, setIsUpdatingFolder] = useState(false);
    const [isEmailModalVisible, setIsEmailModalVisible] = useState(false); // Состояние для модалки подтверждения email


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

    // Показываем модалку подтверждения email, если пользователь не подтвердил почту
    useEffect(() => {
        if (userInfo && !isEmailConfirmed) {
            setIsEmailModalVisible(true);
        }
    }, [userInfo, isEmailConfirmed]);

    // Добавляем эффект для установки начальной папки
    useEffect(() => {
        if (folders.length > 0) {
            if (!currentFolderId || !folders.some(f => f.id === currentFolderId)) {
                setCurrentFolderId(folders[0].id);
            }
        }
    }, [folders, currentFolderId]);


    // Добавляем эффект для установки начальной папки
    useEffect(() => {
        if (folders.length > 0) {
            // Если currentFolderId не установлен или не существует в folders, устанавливаем первую папку
            if (!currentFolderId || !folders.some(f => f.id === currentFolderId)) {
                setCurrentFolderId(folders[0].id);
            }
        }
    }, [folders, currentFolderId]);

    const handleEditFolder = async (folderId: number) => {
        try {
            setCurrentFolderId(folderId); // Используем локальный setter
            const folderToEdit = folders.find(folder => folder.id === folderId);
            if (folderToEdit) {
                setEditingFolder(folderToEdit);
                editFolderForm.setFieldsValue({ name: folderToEdit.name });
                setIsEditFolderModalVisible(true);
            }
        } catch (err) {
            message.error('Не удалось загрузить данные списка для редактирования');
            console.error(err);
        }
    };

    const handleUpdateFolder = async () => {
        setIsUpdatingFolder(true);
        try {
            const values = await editFolderForm.validateFields();
            if (!editingFolder) return;

            const updatedFolder = await updateFolder(editingFolder.id, values.name);

            message.success(`Название изменилось!`);
            setFolders(prev =>
                prev.map(folder =>
                    folder.id === updatedFolder.id ? updatedFolder : folder
                )
            );

            // Не сбрасываем currentFolderId, остаемся на той же папке
            editFolderForm.resetFields();
            setIsEditFolderModalVisible(false);
        } catch (err) {
            if (err instanceof Error) {
                message.error(err.message);
            } else {
                message.error("Не удалось обновить список");
                console.error("Unknown error:", err);
            }
        } finally {
            setIsUpdatingFolder(false);
        }
    };

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

    const handleDeleteFolder = async (folderId: number) => {
        try {
            Modal.confirm({
                title: 'Удалить список?',
                content: 'Все карточки в этом списке также будут удалены. Это действие нельзя отменить.',
                okText: 'Удалить',
                okType: 'danger',
                cancelText: 'Отмена',
                onOk: async () => {
                    try {
                        await deleteFolder(folderId);
                        message.success('Список успешно удалён');

                        const updatedFolders = await getFolders();
                        setFolders(updatedFolders);
                    } catch (err) {
                        message.error(err instanceof Error ? err.message : 'Ошибка при удалении списка');
                        console.error(err);
                    }
                }
            });
        } catch (err) {
            console.error('Ошибка при удалении папки:', err);
        }
    };

    const afterAddCallback = useRef<(() => void) | null>(null);

    const handleAddCard = (folderId: number, afterAdd?: () => void) => {
        setCurrentFolderId(folderId); // Устанавливаем текущую папку
        setIsCardModalVisible(true);
        afterAddCallback.current = afterAdd || null;
    };

    const handleCreateCard = async () => {
        setIsSubmitting(true);
        try {
            const values = await cardForm.validateFields();

            if (currentFolderId) {
                const imageFile = values.image?.[0]?.originFileObj;
                await createCard(currentFolderId, values.description, imageFile);

                message.success('Карточка добавлена!');
                cardForm.resetFields();
                setIsCardModalVisible(false);

                // После добавления карточки:
                // 1. Обновляем папки (если нужно)
                const updatedFolders = await getFolders();
                setFolders(updatedFolders);

                // 2. Вызываем колбэк (если он передан в Slider)
                if (afterAddCallback.current) {
                    afterAddCallback.current();
                }
            }
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Ошибка при создании карточки');
            console.error(err);
        } finally {
            setIsSubmitting(false);
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
                        onEditFolder={handleEditFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onAddCard={handleAddCard}
                        folders={folders}
                        onCreateFolder={() => setIsModalVisible(true)}
                        currentFolderId={currentFolderId ?? undefined}
                        setCurrentFolderId={setCurrentFolderId}
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

            {/* Модальное окно добавления карточки */}
            <Modal
                title={`Добавить карточку в список`}
                open={isCardModalVisible}
                onCancel={() => {
                    setIsCardModalVisible(false);
                    cardForm.resetFields();
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setIsCardModalVisible(false);
                            cardForm.resetFields();
                        }}
                        disabled={isSubmitting}
                    >
                        Отмена
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleCreateCard}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Добавление...' : 'Добавить'}
                    </Button>,
                ]}
            >
                <Spin spinning={isSubmitting} tip="Добавление карточки...">
                    <Form form={cardForm} layout="vertical" disabled={isSubmitting}>
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
                                disabled={isSubmitting}
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
                                beforeUpload={() => false}
                                maxCount={1}
                                accept="image/*"
                                disabled={isSubmitting}
                            >
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Загрузить</div>
                                </div>
                            </Upload>
                        </Form.Item>
                    </Form>
                </Spin>
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
            {/* Edit Folder Modal */}
            <Modal
                title="Редактировать список"
                open={isEditFolderModalVisible}
                onCancel={() => {
                    setIsEditFolderModalVisible(false);
                    editFolderForm.resetFields();
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setIsEditFolderModalVisible(false);
                            editFolderForm.resetFields();
                        }}
                    >
                        Отмена
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleUpdateFolder}
                        loading={isUpdatingFolder}
                    >
                        {isUpdatingFolder ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                ]}
            >
                <Form form={editFolderForm} layout="vertical">
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
            {/* Модальное окно подтверждения email */}
            <EmailConfirmationModal
                visible={isEmailModalVisible}
                onCancel={() => setIsEmailModalVisible(false)}
                onSendCode={sendEmailConfirmCode}
                onConfirm={confirmEmailByCode}
            />

            {/* ... остальные модальные окна ... */}
        </>
    );
}

export default StartPage;