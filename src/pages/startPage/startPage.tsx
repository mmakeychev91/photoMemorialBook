import React from "react";
import { Link } from "react-router-dom";
import { Button } from "antd";
import { AppRoute } from "../../const";
import styles from "./startPage.module.css";

const StartPage = (): JSX.Element => (
  <div className="container">
    <div className={styles.startPageButtonsWrap}>
      <Link className={styles.button} to={AppRoute.AboutHealth}>
        О здравии
      </Link>

      <Link className={styles.button} to={AppRoute.AboutRepose}>
        Об упокоении
      </Link>
    </div>
  </div>
);

export default StartPage;
