// Импорт компонентов Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { A11y } from 'swiper/modules';
// Импорт стилей Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import styles from "./slider.module.scss";
import type { Cards } from '../../types'
import _baseUrl from '../../urlConfiguration';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { Button, Menu, Drawer } from 'antd';

const Slider: React.FC<Cards> = ({ cards }): JSX.Element => {
  const swiperRef = useRef<SwiperType>();
  const [menuVisible, setMenuVisible] = useState(false);

  // Меню для бургера
  const menuItems = [
    { key: '1', label: 'Главная' },
    { key: '2', label: 'О нас' },
    { key: '3', label: 'Контакты' },
  ];

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
          className={styles.menuContent}
        />
      </Drawer>

      <Swiper
        spaceBetween={50}
        slidesPerView={1}
        scrollbar={{ draggable: true }}
        className={styles.swiper}
      >
        {cards.map((slide, index) => (
          <SwiperSlide key={index} className={styles.slide}>
            <img
              className={styles.img}
              src={`${_baseUrl}/${slide.file_path}`}
              alt={`Фото слайдера: ${slide.description}`}
            />
            {slide.description && (
              <div className={styles.text}>
                <p>{slide.description}</p>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Slider;