import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import styles from "./slider.module.scss";
import type { Card, FoldersArray, Folder } from '../../types';
import _baseUrl from '../../urlConfiguration';
import { MenuOutlined, CloseOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { Button, Menu, Drawer, message, Spin, Modal, Form, Input, Upload } from 'antd';
import { useFoldersService } from '../../services/folders/foldersService';
import LogoutBtn from '../logoutBtn/logoutBtn';

interface Props {
  folders: FoldersArray;
  onCreateFolder: () => void;
  onEditFolder: (folderId: number) => void;
  onDeleteFolder: (folderId: number) => void;
  onAddCard: (folderId: number, afterAdd?: () => void) => void; // Добавляем колбэк
  loadFolder?: (folderId: number) => void;
}

interface FolderDetail extends Folder {
  cards: Card[];
}

const Slider: React.FC<Props> = ({ folders, onCreateFolder, onEditFolder, onDeleteFolder, onAddCard, }) => {
  const { getFolderById, updateCard } = useFoldersService();
  const swiperRef = useRef<SwiperType>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentCards, setCurrentCards] = useState<Card[]>([]);
  const [currentFolderName, setCurrentFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [editForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Находим папку с минимальным ID при первом рендере и при изменении folders
  useEffect(() => {
    if (folders.length > 0) {
      const folderWithMinId = folders.reduce((min, current) =>
        (current.id < min.id ? current : min),
        folders[0]
      );

      // Обновляем currentFolderName только если она не совпадает с первой папкой
      if (currentFolderName !== folderWithMinId.name) {
        loadFolder(folderWithMinId.id);
      }
    }
  }, [folders]); // Добавляем folders в зависимости

  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  const loadFolder = async (folderId: number) => {
    try {
      setLoading(true);
      const folderDetail = await getFolderById(folderId) as unknown as FolderDetail;
      setCurrentCards(folderDetail.cards || []);
      setCurrentFolderName(folderDetail.name);
      setCurrentFolderId(folderId); // Сохраняем ID текущей папки
    } catch (err) {
      console.error('Ошибка при загрузке папки', err);
      message.error('Не удалось загрузить данные папки');
      setCurrentCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmptyStateAddCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentFolderId) {
      onAddCard(currentFolderId, () => loadFolder(currentFolderId)); // Вызываем loadFolder после добавления
    }
  };

  // Находим активный элемент меню
  const activeMenuItemKey = folders.find(
    folder => folder.name === currentFolderName
  )?.id.toString();

  const menuItems = folders.map(folder => ({
    key: folder.id.toString(),
    label: (
      <div className={styles.menuItem}>
        <span>{folder.name}</span>
        <div className={styles.actions}>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onAddCard(folder.id, () => loadFolder(folder.id)); // Передаём колбэк
            }}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEditFolder(folder.id);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder.id);
            }}
          />
        </div>
      </div>
    ),
  }));

  // Обработчик клика по пункту меню
  const handleMenuClick = async ({ key }: { key: string }) => {
    const folderId = parseInt(key);
    await loadFolder(folderId);
    setMenuVisible(false);
  };

  // Обработчик клика по кнопке редактирования
  const handleEditCard = () => {
    if (swiperRef.current && currentCards.length > 0) {
      const activeIndex = swiperRef.current.activeIndex;
      const card = currentCards[activeIndex];
      setCurrentCard(card);
      editForm.setFieldsValue({
        description: card.description,
        image: [] // Очищаем загруженные файлы
      });
      setIsEditModalVisible(true);
    }
  };

  const handleUpdateCard = async () => {
    setIsSubmitting(true)
    try {
      const values = await editForm.validateFields();
      const imageFile = values.image?.[0]?.originFileObj;

      if (currentFolderId && currentCard) {
        await updateCard(
          currentFolderId,
          currentCard.id,
          values.description,
          imageFile
        );

        message.success('Карточка обновлена!');
        setIsEditModalVisible(false);
        loadFolder(currentFolderId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      message.error(`Ошибка обновления: ${errorMessage}`);
      console.error('Update error:', err);
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className={styles.wrap}>
      <Button
        icon={<EditOutlined />}
        className={styles.editCardButton}
        onClick={handleEditCard}
      />
      {/* Кнопка бургер-меню */}
      <Button
        type="text"
        icon={<MenuOutlined className={styles.burgerIcon} />}
        className={styles.burgerButton}
        onClick={() => setMenuVisible(true)}
      />

      {/* Полноэкранное меню */}
      <Drawer
        placement="right"
        onClose={() => setMenuVisible(false)}
        open={menuVisible}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
        width="100%"
        className={styles.fullscreenMenu}
      >
        <div className={styles.menuHeader}>
          <Button
            type="text"
            icon={<CloseOutlined />}
            className={styles.closeButton}
            onClick={() => setMenuVisible(false)}
          />
        </div>
        <Menu
          mode="vertical"
          items={menuItems}
          selectedKeys={activeMenuItemKey ? [activeMenuItemKey] : []}
          onClick={handleMenuClick}
          className={styles.menuContent}
        />
        <div className={styles.menuFooter}>
          <Button
            className={styles.createBtn}
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              onCreateFolder();
              setMenuVisible(false); // Закрываем меню после нажатия
            }}
          >
            Создать список
          </Button>
          <LogoutBtn />
        </div>
      </Drawer>

      {loading ? (
        <Spin tip="Загрузка..." fullscreen />
      ) : currentCards.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>Похоже, этот список не содержит карточек</p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleEmptyStateAddCard}
            className={styles.addButton}
          >
            Добавить
          </Button>
        </div>
      ) : (
        <Swiper
          modules={[A11y]}
          slidesPerView={1}
          onSwiper={(swiper: SwiperType) => swiperRef.current = swiper}
          className={styles.swiper}
          a11y={{
            prevSlideMessage: 'Предыдущий слайд',
            nextSlideMessage: 'Следующий слайд',
          }}
        >
          {currentCards.map((slide, index) => (
            <SwiperSlide key={index} className={styles.slide}>
              {slide.file_path && (
                <img
                  className={styles.img}
                  src={`${_baseUrl}/${slide.file_path}`}
                  alt={`Фото слайдера: ${slide.description || 'Без описания'}`}
                  loading="lazy"
                />
              )}
              {slide.description && (
                <div className={styles.text}>
                  <p>{slide.description}</p>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      {/* Модальное окно редактирования карточки */}
      <Modal
        title="Редактировать карточку"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsEditModalVisible(false);
              editForm.resetFields();
            }}
            disabled={isSubmitting}
          >
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleUpdateCard}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>,
        ]}
      >
        <Spin spinning={isSubmitting} tip="Обновление карточки...">
          <Form form={editForm} layout="vertical" disabled={isSubmitting}>
            <Form.Item
              name="description"
              label="Описание"
              rules={[
                { required: false, message: 'Введите описание' },
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
              label="Новая фотография"
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
    </div>
  );
};

export default Slider;