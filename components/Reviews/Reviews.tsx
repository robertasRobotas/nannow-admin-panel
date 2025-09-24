import { useState } from "react";
import styles from "./reviews.module.css";
import { reviews } from "@/mocks/reviews";
import { useMediaQuery } from "react-responsive";
import ReviewsList from "./ReviewsList/ReviewsList";
import DetailedReview from "./DetailedReview/DetailedReview";
import { ReviewType } from "@/types/Reviews";

const Reviews = () => {
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const findSelectedReview = (id: string): ReviewType | object => {
    const review: ReviewType | object = reviews.find((c) => c.id === id) ?? {};
    return review;
  };

  return (
    <div className={styles.main}>
      {isMobile ? (
        selectedReviewId ? (
          <DetailedReview
            review={findSelectedReview(selectedReviewId) as ReviewType}
            onBackClick={() => setSelectedReviewId("")}
          />
        ) : (
          <ReviewsList
            reviews={reviews}
            selectedReviewId={selectedReviewId}
            setSelectedReviewId={setSelectedReviewId}
          />
        )
      ) : (
        <>
          <ReviewsList
            reviews={reviews}
            selectedReviewId={selectedReviewId}
            setSelectedReviewId={setSelectedReviewId}
          />
          {selectedReviewId && (
            <DetailedReview
              review={findSelectedReview(selectedReviewId) as ReviewType}
              onBackClick={() => setSelectedReviewId("")}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
