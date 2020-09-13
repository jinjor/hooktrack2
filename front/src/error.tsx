import React from "react";
import * as ReactDOM from "react-dom";
import { Layout } from "./layout";

const Main = () => {
  return (
    <Layout>
      <h2>Error!</h2>
    </Layout>
  );
};

ReactDOM.render(<Main />, document.getElementById("root"));
