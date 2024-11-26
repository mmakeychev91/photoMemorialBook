import React from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { AppRoute } from "../../../const";
import StartPage from "../../../pages/startPage/startPage";
import AboutHealth from "../../../pages/aboutHealth/aboutHealth";

const App = (): JSX.Element => (
  <BrowserRouter>
    <Routes>
      <Route path={AppRoute.Main} element={<StartPage />} />
      <Route path={AppRoute.AboutHealth} element={<AboutHealth />} />
    </Routes>
  </BrowserRouter>
);

export default App;
