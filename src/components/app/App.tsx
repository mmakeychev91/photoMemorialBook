import { Route, Routes, Navigate } from "react-router-dom";
import StartPage from "../../pages/startPage/startPage";
import Auth from "../../pages/auth/auth";
import Register from "../../pages/register/register"; 
import RootLayout from "./RootLayout";
import { ProtectRoutes } from "../../hooks/protectRoutes";
import { useFoldersService } from "../../services/folders/foldersService";
import React, { useEffect, useState } from "react";

const App = (): JSX.Element => {
  useEffect(() => {
    // Функция для обновления --vh
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Устанавливаем начальное значение
    updateViewportHeight();

    // Добавляем обработчик ресайза
    window.addEventListener('resize', updateViewportHeight);

    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="home" />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Register />} /> {/* Добавляем маршрут регистрации */}
      <Route element={<ProtectRoutes />}>
        <Route element={<RootLayout />}>
          <Route path="/home" element={<StartPage />}></Route>
        </Route>
      </Route>
    </Routes>
  )
};

export default App;