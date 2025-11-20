import styles from "./reviewsSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import ReviewsList from "@/components/Reviews/ReviewsList/ReviewsList";
import DetailedReview from "@/components/Reviews/DetailedReview/DetailedReview";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { ReviewType } from "@/types/Reviews";
import nannowImg from "../../../../assets/images/nannow.png";

type ReviewsSectionProps = {
  title: string;
  reviews: ReviewType[];
  onBackClick: () => void;
};

const ReviewsSection = ({
  title,
  reviews,
  onBackClick,
}: ReviewsSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [selectedReview, setSelectedReview] = useState<ReviewType | null>();

  // local state just to satisfy DetailedReview API; not mutated here
  const [reviewsState, setReviewsState]: [
    ReviewType[],
    Dispatch<SetStateAction<ReviewType[]>>
  ] = useState<ReviewType[]>(reviews ?? []);

  const mappedReviews = useMemo(() => {
    if (title !== "Received Reviews") return reviews ?? [];
    return (reviews ?? []).map((r) => {
      if (r?.reviewType === "ADDED_BY_ADMIN") {
        return {
          ...r,
          reviewerFirstName: "Review added by",
          reviewerSurname: "Nannow",
          reviewerImgUrl: nannowImg.src,
        };
      }
      return r;
    });
  }, [reviews, title]);

  const itemsPerPage = useMemo(
    () => (mappedReviews?.length ?? 0) || 1,
    [mappedReviews]
  );
  const pageCount = 1;
  const totalReviews = mappedReviews?.length ?? 0;
  const [, setItemOffset] = useState(0);

  useEffect(() => {
    if (!selectedReviewId) {
      setSelectedReview(null);
      return;
    }
    const found = mappedReviews?.find((r) => r.id === selectedReviewId) ?? null;
    setSelectedReview(found);
  }, [selectedReviewId, mappedReviews]);

  const renderMobile = () => {
    if (selectedReviewId !== "" && selectedReview) {
      return (
        <DetailedReview
          review={selectedReview}
          onBackClick={() => setSelectedReviewId("")}
          setReviews={setReviewsState}
          reviews={reviewsState}
        />
      );
    }

    return (
      <>
        <ReviewsList
          reviews={mappedReviews ?? []}
          selectedReviewId={selectedReviewId}
          setSelectedReviewId={setSelectedReviewId}
          itemsPerPage={itemsPerPage}
          pageCount={pageCount}
          totalReviews={totalReviews}
          setItemOffset={setItemOffset}
          setReviewById={setSelectedReview}
        />
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      </>
    );
  };

  const renderDesktop = () => (
    <div className={styles.content}>
      <ReviewsList
        reviews={mappedReviews ?? []}
        selectedReviewId={selectedReviewId}
        setSelectedReviewId={setSelectedReviewId}
        itemsPerPage={itemsPerPage}
        pageCount={pageCount}
        totalReviews={totalReviews}
        setItemOffset={setItemOffset}
        setReviewById={setSelectedReview}
      />
      {selectedReview && (
        <DetailedReview
          review={selectedReview}
          onBackClick={() => setSelectedReviewId("")}
          setReviews={setReviewsState}
          reviews={reviewsState}
        />
      )}
    </div>
  );

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>{title}</h3>
      {isMobile ? renderMobile() : renderDesktop()}
    </div>
  );
};

export default ReviewsSection;
