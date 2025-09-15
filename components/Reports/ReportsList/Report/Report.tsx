import styles from "./report.module.css";
import arrowImg from "../../../../assets/images/arrow-right.svg";

type ReportProps = {
  icon: string;
  reportedByName: string;
  reportedByImg: string;
  reportedName: string;
  reportedImg: string;
  date: string;
  isSelected: boolean;
  onClick: () => void;
};

const Report = ({
  icon,
  reportedByName,
  reportedByImg,
  reportedName,
  reportedImg,
  date,
  isSelected,
  onClick,
}: ReportProps) => {
  const dateFormatted = date
    ? new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "-";

  return (
    <div
      onClick={onClick}
      className={`${styles.main} ${isSelected && styles.selected}`}
    >
      <img src={icon} alt="Icon" />
      <div className={styles.reportDetails}>
        <div className={styles.profile}>
          <img src={reportedByImg} alt="Profile" />
          <div>
            <span className={styles.title}>Reported by</span>
            <span className={styles.name}>{reportedByName}</span>
          </div>
        </div>
        <img src={arrowImg.src} alt="Arrow" />
        <div className={styles.profile}>
          <img src={reportedImg} alt="Profile" />
          <div>
            <span className={styles.title}>Has been reported</span>
            <span className={styles.name}>{reportedName}</span>
          </div>
        </div>
      </div>
      <span className={styles.date}>{dateFormatted}</span>
    </div>
  );
};

export default Report;
