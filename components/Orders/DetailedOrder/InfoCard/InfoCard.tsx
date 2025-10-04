import styles from "./infoCard.module.css";

type InfoCardProps = {
  title: string;
  iconImgUrl: string;
  info: string;
  type: string;
};

const InfoCard = ({
  title,
  iconImgUrl,
  info,
  type = "SPAN3",
}: InfoCardProps) => {
  return (
    <div className={`${styles.main} ${styles[type]}`}>
      <img src={iconImgUrl} alt="Status" />
      <div className={styles.infoContent}>
        <div className={styles.infoTitle}>{title}</div>
        <div className={styles.info}>{info}</div>
      </div>
    </div>
  );
};

export default InfoCard;
