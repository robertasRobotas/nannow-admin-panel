import { use, useEffect, useState } from "react";
import Button from "../Button/Button";
import SearchBar from "../SearchBar/SearchBar";
import Cards from "./Cards/Cards";
import styles from "./users.module.css";
import axios from "axios";
import { getAllUsers } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import paginateStyles from "../../styles/paginate.module.css";
import ReactPaginate from "react-paginate";

const Users = () => {
  const [isSelectedClients, setSelectedClients] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [modeReady, setModeReady] = useState(false);

  // Sync selected mode with URL query (?mode=clients|providers)
  useEffect(() => {
    if (!router.isReady) return;
    const mode =
      typeof router.query.mode === "string" ? router.query.mode : undefined;
    if (mode === "providers") {
      setSelectedClients(false);
    } else {
      // default to clients
      setSelectedClients(true);
    }
    setModeReady(true);
  }, [router.isReady, router.query.mode, isSelectedClients]);

  const fetchUsers = async () => {
    try {
      setUsers([]);
      const url = isSelectedClients
        ? `admin/users?type=client&startIndex=${itemOffset}&search=${searchText}`
        : `admin/users?type=provider&startIndex=${itemOffset}&search=${searchText}`;
      const response = await getAllUsers(url);
      setUsers(response.data.users.items);
      setItemsPerPage(response.data.users.pageSize);
      setPageCount(
        Math.ceil(response.data.users.total / response.data.users.pageSize),
      );
      setTotalUsers(response.data.users.total);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  };

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalUsers;
    setItemOffset(newOffset);
  };

  useEffect(() => {
    if (!router.isReady || !modeReady) return;
    fetchUsers();
  }, [router.isReady, modeReady, isSelectedClients, itemOffset]);

  return (
    <div className={styles.main}>
      <div className={styles.heading}>
        <div className={styles.headingLeftSide}>
          <Button
            onClick={() => {
              setSelectedClients(true);
              router.replace(
                {
                  pathname: router.pathname,
                  query: { ...router.query, mode: "clients" },
                },
                undefined,
                { shallow: true },
              );
            }}
            title="Clients"
            type="PLAIN"
            isSelected={isSelectedClients}
          />
          <Button
            onClick={() => {
              setSelectedClients(false);
              router.replace(
                {
                  pathname: router.pathname,
                  query: { ...router.query, mode: "providers" },
                },
                undefined,
                { shallow: true },
              );
            }}
            title="Providers"
            type="PLAIN"
            isSelected={!isSelectedClients}
          />
        </div>
        <div>
          <SearchBar
            searchText={searchText}
            setSearchText={setSearchText}
            placeholder="Type username, ID  or email"
            onButtonClick={() => {
              fetchUsers();
              setItemOffset(0);
            }}
          />
        </div>
      </div>
      <Cards users={users} mode={isSelectedClients ? "client" : "provider"} />
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

export default Users;
