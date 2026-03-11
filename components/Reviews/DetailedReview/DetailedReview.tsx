import styles from "./detailedReview.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { ReviewType } from "@/types/Reviews";
import { Dispatch, SetStateAction } from "react";
import avatarImg from "../../../assets/images/default-avatar.png";
import Link from "next/link";
import Nannow from "@/assets/images/nannow.png";

type DetailedReview = {
  review: ReviewType;
  onBackClick: () => void;
  setReviews: Dispatch<SetStateAction<ReviewType[]>>;
  reviews: ReviewType[];
};

const DetailedReview = ({ review, onBackClick }: DetailedReview) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const reviewType = review?.reviewType;
  const isAddedByAdmin = reviewType === "ADDED_BY_ADMIN";
  const reviewerFirstName = isAddedByAdmin
    ? "Nannow"
    : review.reviewerFirstName;
  const reviewerSurname = isAddedByAdmin ? "" : review.reviewerSurname;
  const reviewerImgUrl = isAddedByAdmin
    ? Nannow.src
    : (review?.reviewerImgUrl ?? avatarImg.src);

  const reviewerHref =
    isAddedByAdmin
      ? ""
      : reviewType === "CLIENT_TO_PROVIDER"
      ? review.clientUserId
        ? `/client/${review.clientUserId}`
        : ""
      : review.providerUserId
        ? `/provider/${review.providerUserId}`
        : "";

  const revieweeHref =
    isAddedByAdmin
      ? review.providerUserId
        ? `/provider/${review.providerUserId}`
        : ""
      : reviewType === "CLIENT_TO_PROVIDER"
      ? review.providerUserId
        ? `/provider/${review.providerUserId}`
        : ""
      : review.clientUserId
        ? `/client/${review.clientUserId}`
        : "";

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>

      <div className={styles.heading}>
        <div className={styles.reviewDetails}>
          {revieweeHref ? (
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
          ) : (
            <div className={styles.profile}>
              <img src={review?.revieweeImgUrl ?? avatarImg.src} alt="Profile" />
              <div>
                <span className={styles.title}>Has been reviewed</span>
                <span className={styles.name}>
                  {review.revieweeFirstName}
                  <br />
                  {review.revieweeSurname}
                </span>
              </div>
            </div>
          )}

          <img src={arrowImg.src} alt="Arrow" />

          {reviewerHref ? (
            <Link href={reviewerHref} className={styles.profile}>
              <img src={reviewerImgUrl} alt="Profile" />
              <div>
                <span className={styles.title}>Reviewed by</span>
                <span className={styles.name}>
                  {reviewerFirstName}
                  <br />
                  {reviewerSurname}
                </span>
              </div>
            </Link>
          ) : (
            <div className={styles.profile}>
              <img src={reviewerImgUrl} alt="Profile" />
              <div>
                <span className={styles.title}>Reviewed by</span>
                <span className={styles.name}>
                  {reviewerFirstName}
                  <br />
                  {reviewerSurname}
                </span>
              </div>
            </div>
          )}
        </div>

        {isMobile && (
          <Button title="Back" type="OUTLINED" onClick={onBackClick} />
        )}
      </div>

      <div className={styles.review}>
        <img src={reviewerImgUrl} alt="Profile" />
        <div className={styles.reviewBubble}>
          {review?.text?.trim() ? review.text : "no text was left"}
        </div>
      </div>
    </div>
  );
};

export default DetailedReview;
