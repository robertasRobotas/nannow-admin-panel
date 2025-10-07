import { ReactNode } from "react";
import styles from "./modalPageTemplate.module.css";
import Header from "../Header/Header";

type ModalPageTemplateProps = {
  children: ReactNode;
  isScrollable?: boolean;
};

const ModalPageTemplate = ({
  children,
  isScrollable = false,
}: ModalPageTemplateProps) => {
  console.log(isScrollable);
  return (
    <div className={`${styles.wrapper}`}>
      <Header />
      <div
        className={`${styles.contentWrapper} ${
          isScrollable && styles.isScrollable
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalPageTemplate;
