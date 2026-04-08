import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./orders.module.css";
import { nunito } from "@/helpers/fonts";
import {
  getCanceledPendingFinancialOrders,
  getCanceledPendingFinancialOrdersCount,
  getClosedOrders,
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
import SearchBar from "@/components/SearchBar/SearchBar";
import { OrderType } from "@/types/Order";
import Button from "../Button/Button";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";

const orderFilterOptions = [
  { title: "All", value: "" },
  { title: "ORDER_CREATED (WITHOUT DIRECT BOOKING)", value: "ORDER_CREATED" },
  {
    title: "ORDER_CREATED (DIRECT ORDER TO PROVIDER)",
    value: "ORDER_CREATED_DIRECT",
  },
  {
    title: "CLIENT_ORDER_CREATION_IN_PROCESS",
    value: "CLIENT_ORDER_CREATION_IN_PROCESS",
  },
  { title: "PROVIDER_OFFERED_SERVICE", value: "PROVIDER_OFFERED_SERVICE" },
  {
    title: "PROVIDER_ACCEPTED_DIRECT_OFFER",
    value: "PROVIDER_ACCEPTED_DIRECT_OFFER",
  },
  {
    title: "PROVIDER_REJECTED_DIRECT_OFFER",
    value: "PROVIDER_REJECTED_DIRECT_OFFER",
  },
  { title: "BOTH_APPROVED", value: "BOTH_APPROVED" },
  {
    title: "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS",
    value: "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS",
  },
  {
    title: "PROVIDER_MARKED_AS_SERVICE_ENDED",
    value: "PROVIDER_MARKED_AS_SERVICE_ENDED",
  },
  { title: "CANCELED_BY_CLIENT", value: "CANCELED_BY_CLIENT" },
  { title: "CANCELED_BY_PROVIDER", value: "CANCELED_BY_PROVIDER" },
  {
    title: "CANCELED_NOT_PAID_BY_CLIENT",
    value: "CANCELED_NOT_PAID_BY_CLIENT",
  },
  { title: "Not started in time", value: "NOT_STARTED_IN_TIME" },
  { title: "Not Ended in time", value: "NOT_ENDED_IN_TIME" },
  { title: "Closed by admins", value: "CLOSED_BY_ADMINS" },
] as const;

const Orders = () => {
  type ActiveOrdersFilter =
    | "DEFAULT"
    | "NOT_ENDED"
    | "NOT_PAID"
    | "CANCELED_NOT_PAID"
    | "CLOSED_BY_ADMINS";
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveOrdersFilter>(
    "DEFAULT",
  );
  const [notEndedOrdersQTY, setNotEndedOrdersQTY] = useState<number>(0);
  const [notPaidOrdersQTY, setNotPaidOrdersQTY] = useState<number>(0);
  const [canceledNotPaidOrdersQTY, setCanceledNotPaidOrdersQTY] =
    useState<number>(0);
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(0);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentlyChangedOrderIds, setRecentlyChangedOrderIds] = useState<
    Record<string, true>
  >({});
  const recentlyChangedTimeoutsRef = useRef<Record<string, number>>({});
  const router = useRouter();
  const { lastEvent } = useAdminSocket();

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

  const fetchCreatedOrdersByBookingType = useCallback(
    async (isDirectOrderToProvider: boolean, startIndex: number) => {
      try {
        const matchingOrders: OrderType[] = [];
        let nextStartIndex = 0;
        let total = 0;
        let pageSize = 20;

        do {
          const response = await getOrders("ORDER_CREATED", nextStartIndex);
          const result = response.data.result as {
            items: OrderType[];
            total: number;
            pageSize: number;
          };

          total = result.total;
          pageSize = result.pageSize;
          matchingOrders.push(
            ...result.items.filter(
              (order) =>
                Boolean(order.isDirectOrderToProvider) ===
                isDirectOrderToProvider,
            ),
          );
          nextStartIndex += result.pageSize;
        } while (nextStartIndex < total);

        setItemsPerPage(pageSize);
        setPageCount(Math.ceil(matchingOrders.length / pageSize));
        setTotalUsers(matchingOrders.length);
        setOrders(matchingOrders.slice(startIndex, startIndex + pageSize));
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

  const fetchCanceledNotPaidOrders = useCallback(
    async (startIndex: number) => {
      try {
        const response = await getCanceledPendingFinancialOrders(startIndex, 20);
        const result = response.data.result as {
          items: OrderType[];
          total: number;
          pageSize: number;
        };
        setOrders(result.items);
        setItemsPerPage(result.pageSize);
        setPageCount(
          Math.ceil(result.total / result.pageSize),
        );
        setTotalUsers(result.total);
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

  const fetchClosedOrders = useCallback(
    async (startIndex: number) => {
      try {
        const response = await getClosedOrders(startIndex);
        const result = response.data.result as {
          items: OrderType[];
          total: number;
          pageSize: number;
        };
        setOrders(result.items);
        setItemsPerPage(result.pageSize);
        setPageCount(Math.ceil(result.total / result.pageSize));
        setTotalUsers(result.total);
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

  const fetchCanceledNotPaidOrdersCount = useCallback(async () => {
    try {
      const response = await getCanceledPendingFinancialOrdersCount();
      const count = response.data?.count ?? 0;
      setCanceledNotPaidOrdersQTY(Number(count) || 0);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [router]);

  const refetchCurrentOrders = useCallback(() => {
    if (activeFilter === "NOT_ENDED") {
      fetchOrders("NOT_ENDED_IN_TIME", itemOffset);
      return;
    }
    if (activeFilter === "NOT_PAID") {
      fetchNotPaidOrders("NOT_PAID", itemOffset);
      return;
    }
    if (activeFilter === "CANCELED_NOT_PAID") {
      fetchCanceledNotPaidOrders(itemOffset);
      return;
    }
    if (activeFilter === "CLOSED_BY_ADMINS") {
      fetchClosedOrders(itemOffset);
      return;
    }
    const selectedFilterValue = orderFilterOptions[selectedOption].value;
    if (selectedFilterValue === "CLOSED_BY_ADMINS") {
      fetchClosedOrders(itemOffset);
      return;
    }
    if (selectedFilterValue === "ORDER_CREATED_DIRECT") {
      fetchCreatedOrdersByBookingType(true, itemOffset);
      return;
    }
    if (selectedFilterValue === "ORDER_CREATED") {
      fetchCreatedOrdersByBookingType(false, itemOffset);
      return;
    }
    fetchOrders(selectedFilterValue, itemOffset);
  }, [
    activeFilter,
    selectedOption,
    itemOffset,
    fetchOrders,
    fetchNotPaidOrders,
    fetchCanceledNotPaidOrders,
    fetchClosedOrders,
    fetchCreatedOrdersByBookingType,
  ]);

  const markOrderAsRecentlyChanged = useCallback((orderId: string) => {
    setRecentlyChangedOrderIds((prev) => ({ ...prev, [orderId]: true }));

    const existingTimeout = recentlyChangedTimeoutsRef.current[orderId];
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    recentlyChangedTimeoutsRef.current[orderId] = window.setTimeout(() => {
      setRecentlyChangedOrderIds((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      delete recentlyChangedTimeoutsRef.current[orderId];
    }, 8000);
  }, []);

  useEffect(() => {
    refetchCurrentOrders();
  }, [refetchCurrentOrders]);

  useEffect(() => {
    fetchNotEndedOrdersCount();
  }, [fetchNotEndedOrdersCount]);
  useEffect(() => {
    fetchNotPaidOrdersCount();
  }, [fetchNotPaidOrdersCount]);
  useEffect(() => {
    fetchCanceledNotPaidOrdersCount();
  }, [fetchCanceledNotPaidOrdersCount]);

  useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.type !== "ORDER_CREATED" &&
      lastEvent.type !== "ORDER_CONFIRMED" &&
      lastEvent.type !== "ORDER_CANCELED"
    ) {
      return;
    }

    markOrderAsRecentlyChanged(lastEvent.orderId);
    refetchCurrentOrders();
    fetchNotEndedOrdersCount();
    fetchNotPaidOrdersCount();
    fetchCanceledNotPaidOrdersCount();
  }, [
    lastEvent,
    markOrderAsRecentlyChanged,
    refetchCurrentOrders,
    fetchNotEndedOrdersCount,
    fetchNotPaidOrdersCount,
    fetchCanceledNotPaidOrdersCount,
  ]);

  useEffect(() => {
    return () => {
      Object.values(recentlyChangedTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      recentlyChangedTimeoutsRef.current = {};
    };
  }, []);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalUsers;
    setItemOffset(newOffset);
  };

  const handleIgnoredOrdersClick = () => {
    setActiveFilter("NOT_ENDED");
    setItemOffset(0);
  };

  const handleNotPaidOrdersClick = () => {
    setActiveFilter("NOT_PAID");
    setItemOffset(0);
  };

  const handleCanceledNotPaidOrdersClick = () => {
    setActiveFilter("CANCELED_NOT_PAID");
    setItemOffset(0);
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
          options={orderFilterOptions as unknown as {
            title: string;
            icon?: string;
            value: string;
            attentionNumber?: number;
          }[]}
          selectedOption={selectedOption}
          setSelectedOption={(option) => {
            setSelectedOption(option);
            setActiveFilter("DEFAULT");
            setItemOffset(0);
          }}
        />
        {notEndedOrdersQTY > 0 && (
          <div style={{ marginLeft: 12 }}>
            <Button
              title="Not ended"
              type="PLAIN"
              attentionNumber={notEndedOrdersQTY}
              onClick={() => {
                handleIgnoredOrdersClick();
              }}
            />
          </div>
        )}
        {notPaidOrdersQTY > 0 && (
          <div style={{ marginLeft: 12 }}>
            <Button
              title="Ended but not paid"
              type="PLAIN"
              attentionNumber={notPaidOrdersQTY}
              onClick={() => {
                handleNotPaidOrdersClick();
              }}
            />
          </div>
        )}
        {canceledNotPaidOrdersQTY > 0 && (
          <div style={{ marginLeft: 12 }}>
            <Button
              title="Canceled not paid"
              type="PLAIN"
              attentionNumber={canceledNotPaidOrdersQTY}
              onClick={() => {
                handleCanceledNotPaidOrdersClick();
              }}
            />
          </div>
        )}
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
        <OrdersList
          orders={displayedOrders}
          recentlyChangedOrderIds={recentlyChangedOrderIds}
        />
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
