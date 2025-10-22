import { useEffect, useState } from "react";
import styles from "./reviews.module.css";
import { reviews } from "@/mocks/reviews";
import { useMediaQuery } from "react-responsive";
import ReviewsList from "./ReviewsList/ReviewsList";
import DetailedReview from "./DetailedReview/DetailedReview";
import { ReviewType } from "@/types/Reviews";
import axios from "axios";
import { useRouter } from "next/router";
import { getAllReviews, getReviewById } from "@/pages/api/fetch";

const Reviews = () => {
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [selectedReview, setReviewById] = useState<ReviewType>();
  const [reviews, setReviews] = useState([]);
  const router = useRouter();

  const fetchReviews = async () => {
    try {
      const response = await getAllReviews();
      setReviews(response.data.result.items);
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
      setReviewById(response.data.result);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (selectedReviewId) {
      fetchReviewById(selectedReviewId);
    }
  }, [selectedReviewId]);

  return (
    <div className={styles.main}>
      {isMobile ? (
        selectedReviewId && selectedReview ? (
          <DetailedReview
            review={selectedReview}
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
          {selectedReviewId && selectedReview && (
            <DetailedReview
              review={selectedReview}
              onBackClick={() => setSelectedReviewId("")}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
