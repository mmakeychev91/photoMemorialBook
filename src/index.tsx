import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/montserrat"; // Подключает обычный вес
import "@fontsource/montserrat/500.css"; // Подключает вес 500
import "@fontsource/montserrat/700.css"; // Подключает вес 700
import { BrowserRouter } from "react-router-dom";
import AppProvider from "./hooks/AppProvider";
import App from "./components/app/App";
import "antd/dist/reset.css";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
