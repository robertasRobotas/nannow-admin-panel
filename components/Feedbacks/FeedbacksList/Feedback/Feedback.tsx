import styles from "./feedback.module.css";

type FeedbackProps = {
  icon: string;
  feedbackByName: string;
  feedbackByImg: string;
  date: string;
  isSelected: boolean;
  onClick: () => void;
};

const Feedback = ({
  icon,
  feedbackByName,
  feedbackByImg,
  date,
  isSelected,
  onClick,
}: FeedbackProps) => {
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
      <div className={styles.top}>
        <div className={styles.feedbackDetails}>
          <div className={styles.profile}>
            <img src={feedbackByImg} alt="Profile" />
            <div>
              <span className={styles.title}>Feedback by</span>
              <span className={styles.name}>{feedbackByName}</span>
            </div>
          </div>
        </div>
        <span className={styles.date}>{dateFormatted}</span>
      </div>
    </div>
  );
};

export default Feedback;
