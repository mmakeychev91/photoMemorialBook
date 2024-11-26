import React from "react";
import { Link } from "react-router-dom";
import { AppRoute } from "../../const";

const StartPage = (): JSX.Element => (
  <>
    <div>
      <Link to={AppRoute.AboutHealth}>О здравии</Link>
      <button>Об упокоении</button>
    </div>
  </>
);

export default StartPage;
