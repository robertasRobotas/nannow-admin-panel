import styles from "./processCard.module.css";
import greenCheckmarkImg from "../../../../assets/images/circle-checkmark.svg";

type ProcessCardType = {
  imgUrl: string;
  process: string;
  date: string;
};

const ProcessCard = ({ imgUrl, process, date }: ProcessCardType) => {
  return (
    <div className={styles.main}>
      <div className={styles.cardContent}>
        <img src={imgUrl} />
        <div className={styles.textContent}>
          <span className={styles.process}>{process}</span>
          <span className={styles.date}>{date}</span>
        </div>
      </div>
      <img src={greenCheckmarkImg.src} />
    </div>
  );
};

export default ProcessCard;
