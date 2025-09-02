import styles from "./recordChangedAt.module.css";
import calendarImg from "../../../../assets/images/calendar.svg";
import { nunito } from "@/helpers/fonts";

type RecordChangedAtProps = {
  changedAt: string;
};

const RecordChangedAt = ({ changedAt }: RecordChangedAtProps) => {
  const date = changedAt
    ? new Date(changedAt).toLocaleString("en-US", {
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
    <div className={styles.verifiedType}>
      <img src={calendarImg.src} alt="Badge" />
      <div className={styles.verifiedInfo}>
        <span className={styles.title}>CRIMINAL RECORD CHANGED AT</span>
        <div className={styles.docType}>
          <span className={`${styles.docTitle} ${nunito.className}`}>
            {date}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordChangedAt;
