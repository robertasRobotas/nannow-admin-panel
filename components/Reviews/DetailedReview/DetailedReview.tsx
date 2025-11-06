import styles from "./detailedReview.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import arrowOut from "../../../assets/images/arrow-out.svg";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { ReviewType } from "@/types/Reviews";
import { Dispatch, SetStateAction } from "react";
import avatarImg from "../../../assets/images/default-avatar.png";
import { toast } from "react-toastify";
import { copyReview } from "@/helpers/clipboardWrites";

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

  const onShare = async () => {
    copyReview(review.id);
    toast("Link to report copied!");
  };

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>
      <div className={styles.heading}>
        <div className={styles.reviewDetails}>
          <div className={styles.profile}>
            <img src={review?.reviewerImgUrl ?? avatarImg.src} alt="Profile" />
            <div>
              <span className={styles.title}>Has been reviewed</span>
              <span className={styles.name}>
                {`${review?.revieweeFirstName}\n${review?.revieweeSurname}`}
              </span>
            </div>
          </div>
          <img src={arrowImg.src} alt="Arrow" />
          <div className={styles.profile}>
            <img src={review?.revieweeImgUrl ?? avatarImg.src} alt="Profile" />
            <div>
              <span className={styles.title}>Reviewed by</span>
              <span className={styles.name}>
                {`${review?.reviewerFirstName}\n${review?.reviewerSurname}`}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.btnsWrapper}>
          {isMobile && (
            <Button title="Back" type="OUTLINED" onClick={onBackClick} />
          )}
        </div>
      </div>
      <div className={styles.review}>
        <img src={review?.reviewer?.imgUrl ?? avatarImg.src} alt="Profile" />
        <div className={styles.reviewBubble}>
          {review?.text?.trim() ? review.text : "no text was left"}
        </div>
      </div>
    </div>
  );
};

export default DetailedReview;
