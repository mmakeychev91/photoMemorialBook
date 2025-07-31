import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { A11y, Navigation } from 'swiper/modules';
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
import { Skeleton } from 'antd';

interface Props {
  folders: FoldersArray;
  onCreateFolder: () => void;
  onEditFolder: (folderId: number) => void;
  onDeleteFolder: (folderId: number) => void;
  onAddCard: (folderId: number, afterAdd?: () => void) => void;
  currentFolderId?: number;  // Делаем необязательным
  setCurrentFolderId: (id: number) => void;
}

interface FolderDetail extends Folder {
  cards: Card[];
}

const Slider: React.FC<Props> = ({ folders, onCreateFolder, onEditFolder, onDeleteFolder, onAddCard, currentFolderId, setCurrentFolderId }) => {
  const navigationPrevRef = useRef<HTMLButtonElement>(null);
  const navigationNextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperType>();


  const { getFolderById, updateCard, deleteCard } = useFoldersService();

  const [menuVisible, setMenuVisible] = useState(false);
  const [currentCards, setCurrentCards] = useState<Card[]>([]);
  const [currentFolderName, setCurrentFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [editForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (folders.length > 0 && currentFolderId) {
      // Загружаем текущую папку, если она существует
      if (folders.some(f => f.id === currentFolderId)) {
        loadFolder(currentFolderId);
      } else {
        // Если текущей папки нет (например, была удалена), загружаем первую
        loadFolder(folders[0].id);
        setCurrentFolderId(folders[0].id);
      }
    }
  }, [folders, currentFolderId]); // Зависимости

  const loadFolder = async (folderId: number) => {
    try {
      setLoading(true);
      const folderDetail = await getFolderById(folderId) as unknown as FolderDetail;
      const sortedCards = [...(folderDetail.cards || [])].sort((a, b) => a.id - b.id);

      // Добавляем folder_id к каждой карточке
      const cardsWithFolderId = sortedCards.map(card => ({
        ...card,
        folder_id: folderId
      }));

      setCurrentCards(cardsWithFolderId);
      setCurrentFolderName(folderDetail.name);
      setCurrentFolderId(folderId); // Обновляем currentFolderId

      setTimeout(() => {
        if (swiperRef.current) {
          swiperRef.current.slideTo(currentSlideIndex);
        }
      }, 0);
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

    // Определяем активную папку (из меню или из пропсов)
    const activeFolderId = activeMenuItemKey
      ? parseInt(activeMenuItemKey)
      : currentFolderId || folders[0]?.id;

    if (activeFolderId) {
      onAddCard(activeFolderId, () => loadFolder(activeFolderId));
    } else {
      message.error('Не найдена активная папка для добавления карточки');
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
              onAddCard(folder.id, () => loadFolder(folder.id)); // Передаём колбэк для обновления
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

  const handleDeleteCard = async () => {
    if (!currentCard || !currentFolderId) return;

    try {
      Modal.confirm({
        title: 'Удалить карточку?',
        content: 'Это действие нельзя отменить.',
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        onOk: async () => {
          await deleteCard(currentFolderId, currentCard.id);
          message.success('Карточка удалена!');

          // Обновляем список карточек
          const updatedCards = currentCards.filter(card => card.id !== currentCard.id);
          setCurrentCards(updatedCards);

          // Закрываем модальное окно
          setIsEditModalVisible(false);

          // Если карточек не осталось, показываем пустое состояние
          if (updatedCards.length === 0) {
            setCurrentSlideIndex(0);
          } else if (swiperRef.current) {
            // Возвращаемся к предыдущему слайду, если возможно
            swiperRef.current.slideTo(Math.min(currentSlideIndex, updatedCards.length - 1));
          }
        }
      });
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ошибка при удалении карточки');
      console.error(err);
    }
  };
  // Обработчик клика по пункту меню
  const handleMenuClick = async ({ key }: { key: string }) => {
    const folderId = parseInt(key);
    setCurrentSlideIndex(0); // Сбрасываем индекс при смене папки
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
    setIsSubmitting(true);
    try {
      const activeIndex = swiperRef.current?.activeIndex || 0;
      const values = await editForm.validateFields();
      const imageFile = values.image?.[0]?.originFileObj;

      if (!currentCard) {
        throw new Error('Карточка не выбрана');
      }

      // Используем folder_id из текущей карточки
      const folderId = currentCard.folder_id;

      if (folderId && currentCard) {
        const updatedCard = await updateCard(
          folderId,
          currentCard.id,
          values.description,
          imageFile
        );

        message.success('Карточка обновлена!');
        setIsEditModalVisible(false);

        // Обновляем только измененную карточку, сохраняя порядок
        setCurrentCards(prevCards =>
          prevCards.map(card =>
            card.id === currentCard.id
              ? { ...card, ...updatedCard, folder_id: folderId } // Сохраняем folder_id
              : card
          )
        );

        // Возвращаемся на тот же слайд
        setTimeout(() => {
          if (swiperRef.current) {
            swiperRef.current.slideTo(activeIndex);
          }
        }, 0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      message.error(`Ошибка обновления: ${errorMessage}`);
      console.error('Update error:', err);
    } finally {
      setIsSubmitting(false);
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


        <div className={styles.skeletonWrapper}>
          <div className={styles.skeletonSlide}>
            <Skeleton.Image active className={styles.skeletonImage} />
          </div>
        </div>

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
        <div className={styles.swiperContainer}>
          <Swiper
            modules={[A11y, Navigation]}
            slidesPerView={1}
            onSwiper={(swiper: SwiperType) => swiperRef.current = swiper}
            // @ts-ignore
            onSlideChange={(swiper) => setCurrentSlideIndex(swiper.activeIndex)}
            className={styles.swiper}
            a11y={{
              prevSlideMessage: 'Предыдущий слайд',
              nextSlideMessage: 'Следующий слайд',
            }}
            navigation={{
              prevEl: navigationPrevRef.current,
              nextEl: navigationNextRef.current,
              disabledClass: styles.swiperButtonDisabled,
            }}
          >
            {currentCards.map((slide, index) => (
              <SwiperSlide key={index} className={styles.slide}>
                {slide.file_path && (
                  <img
                    className={styles.img}
                    src={`${_baseUrl}/${slide.file_path}`}
                    alt={`Загрузка фото...`}
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
          {/* Кастомные кнопки навигации */}
          {/* Кастомные кнопки навигации */}
          <div className={styles.swiperNavigation}>
            <button
              ref={navigationPrevRef}
              className={`${styles.swiperButton} ${styles.swiperButtonPrev}`}
            >
              &lt;
            </button>
            <button
              ref={navigationNextRef}
              className={`${styles.swiperButton} ${styles.swiperButtonNext}`}
            >
              &gt;
            </button>
          </div>
        </div>

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
          ,
          <Button
            key="cancel"
            onClick={() => {
              setIsEditModalVisible(false);
              editForm.resetFields();
            }}
            disabled={isSubmitting}
            className={styles.cancelEditCardBtn}
          >
            Отмена
          </Button>,
          <Button
            key="delete"
            danger
            onClick={handleDeleteCard}
            disabled={isSubmitting}
          >
            Удалить
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
        className={styles.editCardModal}
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