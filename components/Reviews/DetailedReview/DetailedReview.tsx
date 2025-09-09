import styles from "./detailedReview.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import trashImg from "../../../assets/images/trash.svg";
import checkmarkImg from "../../../assets/images/checkmark-white.svg";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";

type DetailedReview = {
  review: any;
  onBackClick: () => void;
};

const DetailedReview = ({ review, onBackClick }: DetailedReview) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>
      <div className={styles.heading}>
        <div className={styles.reviewDetails}>
          <div className={styles.profile}>
            <img src={review.reviewed_by.imgUrl} alt="Profile" />
            <div>
              <span className={styles.title}>Has been reviewed</span>
              <span className={styles.name}>
                {review.reviewed.name.split(" ")[0]}
              </span>
            </div>
          </div>
          <img src={arrowImg.src} alt="Arrow" />
          <div className={styles.profile}>
            <img src={review.reviewed.imgUrl} alt="Profile" />
            <div>
              <span className={styles.title}>Reviewed by</span>
              <span className={styles.name}>
                {review.reviewed_by.name.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.btnsWrapper}>
          <Button title="Delete review" imgUrl={trashImg.src} type="GRAY" />
          <Button
            title="Mark as Approved"
            imgUrl={checkmarkImg.src}
            type="GREEN"
          />
          {isMobile && (
            <Button title="Back" type="OUTLINED" onClick={onBackClick} />
          )}
        </div>
      </div>
      <div className={styles.review}>
        <img src={review.reviewed_by.imgUrl} alt="Profile" />
        <div className={styles.reviewBubble}>{review.review}</div>
      </div>
    </div>
  );
};

export default DetailedReview;
