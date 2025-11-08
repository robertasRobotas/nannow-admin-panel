import { useEffect, useMemo, useState } from "react";
import styles from "./reviews.module.css";
import { useMediaQuery } from "react-responsive";
import ReviewsList from "./ReviewsList/ReviewsList";
import DetailedReview from "./DetailedReview/DetailedReview";
import { ReviewType } from "@/types/Reviews";
import axios from "axios";
import { useRouter } from "next/router";
import { getAllReviews, getReviewById } from "@/pages/api/fetch";
import { options as reviewRatingOptions } from "../../data/reviewRatingOptions";

type ReviewsProps = {
  detailedPageId?: string;
};

const Reviews = ({ detailedPageId }: ReviewsProps) => {
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [selectedReview, setReviewById] = useState<ReviewType | null>();
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const selectedRating = useMemo(() => {
    const value = reviewRatingOptions[selectedOption]?.value ?? "";
    return value.length > 0 ? parseInt(value, 10) : undefined;
  }, [selectedOption]);

  const fetchReviews = async () => {
    try {
      const response = await getAllReviews(itemOffset, selectedRating);
      setReviews(response.data.reviews.reviews);
      setItemsPerPage(response.data.reviews.pageSize);
      setPageCount(
        Math.ceil(response.data.reviews.total / response.data.reviews.pageSize)
      );
      setTotalReviews(response.data.reviews.total);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  };

  const fetchReviewById = async (id: string) => {
    try {
      const response = await getReviewById(id);
      setReviewById(response.data.review);
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch list on mount and whenever pagination or rating changes
  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemOffset, selectedRating]);

  // Fetch detailed review when landing on dedicated page
  useEffect(() => {
    if (detailedPageId) {
      fetchReviewById(detailedPageId);
    }
  }, [detailedPageId]);

  useEffect(() => {
    if (selectedReviewId) {
      fetchReviewById(selectedReviewId);
    }
  }, [selectedReviewId]);

  const renderMobile = () => {
    if (selectedReviewId !== "" && selectedReview) {
      return (
        <DetailedReview
          review={selectedReview}
          onBackClick={() => setSelectedReviewId("")}
          setReviews={setReviews}
          reviews={reviews}
        />
      );
    }

    return (
      <ReviewsList
        reviews={reviews}
        selectedReviewId={selectedReviewId}
        setSelectedReviewId={setSelectedReviewId}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReviews={totalReviews ?? 0}
        setItemOffset={setItemOffset}
        setReviewById={setReviewById}
        selectedOption={selectedOption}
        setSelectedOption={(idx) => {
          setSelectedOption(idx);
          setItemOffset(0);
        }}
        onClickOption={() => {
          setItemOffset(0);
        }}
      />
    );
  };

  const renderDesktop = () => (
    <>
      <ReviewsList
        reviews={reviews}
        selectedReviewId={selectedReviewId}
        setSelectedReviewId={setSelectedReviewId}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReviews={totalReviews ?? 0}
        setItemOffset={setItemOffset}
        setReviewById={setReviewById}
        selectedOption={selectedOption}
        setSelectedOption={(idx) => {
          setSelectedOption(idx);
          setItemOffset(0);
        }}
        onClickOption={() => {
          setItemOffset(0);
        }}
      />
      {selectedReview && (
        <DetailedReview
          review={selectedReview}
          onBackClick={() => setSelectedReviewId("")}
          setReviews={setReviews}
          reviews={reviews}
        />
      )}
    </>
  );

  return (
    <div className={styles.main}>
      {isMobile ? renderMobile() : renderDesktop()}
    </div>
  );
};

export default Reviews;
