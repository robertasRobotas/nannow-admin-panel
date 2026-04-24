import { useCallback, useEffect, useMemo, useState } from "react";
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
  const pageSizeForOffset = itemsPerPage ?? 20;

  const updateReviewsQuery = useCallback(
    (
      params: { page?: number; rating?: number | undefined; id?: string },
      method: "push" | "replace" = "push",
    ) => {
      if (!router.isReady || detailedPageId) return;
      const nextQuery = { ...router.query };
      if (typeof params.page === "number" && params.page > 0) {
        nextQuery.page = String(params.page);
      }
      if (typeof params.rating === "number") {
        nextQuery.rating = String(params.rating);
      } else {
        delete nextQuery.rating;
      }
      if (typeof params.id === "string" && params.id.length > 0) {
        nextQuery.id = params.id;
      } else if (params.id !== undefined) {
        delete nextQuery.id;
      }
      router[method](
        { pathname: router.pathname, query: nextQuery },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [detailedPageId, router],
  );

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

  useEffect(() => {
    if (!router.isReady) return;
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, itemOffset, selectedRating]);

  useEffect(() => {
    if (!router.isReady) return;
    const pageFromQuery =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const safePage =
      Number.isFinite(pageFromQuery) && pageFromQuery > 0
        ? Math.floor(pageFromQuery)
        : 1;
    setItemOffset((safePage - 1) * pageSizeForOffset);
  }, [pageSizeForOffset, router.isReady, router.query.page]);

  useEffect(() => {
    if (!router.isReady) return;
    const ratingFromQuery =
      typeof router.query.rating === "string"
        ? Number(router.query.rating)
        : NaN;
    const nextOption = reviewRatingOptions.findIndex(
      (option) => Number(option.value) === ratingFromQuery,
    );
    setSelectedOption(nextOption >= 0 ? nextOption : 0);
  }, [router.isReady, router.query.rating]);

  useEffect(() => {
    if (!router.isReady || detailedPageId) return;
    const idFromQuery = typeof router.query.id === "string" ? router.query.id : "";
    setSelectedReviewId(idFromQuery);
  }, [detailedPageId, router.isReady, router.query.id]);

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

  const selectReview = (nextReviewId: string) => {
    setSelectedReviewId(nextReviewId);
    const currentPage = Math.floor(itemOffset / pageSizeForOffset) + 1;
    updateReviewsQuery({
      page: currentPage,
      rating: selectedRating,
      id: nextReviewId,
    });
  };

  const clearSelectedReview = () => {
    setSelectedReviewId("");
    const currentPage = Math.floor(itemOffset / pageSizeForOffset) + 1;
    updateReviewsQuery({
      page: currentPage,
      rating: selectedRating,
      id: "",
    });
  };

  const renderMobile = () => {
    if (selectedReviewId !== "" && selectedReview) {
      return (
        <DetailedReview
          review={selectedReview}
          onBackClick={clearSelectedReview}
          setReviews={setReviews}
          reviews={reviews}
        />
      );
    }

    return (
      <ReviewsList
        reviews={reviews}
        selectedReviewId={selectedReviewId}
        setSelectedReviewId={(nextValue) => {
          const nextId =
            typeof nextValue === "function"
              ? nextValue(selectedReviewId)
              : nextValue;
          selectReview(nextId);
        }}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReviews={totalReviews ?? 0}
        setItemOffset={(nextOffset) => {
          const offset =
            typeof nextOffset === "function" ? nextOffset(itemOffset) : nextOffset;
          const page = Math.floor(offset / pageSizeForOffset) + 1;
          updateReviewsQuery({ page, rating: selectedRating, id: selectedReviewId });
        }}
        setReviewById={setReviewById}
        selectedOption={selectedOption}
        setSelectedOption={(idx) => {
          const nextIndex = Number(idx);
          if (!Number.isFinite(nextIndex)) return;
          setSelectedOption(nextIndex);
          const value = reviewRatingOptions[nextIndex]?.value ?? "";
          const rating = value.length > 0 ? Number(value) : undefined;
          updateReviewsQuery({ page: 1, rating, id: selectedReviewId });
        }}
        onClickOption={() => {
          updateReviewsQuery({ page: 1, rating: selectedRating, id: selectedReviewId });
        }}
      />
    );
  };

  const renderDesktop = () => (
    <>
      <ReviewsList
        reviews={reviews}
        selectedReviewId={selectedReviewId}
        setSelectedReviewId={(nextValue) => {
          const nextId =
            typeof nextValue === "function"
              ? nextValue(selectedReviewId)
              : nextValue;
          selectReview(nextId);
        }}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReviews={totalReviews ?? 0}
        setItemOffset={(nextOffset) => {
          const offset =
            typeof nextOffset === "function" ? nextOffset(itemOffset) : nextOffset;
          const page = Math.floor(offset / pageSizeForOffset) + 1;
          updateReviewsQuery({ page, rating: selectedRating, id: selectedReviewId });
        }}
        setReviewById={setReviewById}
        selectedOption={selectedOption}
        setSelectedOption={(idx) => {
          const nextIndex = Number(idx);
          if (!Number.isFinite(nextIndex)) return;
          setSelectedOption(nextIndex);
          const value = reviewRatingOptions[nextIndex]?.value ?? "";
          const rating = value.length > 0 ? Number(value) : undefined;
          updateReviewsQuery({ page: 1, rating, id: selectedReviewId });
        }}
        onClickOption={() => {
          updateReviewsQuery({ page: 1, rating: selectedRating, id: selectedReviewId });
        }}
      />
      {selectedReview && (
        <DetailedReview
          review={selectedReview}
          onBackClick={clearSelectedReview}
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
