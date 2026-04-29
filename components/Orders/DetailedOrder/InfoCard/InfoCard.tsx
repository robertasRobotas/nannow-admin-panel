import { ReactNode } from "react";
import styles from "./infoCard.module.css";

type InfoCardProps = {
  title: string;
  iconImgUrl: string;
  info: ReactNode;
  type: string;
  isMultiline?: boolean;
  isCentered?: boolean;
  action?: ReactNode;
};

const InfoCard = ({
  title,
  iconImgUrl,
  info,
  type = "SPAN3",
  isMultiline = false,
  isCentered = false,
  action,
}: InfoCardProps) => {
  return (
    <div
      className={`${styles.main} ${styles[type]} ${
        isMultiline ? styles.multiline : ""
      }`}
    >
      <img src={iconImgUrl} alt="Status" />
      <div
        className={`${styles.infoContent} ${isCentered ? styles.centeredContent : ""}`}
      >
        <div className={styles.infoTitle}>{title}</div>
        <div className={styles.info}>{info}</div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
};

export default InfoCard;
