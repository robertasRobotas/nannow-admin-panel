import styles from "./reviewsList.module.css";
import { nunito } from "@/helpers/fonts";
import warningImg from "../../../assets/images/attention.svg";
import flashImg from "../../../assets/images/flash-filled.svg";
import checkMarkImg from "../../../assets/images/green-checkmark.svg";
import { Dispatch, SetStateAction } from "react";
import Review from "./Review/Review";

type ReviewsListProps = {
  reviews: any;
  selectedReviewId: string;
  setSelectedReviewId: Dispatch<SetStateAction<string>>;
};

const ReviewsList = ({
  reviews,
  selectedReviewId,
  setSelectedReviewId,
}: ReviewsListProps) => {
  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>Reviews</div>
      <div>
        {reviews.map((r) => {
          const icon = r.isSolved
            ? checkMarkImg.src
            : r.isInvestigating
            ? flashImg.src
            : warningImg.src;
          return (
            <Review
              key={r.id}
              icon={icon}
              reportedByImg={r.reported_by.imgUrl}
              reportedByName={r.reported_by.name.split(" ")[0]}
              reportedImg={r.reported.imgUrl}
              reportedName={r.reported.name.split(" ")[0]}
              date={r.createdAt}
              isSelected={selectedReviewId === r.id}
              onClick={() => setSelectedReviewId(r.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ReviewsList;
