import styles from "./recordChangedAt.module.css";
import calendarImg from "../../../../assets/images/calendar.svg";
import { nunito } from "@/helpers/fonts";

type RecordChangedAtProps = {
  changedAt: string;
  verifiedAt: string;
};

const RecordChangedAt = ({ changedAt, verifiedAt }: RecordChangedAtProps) => {
  const date = verifiedAt ? verifiedAt : changedAt ? changedAt : "-";
  let formattedDate = "-";
  if (date !== "-") {
    formattedDate = new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  }

  return (
    <div className={styles.verifiedType}>
      <img src={calendarImg.src} alt="Badge" />
      <div className={styles.verifiedInfo}>
        <span className={styles.title}>CRIMINAL RECORD CHANGED AT</span>
        <div className={styles.docType}>
          <span className={`${styles.docTitle} ${nunito.className}`}>
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordChangedAt;
