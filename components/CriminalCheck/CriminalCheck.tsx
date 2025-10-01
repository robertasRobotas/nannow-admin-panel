import { useEffect, useState } from "react";
import styles from "./criminalCheck.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "../Button/Button";
import { getUsersByCriminalRecordStatus } from "@/pages/api/fetch";
import ProfilesList from "./ProfilesList/ProfilesList";
import ReactPaginate from "react-paginate";
import paginateStyles from "../../styles/paginate.module.css";
import axios from "axios";
import { useRouter } from "next/router";

const CriminalCheck = () => {
  const [selected, setSelected] = useState<
    "ALL" | "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [users, setUsers] = useState([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const router = useRouter();

  const fetchUsers = async (status: string, startIndex: number) => {
    try {
      const response = await getUsersByCriminalRecordStatus(status, startIndex);
      setUsers(response.data.users.items);
      setItemsPerPage(response.data.users.pageSize);
      setPageCount(
        Math.ceil(response.data.users.total / response.data.users.pageSize)
      );
      setTotalUsers(response.data.users.total);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/login");
        }
      }
    }
  };

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalUsers;
    setItemOffset(newOffset);
  };

  useEffect(() => {
    fetchUsers(selected === "ALL" ? "" : selected, itemOffset);
  }, [selected, itemOffset]);

  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Criminal check</span>
      </div>
      <div className={styles.categoryBtns}>
        <Button
          onClick={() => setSelected("ALL")}
          title="All"
          type="PLAIN"
          isSelected={selected === "ALL"}
        />
        <Button
          onClick={() => setSelected("NOT_SUBMITTED")}
          title="Not Provided"
          type="PLAIN"
          isSelected={selected === "NOT_SUBMITTED"}
        />
        <Button
          onClick={() => setSelected("PENDING")}
          title="Pending"
          type="PLAIN"
          isSelected={selected === "PENDING"}
        />
        <Button
          onClick={() => setSelected("APPROVED")}
          title="Approved"
          type="PLAIN"
          isSelected={selected === "APPROVED"}
        />
        <Button
          onClick={() => setSelected("REJECTED")}
          title="Rejected"
          type="PLAIN"
          isSelected={selected === "REJECTED"}
        />
      </div>
      <div className={styles.profilesWrapper}>
        <ProfilesList users={users} />
      </div>
      <ReactPaginate
        breakLabel="..."
        nextLabel=""
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
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
  );
};

export default CriminalCheck;
