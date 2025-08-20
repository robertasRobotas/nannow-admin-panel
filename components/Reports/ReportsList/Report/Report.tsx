import styles from "./report.module.css";
import arrowImg from "../../../../assets/images/arrow-right.svg";

type ReportProps = {
  icon: string;
  reportedByName: string;
  reportedByImg: string;
  reportedName: string;
  reportedImg: string;
  date: string;
};

const Report = ({
  icon,
  reportedByName,
  reportedByImg,
  reportedName,
  reportedImg,
  date,
}: ReportProps) => {
  return (
    <div className={styles.main}>
      <img src={icon} alt="Icon" />
      <div className={styles.reportDetails}>
        <div className={styles.profile}>
          <img src={reportedByImg} alt="Profile" />
          <div>
            <span className={styles.title}>Reported by</span>
            <span className={styles.name}>{reportedByName}</span>
          </div>
        </div>
        <img src={arrowImg.src} alt="Arror" />
        <div className={styles.profile}>
          <img src={reportedImg} alt="Profile" />
          <div>
            <span className={styles.title}>Has been reported</span>
            <span className={styles.name}>{reportedName}</span>
          </div>
        </div>
      </div>
      <span className={styles.date}>{date}</span>
    </div>
  );
};

export default Report;
