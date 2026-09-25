import styles from "./reviewsSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import ReviewsList from "@/components/Reviews/ReviewsList/ReviewsList";
import DetailedReview from "@/components/Reviews/DetailedReview/DetailedReview";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { ReviewType } from "@/types/Reviews";
import nannowImg from "../../../../assets/images/nannow.png";
import { getReviewById, hideReview } from "@/pages/api/fetch";

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
  const [reviewOverrides, setReviewOverrides] = useState<Record<string, ReviewType>>({});

  // local state just to satisfy DetailedReview API; not mutated here
  const [reviewsState, setReviewsState]: [
    ReviewType[],
    Dispatch<SetStateAction<ReviewType[]>>
  ] = useState<ReviewType[]>(reviews ?? []);

  const baseReviews = useMemo(() => {
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

  const mappedReviews = useMemo(
    () => baseReviews.map((review) => reviewOverrides[review.id] ?? review),
    [baseReviews, reviewOverrides],
  );

  // Some deployed profile-summary responses omit isHidden. Hydrate only those
  // rows from the canonical review endpoint so hidden badges appear on load.
  useEffect(() => {
    let isCurrent = true;
    const missingStatus = baseReviews.filter((review) => review.isHidden === undefined);
    const hydrateMissingStatus = async () => {
      for (let index = 0; index < missingStatus.length; index += 5) {
        const batch = missingStatus.slice(index, index + 5);
        const resolved = await Promise.all(
          batch.map(async (review) => {
            try {
              const response = await getReviewById(review.id);
              return response.data?.review as ReviewType | undefined;
            } catch (error) {
              console.error("Failed to load review visibility", error);
              return undefined;
            }
          }),
        );
        if (!isCurrent) return;
        setReviewOverrides((previous) => ({
          ...previous,
          ...Object.fromEntries(resolved.filter(Boolean).map((review) => [review!.id, review!])),
        }));
      }
    };

    void hydrateMissingStatus();
    return () => {
      isCurrent = false;
    };
  }, [baseReviews]);

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
    const found = baseReviews?.find((r) => r.id === selectedReviewId) ?? null;
    setSelectedReview(found);
    if (!found) return;

    let isCurrent = true;
    void getReviewById(found.id)
      .then((response) => {
        if (isCurrent && response.data?.review) {
          setSelectedReview(response.data.review);
          setReviewOverrides((previous) => ({
            ...previous,
            [found.id]: response.data.review,
          }));
        }
      })
      .catch((error) => {
        console.error("Failed to load full review details", error);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedReviewId, baseReviews]);

  const handleHideReview = async (reason: string) => {
    if (!selectedReview) return;
    const response = await hideReview(selectedReview.id, reason);
    const hiddenReview = response.data?.review as ReviewType | undefined;
    if (hiddenReview) {
      setSelectedReview(hiddenReview);
      setReviewOverrides((previous) => ({ ...previous, [hiddenReview.id]: hiddenReview }));
    }
    try {
      const detailResponse = await getReviewById(selectedReview.id);
      const fullReview = detailResponse.data?.review as ReviewType | undefined;
      if (fullReview) {
        setSelectedReview(fullReview);
        setReviewOverrides((previous) => ({ ...previous, [fullReview.id]: fullReview }));
      }
    } catch (error) {
      console.error("Failed to refresh hidden review details", error);
    }
  };

  const renderMobile = () => {
    if (selectedReviewId !== "" && selectedReview) {
      return (
        <DetailedReview
          review={selectedReview}
          onBackClick={() => setSelectedReviewId("")}
          setReviews={setReviewsState}
          reviews={reviewsState}
          onHideReview={handleHideReview}
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
          onHideReview={handleHideReview}
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
