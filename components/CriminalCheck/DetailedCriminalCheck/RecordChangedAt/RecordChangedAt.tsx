import styles from "./recordChangedAt.module.css";
import badgeImg from "../../../../assets/images/badge.svg";
import calendarImg from "../../../../assets/images/calendar.svg";
import { nunito } from "@/helpers/fonts";

type RecordChangedAtProps = {
  changedAt: string;
};

const RecordChangedAt = ({ changedAt }: RecordChangedAtProps) => {
  return (
    <div className={styles.verifiedType}>
      <img src={calendarImg.src} alt="Badge" />
      <div className={styles.verifiedInfo}>
        <span className={styles.title}>CRIMINAL RECORD CHANGED AT</span>
        <div className={styles.docType}>
          <span className={`${styles.docTitle} ${nunito.className}`}>
            {changedAt ? changedAt : "-"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordChangedAt;
