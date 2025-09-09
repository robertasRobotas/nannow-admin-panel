import styles from "./reviewsList.module.css";
import { nunito } from "@/helpers/fonts";
import { Dispatch, SetStateAction, useState } from "react";
import Review from "./Review/Review";
import starImg from "../../../assets/images/star-filled.svg";
import DropDownMenu from "./DropDownMenu/DropDownMenu";

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
  const [selectedRating, setSelectedRating] = useState("5.0");
  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Reviews</span>
        <DropDownMenu
          options={["5.0", "4.0", "3.0", "2.0", "1.0"]}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
        />
      </div>
      <div>
        {reviews
          .filter((r) => r.rating === Number(selectedRating))
          .map((r) => {
            return (
              <Review
                key={r.id}
                rating={r.rating}
                reviewedByImg={r.reviewed_by.imgUrl}
                reviewedByName={r.reviewed_by.name.split(" ")[0]}
                reviewedImg={r.reviewed.imgUrl}
                reviewedName={r.reviewed.name.split(" ")[0]}
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
