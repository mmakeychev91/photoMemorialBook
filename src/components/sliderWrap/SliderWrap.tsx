// Импорт компонентов Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
// Импорт стилей Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import styles from "./SliderWrap.module.css";

const SliderWrap: React.FC = (): JSX.Element => {
  return (
    <Swiper
      // Подключение модулей
      modules={[A11y]}
      spaceBetween={50}
      slidesPerView={1}
      className={styles.swiper}
    >
      <SwiperSlide><img className={styles.img} src="/img/mock-slider-photo/001.jpg" alt="Фото слайдера" /></SwiperSlide>
      <SwiperSlide><img className={styles.img} src="/img/mock-slider-photo/002.jpg" alt="Фото слайдера" /></SwiperSlide>
      <SwiperSlide><img className={styles.img} src="/img/mock-slider-photo/003.jpg" alt="Фото слайдера" /></SwiperSlide>
      <SwiperSlide><img className={styles.img} src="/img/mock-slider-photo/004.jpg" alt="Фото слайдера" /></SwiperSlide>
    </Swiper>
  );
};

export default SliderWrap;  