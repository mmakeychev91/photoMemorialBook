import React from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { AppRoute } from "../../const";
import StartPage from "../../pages/startPage/startPage";

const App = (): JSX.Element => (
  <BrowserRouter>
    <Routes>
      <Route path={AppRoute.Main} element={<StartPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
