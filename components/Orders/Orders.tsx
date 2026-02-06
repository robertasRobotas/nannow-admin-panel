import { useCallback, useEffect, useState } from "react";
import styles from "./orders.module.css";
import { nunito } from "@/helpers/fonts";
import {
  getNotEndedOrdersCount,
  getNotPaidOrders,
  getNotPaidOrdersCount,
  getOrders,
} from "@/pages/api/fetch";
import { useRouter } from "next/router";
import ReactPaginate from "react-paginate";
import paginateStyles from "../../styles/paginate.module.css";
import axios from "axios";
import DropDownButton from "../DropDownButton/DropDownButton";
import OrdersList from "./OrdersList/OrdersList";
import { options } from "@/data/orderStatusOptions";
import SearchBar from "@/components/SearchBar/SearchBar";
import { OrderType } from "@/types/Order";
import Button from "../Button/Button";

const Orders = () => {
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [notEndedOrdersQTY, setNotEndedOrdersQTY] = useState<number>(0);
  const [notPaidOrdersQTY, setNotPaidOrdersQTY] = useState<number>(0);
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const router = useRouter();

  const fetchOrders = useCallback(
    async (status: string, startIndex: number) => {
      try {
        const response = await getOrders(status, startIndex);
        setOrders(response.data.result.items);
        setItemsPerPage(response.data.result.pageSize);
        setPageCount(
          Math.ceil(response.data.result.total / response.data.result.pageSize),
        );
        setTotalUsers(response.data.result.total);
      } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
          if (err.status === 401) {
            router.push("/");
          }
        }
      }
    },
    [router],
  );

  const fetchNotPaidOrders = useCallback(
    async (status: string, startIndex: number) => {
      try {
        const response = await getNotPaidOrders(status, startIndex);
        setOrders(response.data.result.items);
        setItemsPerPage(response.data.result.pageSize);
        setPageCount(
          Math.ceil(response.data.result.total / response.data.result.pageSize),
        );
        setTotalUsers(response.data.result.total);
      } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
          if (err.status === 401) {
            router.push("/");
          }
        }
      }
    },
    [router],
  );

  const fetchNotEndedOrdersCount = useCallback(async () => {
    try {
      const response = await getNotEndedOrdersCount();
      const count =
        response.data?.result?.count ??
        response.data?.count ??
        response.data?.result ??
        0;
      setNotEndedOrdersQTY(count);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [router]);

  const fetchNotPaidOrdersCount = useCallback(async () => {
    try {
      const response = await getNotPaidOrdersCount();
      const count =
        response.data?.result?.count ??
        response.data?.count ??
        response.data?.result ??
        0;
      setNotPaidOrdersQTY(count);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [router]);

  useEffect(() => {
    fetchOrders(options[selectedOption].value, itemOffset);
  }, [selectedOption, itemOffset, fetchOrders]);

  useEffect(() => {
    fetchNotEndedOrdersCount();
  }, [fetchNotEndedOrdersCount]);
  useEffect(() => {
    fetchNotPaidOrdersCount();
  }, [fetchNotPaidOrdersCount]);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalUsers;
    setItemOffset(newOffset);
  };

  const handleIgnoredOrdersClick = () => {
    fetchOrders("NOT_ENDED_IN_TIME", itemOffset);
  };

  const handleNotPaidOrdersClick = () => {
    fetchNotPaidOrders("NOT_PAID", itemOffset);
  };

  const normalizedQuery = orderIdQuery.trim().toLowerCase();
  const displayedOrders =
    normalizedQuery.length > 0
      ? orders.filter((o) =>
          (o.orderPrettyId ?? "").toLowerCase().includes(normalizedQuery),
        )
      : orders;

  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Orders</span>
      </div>
      <div className={styles.categoryBtns}>
        <DropDownButton
          options={options}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
        <div style={{ marginLeft: 12 }}>
          <Button
            title={`Not ended (${notEndedOrdersQTY})`}
            type="DELETE"
            onClick={() => {
              handleIgnoredOrdersClick();
            }}
          />
        </div>
        <div style={{ marginLeft: 12 }}>
          <Button
            title={`Ended but not paid (${notPaidOrdersQTY})`}
            type="DELETE"
            onClick={() => {
              handleNotPaidOrdersClick();
            }}
          />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <SearchBar
            placeholder="Type order ID"
            searchText={orderIdQuery}
            setSearchText={setOrderIdQuery}
            onButtonClick={() => {
              // No-op: filtering happens live as you type
              // Keep the callback to match component API
            }}
          />
        </div>
      </div>
      <div className={styles.ordersWrapper}>
        <OrdersList orders={displayedOrders} />
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

export default Orders;
