import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import styles from "./slider.module.scss";
import type { Card, FoldersArray, Folder } from '../../types';
import _baseUrl from '../../urlConfiguration';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { Button, Menu, Drawer } from 'antd';
import { useFoldersService } from '../../services/folders/foldersService';

interface Props {
  folders: FoldersArray;
}

const Slider: React.FC<Props> = ({ folders }) => {
  const { getFolderById } = useFoldersService();
  const swiperRef = useRef<SwiperType>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentCards, setCurrentCards] = useState<Card[]>([]);
  const [currentFolderName, setCurrentFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  // Находим папку с минимальным ID при первом рендере
  useEffect(() => {
    if (folders.length > 0) {
      const folderWithMinId = folders.reduce((min, current) => 
        (current.id < min.id ? current : min), 
        folders[0]
      );
      loadFolder(folderWithMinId.id);
    }
  }, [folders]);

  const loadFolder = async (folderId: number) => {
    try {
      setLoading(true);
      const folderDetail = await getFolderById(folderId);
      setCurrentCards(folderDetail.cards);
      setCurrentFolderName(folderDetail.name);
    } catch (err) {
      console.error('Ошибка при загрузке папки', err);
    } finally {
      setLoading(false);
    }
  };

  // Находим активный элемент меню
  const activeMenuItemKey = folders.find(
    folder => folder.name === currentFolderName
  )?.id.toString();

  // Преобразуем папки в элементы меню
  const menuItems = folders.map(folder => ({
    key: folder.id.toString(),
    label: folder.name
  }));

  // Обработчик клика по пункту меню
  const handleMenuClick = async ({ key }: { key: string }) => {
    const folderId = parseInt(key);
    await loadFolder(folderId);
    setMenuVisible(false);
  };

  return (
    <div className={styles.wrap}>
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
        visible={menuVisible}
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
      </Drawer>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <Swiper
          spaceBetween={50}
          slidesPerView={1}
          scrollbar={{ draggable: true }}
          className={styles.swiper}
        >
          {currentCards.map((slide, index) => (
            <SwiperSlide key={index} className={styles.slide}>
              {slide.file_path && (
                <img
                  className={styles.img}
                  src={`${_baseUrl}/${slide.file_path}`}
                  alt={`Фото слайдера: ${slide.description || 'Без описания'}`}
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
    </div>
  );
};

export default Slider;