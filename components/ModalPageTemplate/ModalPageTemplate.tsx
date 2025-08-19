import { ReactNode } from "react";
import styles from "./modalPageTemplate.module.css";
import Header from "../Header/Header";

type ModalPageTemplateProps = {
  children: ReactNode;
};

const ModalPageTemplate = ({ children }: ModalPageTemplateProps) => {
  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.contentWrapper}>{children}</div>
    </div>
  );
};

export default ModalPageTemplate;
