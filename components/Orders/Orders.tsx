import { useEffect, useState } from "react";
import styles from "./orders.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "../Button/Button";
import { getOrders } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import ReactPaginate from "react-paginate";
import paginateStyles from "../../styles/paginate.module.css";
import axios from "axios";
import DropDownButton from "../DropDownButton/DropDownButton";
import OrdersList from "./OrdersList/OrdersList";
import { options } from "@/data/orderStatusOptions";

const Orders = () => {
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const [orders, setOrders] = useState([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const router = useRouter();

  const fetchOrders = async (status: string, startIndex: number) => {
    try {
      const response = await getOrders(status, startIndex);
      setOrders(response.data.result.items);
      setItemsPerPage(response.data.result.pageSize);
      setPageCount(
        Math.ceil(response.data.result.total / response.data.result.pageSize)
      );
      setTotalUsers(response.data.result.total);
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
    fetchOrders(options[selectedOption].value, itemOffset);
  }, [selectedOption, itemOffset]);

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
      </div>
      <div className={styles.ordersWrapper}>
        <OrdersList orders={orders} />
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
