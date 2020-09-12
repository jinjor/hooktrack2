import React from "react";

const Header = () => {
  return (
    <header className="navbar">
      <div className="container navbar-container">
        <a href="/" className="reset navbar-brand">
          Hooktrack
        </a>
        <div className="navbar-items">
          <a
            className="reset navbar-item"
            href="https://github.com/jinjor/hooktrack2"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
};
export const Layout = (props: { children: any }) => {
  return (
    <div>
      <Header></Header>
      <div className="container">{props.children}</div>
    </div>
  );
};
