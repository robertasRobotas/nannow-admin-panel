import { useState } from "react";
import styles from "./reviews.module.css";
import { reports } from "@/mocks/reports";
import { useMediaQuery } from "react-responsive";
import ReviewsList from "./ReviewsList/ReviewsList";
import DetailedReview from "./DetailedReview/DetailedReview";

const Reviews = () => {
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const findSelectedReview = (id: string) => {
    const report = reports.find((c) => c.id === id) ?? {};
    return report;
  };

  return (
    <div className={styles.main}>
      {isMobile ? (
        selectedReviewId ? (
          <DetailedReview
            review={findSelectedReview(selectedReviewId)}
            onBackClick={() => setSelectedReviewId("")}
          />
        ) : (
          <ReviewsList
            reviews={reports}
            selectedReviewId={selectedReviewId}
            setSelectedReviewId={setSelectedReviewId}
          />
        )
      ) : (
        <>
          <ReviewsList
            reviews={reports}
            selectedReviewId={selectedReviewId}
            setSelectedReviewId={setSelectedReviewId}
          />
          {selectedReviewId && (
            <DetailedReview
              review={findSelectedReview(selectedReviewId)}
              onBackClick={() => setSelectedReviewId("")}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
