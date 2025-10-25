import styles from "./detailedReview.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import trashImg from "../../../assets/images/trash.svg";
import checkmarkImg from "../../../assets/images/checkmark-white.svg";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { ReviewType } from "@/types/Reviews";
import { Dispatch, SetStateAction } from "react";
import avatarImg from "../../../assets/images/default-avatar.png";

type DetailedReview = {
  review: ReviewType;
  onBackClick: () => void;
  setReviews: Dispatch<SetStateAction<ReviewType[]>>;
  reviews: ReviewType[];
};

const DetailedReview = ({
  review,
  onBackClick,
  setReviews,
  reviews,
}: DetailedReview) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>
      <div className={styles.heading}>
        <div className={styles.reviewDetails}>
          <div className={styles.profile}>
            <img
              src={review?.reviewee?.imgUrl ?? avatarImg.src}
              alt="Profile"
            />
            <div>
              <span className={styles.title}>Has been reviewed</span>
              <span className={styles.name}>
                {`${review.reviewee.firstName}\n${review.reviewee.lastName}`}
              </span>
            </div>
          </div>
          <img src={arrowImg.src} alt="Arrow" />
          <div className={styles.profile}>
            <img
              src={review?.reviewer?.imgUrl ?? avatarImg.src}
              alt="Profile"
            />
            <div>
              <span className={styles.title}>Reviewed by</span>
              <span className={styles.name}>
                {`${review.reviewer.firstName}\n${review.reviewer.lastName}`}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.btnsWrapper}>
          <Button
            title="Delete review"
            imgUrl={trashImg.src}
            type="GRAY"
            onClick={() => console.log("placeholder")}
          />
          <Button
            title="Mark as Approved"
            imgUrl={checkmarkImg.src}
            type="GREEN"
            onClick={() => console.log("placeholder")}
          />
          {isMobile && (
            <Button title="Back" type="OUTLINED" onClick={onBackClick} />
          )}
        </div>
      </div>
      <div className={styles.review}>
        <img src={review.reviewer.imgUrl} alt="Profile" />
        <div className={styles.reviewBubble}>placeholder</div>
      </div>
    </div>
  );
};

export default DetailedReview;
