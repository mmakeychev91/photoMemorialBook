import { Route, Routes, Navigate } from "react-router-dom";
import StartPage from "../../pages/startPage/startPage";
import Auth from "../../pages/auth/auth";
import Register from "../../pages/register/register"; 
import RootLayout from "./RootLayout";
import { ProtectRoutes } from "../../hooks/protectRoutes";
import PrivacyPolicy from "../../pages/legal/PrivacyPolicy/PrivacyPolicy";
import UserAgreement from "../../pages/legal/UserAgreement/UserAgreement";
import DataProcessingAgreement from "../../pages/legal/DataProcessingAgreement/DataProcessingAgreement";
import React, { useEffect } from "react";

const App = (): JSX.Element => {
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="home" />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Register />} />
      
      {/* Маршруты для юридических документов */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/user-agreement" element={<UserAgreement />} />
      <Route path="/data-processing-agreement" element={<DataProcessingAgreement />} />
      
      <Route element={<ProtectRoutes />}>
        <Route element={<RootLayout />}>
          <Route path="/home" element={<StartPage />}></Route>
        </Route>
      </Route>
    </Routes>
  )
};

export default App;