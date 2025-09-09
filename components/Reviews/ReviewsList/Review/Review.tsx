import styles from "./Review.module.css";
import arrowImg from "../../../../assets/images/arrow-right.svg";
import starImg from "../../../../assets/images/star-filled.svg";

type ReviewProps = {
  rating: number;
  reviewedByName: string;
  reviewedByImg: string;
  reviewedName: string;
  reviewedImg: string;
  date: string;
  isSelected: boolean;
  onClick: () => void;
};

const Review = ({
  rating,
  reviewedByName,
  reviewedByImg,
  reviewedName,
  reviewedImg,
  date,
  isSelected,
  onClick,
}: ReviewProps) => {
  return (
    <div
      onClick={onClick}
      className={`${styles.main} ${isSelected && styles.selected}`}
    >
      <div className={styles.rating}>
        <img src={starImg.src} alt="Star" />
        <span>{rating.toFixed(1)}</span>
      </div>
      <div className={styles.reviewDetails}>
        <div className={styles.profile}>
          <img src={reviewedByImg} alt="Profile" />
          <div>
            <span className={styles.title}>Reviewed by</span>
            <span className={styles.name}>{reviewedByName}</span>
          </div>
        </div>
        <img src={arrowImg.src} alt="Arrow" />
        <div className={styles.profile}>
          <img src={reviewedImg} alt="Profile" />
          <div>
            <span className={styles.title}>Has been reviewed</span>
            <span className={styles.name}>{reviewedName}</span>
          </div>
        </div>
      </div>
      <span className={styles.date}>{date}</span>
    </div>
  );
};

export default Review;
