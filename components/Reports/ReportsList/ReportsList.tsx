import Report from "./Report/Report";
import styles from "./reportsList.module.css";
import { nunito } from "@/helpers/fonts";
import warningImg from "../../../assets/images/attention.svg";
import avatarImg from "../../../assets/images/default-avatar.png";
import paginateStyles from "../../../styles/paginate.module.css";
import checkMarkImg from "../../../assets/images/green-checkmark.svg";
import { Dispatch, SetStateAction, useState } from "react";
import ReactPaginate from "react-paginate";

type ReportsListProps = {
  reports: ReportType[];
  selectedReportId: string;
  setSelectedReportId: Dispatch<SetStateAction<string>>;
  itemsPerPage: number;
  pageCount: number;
  totalReports: number;
  setItemOffset: Dispatch<SetStateAction<number>>;
  setReportById: Dispatch<SetStateAction<ReportType | null | undefined>>;
};

const ReportsList = ({
  reports,
  selectedReportId,
  setSelectedReportId,
  itemsPerPage,
  pageCount,
  totalReports,
  setItemOffset,
  setReportById,
}: ReportsListProps) => {
  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalReports;
    setItemOffset(newOffset);
  };

  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>Reported</div>
      <div className={styles.list}>
        {reports.map((r) => {
          const icon = r.isResolved ? checkMarkImg.src : warningImg.src;
          return (
            <Report
              key={r.id}
              icon={icon}
              reportedByImg={r?.reportedBy?.imgUrl ?? avatarImg.src}
              reportedByName={`${r?.reportedBy?.firstName ?? "Deleted"}\n${
                r?.reportedBy?.lastName ?? "User"
              }`}
              reportedImg={r?.reportedUser?.imgUrl ?? avatarImg.src}
              reportedName={`${r?.reportedUser?.firstName ?? "Deleted"}\n${
                r?.reportedUser?.lastName ?? "User"
              }`}
              date={r?.createdAt}
              isSelected={selectedReportId === r.id}
              onClick={() => {
                setReportById(null);
                setSelectedReportId(r.id);
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

export default ReportsList;
