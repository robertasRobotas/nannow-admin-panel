import styles from "./reviewsList.module.css";
import { nunito } from "@/helpers/fonts";
import { Dispatch, SetStateAction, useState } from "react";
import Review from "./Review/Review";
import paginateStyles from "../../../styles/paginate.module.css";
import DropDownMenu from "./DropDownMenu/DropDownMenu";
import { ReviewType } from "@/types/Reviews";
import ReactPaginate from "react-paginate";

type ReviewsListProps = {
  reviews: ReviewType[];
  selectedReviewId: string;
  setSelectedReviewId: Dispatch<SetStateAction<string>>;
  itemsPerPage: number;
  pageCount: number;
  totalReviews: number;
  setItemOffset: Dispatch<SetStateAction<number>>;
  setReviewById: Dispatch<SetStateAction<ReviewType | null | undefined>>;
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
        {/*
        <DropDownMenu
          options={["5.0", "4.0", "3.0", "2.0", "1.0"]}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
        />
        */}
      </div>
      <div className={styles.list}>
        {reviews.map((r) => {
          return (
            <Review
              key={r.id}
              rating={r.generalRating}
              reviewedByImg={r.reviewer.imgUrl}
              reviewedByName={`${r.reviewer.firstName}\n${r.reviewer.lastName}`}
              reviewedImg={r.reviewee.imgUrl}
              reviewedName={`${r.reviewee.firstName}\n${r.reviewee.lastName}`}
              date={r.createdAt}
              isSelected={selectedReviewId === r.id}
              onClick={() => {
                setReviewById(null);
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
