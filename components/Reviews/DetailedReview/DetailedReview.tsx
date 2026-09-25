import styles from "./detailedReview.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { ReviewType } from "@/types/Reviews";
import { Dispatch, SetStateAction, useState } from "react";
import avatarImg from "../../../assets/images/default-avatar.png";
import Link from "next/link";
import Nannow from "@/assets/images/nannow.png";

type DetailedReview = {
  review: ReviewType;
  onBackClick: () => void;
  setReviews: Dispatch<SetStateAction<ReviewType[]>>;
  reviews: ReviewType[];
  onHideReview?: (reason: string) => Promise<void>;
};

const DetailedReview = ({ review, onBackClick, onHideReview }: DetailedReview) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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

  const submitHide = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) return;
    setIsSubmitting(true);
    setError("");
    try {
      if (!onHideReview) return;
      await onHideReview(trimmedReason);
      setIsConfirmOpen(false);
      setReason("");
    } catch {
      setError("Could not remove this review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hiddenByLabel = review.hiddenByName?.trim() || "Unknown admin";

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

      <div className={styles.headingRow}>
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
          {!review.isHidden && onHideReview && <Button title="Remove review" type="DELETE" onClick={() => setIsConfirmOpen(true)} />}
        </div>
        {review.isHidden && (
          <div className={styles.hiddenNotice} aria-label="Review removal details">
            <strong>Hidden</strong>
            <span>Reason: {review.hiddenReason || "Not recorded"}</span>
            <span>Removed by: {hiddenByLabel}</span>
            <span>At: {review.hiddenAt ? new Date(review.hiddenAt).toLocaleString() : "Unknown"}</span>
          </div>
        )}
      </div>

      <div className={styles.review}>
        <img src={reviewerImgUrl} alt="Profile" />
        <div className={styles.reviewBubble}>
          {review?.text?.trim() ? review.text : "no text was left"}
        </div>
      </div>

      {isConfirmOpen && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="hide-review-title">
            <h2 id="hide-review-title">Remove review?</h2>
            <p>This hides the review from users while keeping it available to admins for audit.</p>
            <label htmlFor="hide-review-reason">Reason for removal</label>
            <textarea id="hide-review-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={1000} />
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
              <Button title="Cancel" type="OUTLINED" isDisabled={isSubmitting} onClick={() => setIsConfirmOpen(false)} />
              <Button title="Confirm removal" type="DELETE" isDisabled={!reason.trim()} isLoading={isSubmitting} onClick={() => void submitHide()} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default DetailedReview;
