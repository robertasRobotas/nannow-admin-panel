import styles from "./feedbacksList.module.css";
import { nunito } from "@/helpers/fonts";
import warningImg from "../../../assets/images/attention.svg";
import avatarImg from "../../../assets/images/default-avatar.png";
import paginateStyles from "../../../styles/paginate.module.css";
import checkMarkImg from "../../../assets/images/green-checkmark.svg";
import { Dispatch, SetStateAction, useState } from "react";
import ReactPaginate from "react-paginate";
import { FeedbackType } from "@/types/Feedback";
import Feedback from "./Feedback/Feedback";

type FeedbacksListProps = {
  feedbacks: FeedbackType[];
  selectedFeedbackId: string;
  setSelectedFeedbackId: Dispatch<SetStateAction<string>>;
  itemsPerPage: number;
  pageCount: number;
  totalFeedbacks: number;
  setItemOffset: Dispatch<SetStateAction<number>>;
  setFeedbackById: Dispatch<SetStateAction<FeedbackType | null | undefined>>;
};

const FeedbacksList = ({
  feedbacks,
  selectedFeedbackId,
  setSelectedFeedbackId,
  itemsPerPage,
  pageCount,
  totalFeedbacks,
  setItemOffset,
  setFeedbackById,
}: FeedbacksListProps) => {
  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalFeedbacks;
    setItemOffset(newOffset);
  };

  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>Feedback</div>
      <div className={styles.list}>
        {feedbacks.map((f) => {
          const icon = f.isResolved ? checkMarkImg.src : warningImg.src;
          return (
            <Feedback
              key={f.id}
              icon={icon}
              feedbackByImg={f?.user?.imgUrl ?? avatarImg.src}
              feedbackByName={`${f?.user?.firstName ?? "Deleted"}\n${
                f?.user?.lastName ?? "User"
              }`}
              date={f?.createdAt}
              isSelected={selectedFeedbackId === f.id}
              onClick={() => {
                setFeedbackById(null);
                setSelectedFeedbackId(f.id);
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

export default FeedbacksList;
