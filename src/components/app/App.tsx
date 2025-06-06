import { Route, Routes, Navigate } from "react-router-dom";
import StartPage from "../../pages/startPage/startPage";
import Auth from "../../pages/auth/auth";
import RootLayout from "./RootLayout";
import { ProtectRoutes } from "../../hooks/protectRoutes";
import { useFoldersService } from "../../services/folders/foldersService";
import React, { useEffect, useState } from "react";

const App = (): JSX.Element => {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="home" />} />
      <Route path="/login" element={<Auth />} />
      <Route element={<ProtectRoutes />}>
        <Route element={<RootLayout />}>
          <Route path="/home" element={<StartPage />}></Route>
        </Route>
      </Route>
    </Routes>
  )
};

export default App;
