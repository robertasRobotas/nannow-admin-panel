import styles from "./Review.module.css";
import arrowImg from "../../../../assets/images/arrow-right.svg";

type ReviewProps = {
  icon: string;
  reportedByName: string;
  reportedByImg: string;
  reportedName: string;
  reportedImg: string;
  date: string;
  isSelected: boolean;
  onClick: () => void;
};

const Review = ({
  icon,
  reportedByName,
  reportedByImg,
  reportedName,
  reportedImg,
  date,
  isSelected,
  onClick,
}: ReviewProps) => {
  return (
    <div
      onClick={onClick}
      className={`${styles.main} ${isSelected && styles.selected}`}
    >
      <img src={icon} alt="Icon" />
      <div className={styles.reviewDetails}>
        <div className={styles.profile}>
          <img src={reportedByImg} alt="Profile" />
          <div>
            <span className={styles.title}>Reviewed by</span>
            <span className={styles.name}>{reportedByName}</span>
          </div>
        </div>
        <img src={arrowImg.src} alt="Arrow" />
        <div className={styles.profile}>
          <img src={reportedImg} alt="Profile" />
          <div>
            <span className={styles.title}>Has been reviewed</span>
            <span className={styles.name}>{reportedName}</span>
          </div>
        </div>
      </div>
      <span className={styles.date}>{date}</span>
    </div>
  );
};

export default Review;
