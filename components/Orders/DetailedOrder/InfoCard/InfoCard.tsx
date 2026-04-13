import { ReactNode } from "react";
import styles from "./infoCard.module.css";

type InfoCardProps = {
  title: string;
  iconImgUrl: string;
  info: ReactNode;
  type: string;
  isMultiline?: boolean;
};

const InfoCard = ({
  title,
  iconImgUrl,
  info,
  type = "SPAN3",
  isMultiline = false,
}: InfoCardProps) => {
  return (
    <div
      className={`${styles.main} ${styles[type]} ${
        isMultiline ? styles.multiline : ""
      }`}
    >
      <img src={iconImgUrl} alt="Status" />
      <div className={styles.infoContent}>
        <div className={styles.infoTitle}>{title}</div>
        <div className={styles.info}>{info}</div>
      </div>
    </div>
  );
};

export default InfoCard;
