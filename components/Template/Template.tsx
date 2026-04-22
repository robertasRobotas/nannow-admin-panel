import React from "react";
import Header from "../Header/Header";
import styles from "./template.module.css";
import { useRouter } from "next/router";

type TemplateProps = {
  children: React.ReactNode;
};

const Template = ({ children }: TemplateProps) => {
  const { pathname } = useRouter();
  const hideNav = pathname === "/login";

  return (
    <div
      className={`${styles.container} ${hideNav ? styles.noSidebar : ""}`}
    >
      {!hideNav && <Header />}
      <div className={styles.contentWrapper}>{children}</div>
    </div>
  );
};

export default Template;
