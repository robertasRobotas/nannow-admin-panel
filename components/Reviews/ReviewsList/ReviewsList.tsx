import styles from "./reviewsList.module.css";
import { nunito } from "@/helpers/fonts";
import { Dispatch, SetStateAction } from "react";
import Review from "./Review/Review";
import paginateStyles from "../../../styles/paginate.module.css";
import { ReviewType } from "@/types/Reviews";
import ReactPaginate from "react-paginate";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import { options } from "../../../data/reviewRatingOptions";

type ReviewsListProps = {
  reviews: ReviewType[];
  selectedReviewId: string;
  setSelectedReviewId: Dispatch<SetStateAction<string>>;
  itemsPerPage: number;
  pageCount: number;
  totalReviews: number;
  setItemOffset: Dispatch<SetStateAction<number>>;
  setReviewById: Dispatch<SetStateAction<ReviewType | null | undefined>>;
  selectedOption: number;
  setSelectedOption: Dispatch<SetStateAction<number>>;
  onClickOption?: () => void;
};

const ReviewsList = ({
  reviews,
  selectedReviewId,
  setSelectedReviewId,
  itemsPerPage,
  pageCount,
  totalReviews,
  setItemOffset,
  setReviewById,
  selectedOption,
  setSelectedOption,
  onClickOption,
}: ReviewsListProps) => {
  //const [selectedRating, setSelectedRating] = useState("5.0");
  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalReviews;
    setItemOffset(newOffset);
  };

  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Reviews</span>
        <DropDownButton
          options={options}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          onClickOption={onClickOption}
        />
      </div>
      <div className={styles.list}>
        {reviews.map((r) => {
          return (
            <Review
              key={r.id}
              rating={r.generalRating}
              reviewedByImg={r?.reviewerImgUrl}
              reviewedByName={`${r?.reviewerFirstName}\n${r?.reviewerSurname}`}
              reviewedImg={r?.revieweeImgUrl}
              reviewedName={`${r?.revieweeFirstName}\n${r?.revieweeSurname}`}
              date={r.createdAt}
              isSelected={selectedReviewId === r.id}
              onClick={() => {
                setSelectedReviewId(r.id);
              }}
            />
          );
        })}
      </div>
      <div className={styles.paginateContainer}>
        <ReactPaginate
          breakLabel="..."
          nextLabel=""
          onPageChange={handlePageClick}
          pageRangeDisplayed={1}
          marginPagesDisplayed={1}
          pageCount={pageCount}
          previousLabel=""
          renderOnZeroPageCount={null}
          containerClassName={paginateStyles.paginateWrapper}
          pageClassName={paginateStyles.pageBtn}
          pageLinkClassName={paginateStyles.pageLink}
          activeClassName={paginateStyles.activePage}
          nextClassName={paginateStyles.nextPageBtn}
          nextLinkClassName={paginateStyles.nextLink}
          previousClassName={paginateStyles.prevPageBtn}
          previousLinkClassName={paginateStyles.prevLink}
          breakClassName={paginateStyles.break}
        />
      </div>
    </div>
  );
};

export default ReviewsList;
