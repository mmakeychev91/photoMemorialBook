import React from "react";
import { Route, BrowserRouter, Routes, Navigate } from "react-router-dom";
import { AppRoute } from "../../const";
import StartPage from "../../pages/startPage/startPage";
import Auth from "../../pages/auth/auth";
import RootLayout from "./RootLayout";
import { ProtectRoutes } from "../../hooks/protectRoutes";

const App = (): JSX.Element => (
  <Routes>
    <Route path="/" element={<Navigate to="home" />} />
    <Route path="/login" element={<Auth />} />
    <Route element={<ProtectRoutes />}>
      <Route element={<RootLayout />}>
        <Route path="/home" element={<StartPage />}></Route>
      </Route>
    </Route>
  </Routes>
);

export default App;
