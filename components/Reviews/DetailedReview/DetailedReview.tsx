import styles from "./detailedReview.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { ReviewType } from "@/types/Reviews";
import { Dispatch, SetStateAction } from "react";
import avatarImg from "../../../assets/images/default-avatar.png";
import Link from "next/link";

type DetailedReview = {
  review: ReviewType;
  onBackClick: () => void;
  setReviews: Dispatch<SetStateAction<ReviewType[]>>;
  reviews: ReviewType[];
};

const DetailedReview = ({ review, onBackClick }: DetailedReview) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const reviewType = review?.reviewType;

  const reviewerHref =
    reviewType === "CLIENT_TO_PROVIDER"
      ? `/client/${review.clientUserId}`
      : `/provider/${review.providerUserId}`;

  const revieweeHref =
    reviewType === "CLIENT_TO_PROVIDER"
      ? `/provider/${review.providerUserId}`
      : `/client/${review.clientUserId}`;

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>

      <div className={styles.heading}>
        <div className={styles.reviewDetails}>
          <Link href={revieweeHref} className={styles.profile}>
            <img src={review?.revieweeImgUrl ?? avatarImg.src} alt="Profile" />
            <div>
              <span className={styles.title}>Has been reviewed</span>
              <span className={styles.name}>
                {review.revieweeFirstName}
                <br />
                {review.revieweeSurname}
              </span>
            </div>
          </Link>

          <img src={arrowImg.src} alt="Arrow" />

          <Link href={reviewerHref} className={styles.profile}>
            <img src={review?.reviewerImgUrl ?? avatarImg.src} alt="Profile" />
            <div>
              <span className={styles.title}>Reviewed by</span>
              <span className={styles.name}>
                {review.reviewerFirstName}
                <br />
                {review.reviewerSurname}
              </span>
            </div>
          </Link>
        </div>

        {isMobile && (
          <Button title="Back" type="OUTLINED" onClick={onBackClick} />
        )}
      </div>

      <div className={styles.review}>
        <img src={review?.reviewerImgUrl ?? avatarImg.src} alt="Profile" />
        <div className={styles.reviewBubble}>
          {review?.text?.trim() ? review.text : "no text was left"}
        </div>
      </div>
    </div>
  );
};

export default DetailedReview;
