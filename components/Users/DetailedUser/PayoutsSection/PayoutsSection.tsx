import styles from "./payoutsSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserDetails } from "@/types/Client";
import { GetPayoutsResponse, Payout } from "@/types/Payout";
import {
  getOrderById,
  getProviderPayouts,
  refreshPayoutByOrderId,
} from "@/pages/api/fetch";
import axios from "axios";
import { useRouter } from "next/router";
import ReactPaginate from "react-paginate";
import paginateStyles from "@/styles/paginate.module.css";
import Order from "@/components/Orders/OrdersList/Order/Order";
import defaultUserImg from "@/assets/images/default-avatar.png";
import calendarImg from "@/assets/images/calendar.svg";
import { OrderType } from "@/types/Order";
import { toast } from "react-toastify";

type PayoutsSectionProps = {
  user: UserDetails;
  onBackClick: () => void;
};

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch {
    return `${amount ?? 0} ${currency || "EUR"}`;
  }
};

const openNativeDatePicker = (input: HTMLInputElement | null) => {
  if (!input) return;
  input.focus();
  const pickerInput = input as HTMLInputElement & {
    showPicker?: () => void;
  };
  if (typeof pickerInput.showPicker === "function") {
    pickerInput.showPicker();
    return;
  }
  input.click();
};

const extractPayoutOrderId = (payout: Payout): string | null => {
  const candidateKeys = [
    payout.orderId,
    payout.order?.id,
    (payout as unknown as { orderID?: unknown }).orderID,
    (payout as unknown as { order_id?: unknown }).order_id,
    (payout as unknown as { relatedOrderId?: unknown }).relatedOrderId,
  ];

  for (const key of candidateKeys) {
    if (typeof key === "string" && key.trim().length > 0) {
      return key.trim();
    }
  }

  return null;
};

const normalizePayoutStatus = (status?: string | null) =>
  (status ?? "").toLowerCase();

const PayoutsSection = ({ user, onBackClick }: PayoutsSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const router = useRouter();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const defaultStartDate = `${currentYear}-01-01`;
  const defaultEndDate = `${currentYear}-12-31`;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultEndDate);

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [ordersById, setOrdersById] = useState<Record<string, OrderType>>({});
  const [subtotalPaidAmt, setSubtotalPaidAmt] = useState(0);
  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const providerUserId = user?.user?.id;

  const fetchPayouts = useCallback(async () => {
    if (!providerUserId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getProviderPayouts({
        userId: providerUserId,
        startIndex: itemOffset,
        pageSize: itemsPerPage,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
      });
      const data = response.data as GetPayoutsResponse;
      setPayouts(Array.isArray(data.payouts) ? data.payouts : []);
      setTotalCount(data.totalCount ?? 0);
      setSubtotalPaidAmt(data.subtotalPaidAmt ?? 0);
      setPageCount(
        Math.ceil((data.totalCount ?? 0) / (itemsPerPage > 0 ? itemsPerPage : 1)),
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
        if (err.status === 401) {
          router.push("/");
        }
      } else {
        setError("Failed to load payouts");
      }
    } finally {
      setLoading(false);
    }
  }, [appliedEndDate, appliedStartDate, itemOffset, itemsPerPage, providerUserId, router]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  useEffect(() => {
    const missingOrderIds = Array.from(
      new Set(
        payouts
          .filter((payout) => !payout.order)
          .map(extractPayoutOrderId)
          .filter(
            (id): id is string => Boolean(id) && !ordersById[id as string],
          ),
      ),
    );

    if (missingOrderIds.length === 0) return;

    const fetchMissingOrders = async () => {
      const results = await Promise.allSettled(
        missingOrderIds.map(async (orderId) => {
          const response = await getOrderById(orderId);
          const payload = response.data as { result?: OrderType };
          return payload.result;
        }),
      );

      const nextMap: Record<string, OrderType> = {};
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const order = result.value;
        if (order && order.id) {
          nextMap[order.id] = order;
        }
      }

      if (Object.keys(nextMap).length > 0) {
        setOrdersById((prev) => ({ ...prev, ...nextMap }));
      }
    };

    fetchMissingOrders();
  }, [ordersById, payouts]);

  const onApplyFilters = () => {
    const safeStart = startDate || toInputDate(new Date(currentYear, 0, 1));
    const safeEnd = endDate || toInputDate(new Date(currentYear, 11, 31));
    setAppliedStartDate(safeStart);
    setAppliedEndDate(safeEnd);
    setItemOffset(0);
  };

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = event.selected * itemsPerPage;
    setItemOffset(newOffset);
  };

  const getUserImage = (imgUrl?: string) =>
    imgUrl && imgUrl.length > 0 ? imgUrl : defaultUserImg.src;

  const getUserName = (firstName?: string, lastName?: string) =>
    `${firstName ?? "Deleted"} ${lastName ?? "User"}`;

  const refreshPayout = async (orderId: string) => {
    if (refreshingOrderId) return;
    try {
      setRefreshingOrderId(orderId);
      await refreshPayoutByOrderId(orderId);
      toast.success("Payout refresh requested");
      await fetchPayouts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh payout");
    } finally {
      setRefreshingOrderId(null);
    }
  };

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>Payouts</h3>

      <div className={styles.topRow}>
        <div className={styles.filters}>
          <div className={styles.field}>
            <label>Start date</label>
            <div className={styles.dateInputWrap}>
              <input
                ref={startDateInputRef}
                type="date"
                className={styles.dateInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <button
                type="button"
                className={styles.datePickerBtn}
                onClick={() => openNativeDatePicker(startDateInputRef.current)}
                aria-label="Open start date picker"
              >
                <img src={calendarImg.src} alt="" />
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label>End date</label>
            <div className={styles.dateInputWrap}>
              <input
                ref={endDateInputRef}
                type="date"
                className={styles.dateInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button
                type="button"
                className={styles.datePickerBtn}
                onClick={() => openNativeDatePicker(endDateInputRef.current)}
                aria-label="Open end date picker"
              >
                <img src={calendarImg.src} alt="" />
              </button>
            </div>
          </div>
          <div className={styles.applyBtnWrap}>
            <Button title="Apply" type="OUTLINED" onClick={onApplyFilters} />
          </div>
        </div>
        <div className={`${styles.subtotal} ${nunito.className}`}>
          Subtotal paid: {formatMoney(subtotalPaidAmt, "EUR")}
        </div>
      </div>

      {loading && <div className={styles.empty}>Loading...</div>}
      {error && <div className={styles.empty}>{error}</div>}
      {!loading && !error && payouts.length === 0 && (
        <div className={styles.empty}>No payouts for selected dates</div>
      )}

      {!loading && !error && payouts.length > 0 && (
        <>
          <div className={styles.list}>
            {payouts.map((payout) => {
              const payoutOrderId = extractPayoutOrderId(payout);
              const order =
                payout.order ??
                (payoutOrderId ? ordersById[payoutOrderId] : undefined);
              const payoutStatus = normalizePayoutStatus(payout.stripePayoutStatus);
              const showArrivalDate =
                payoutStatus === "pending" || payoutStatus === "in_transit";
              const showPaidAt = payoutStatus === "paid";
              const showFailure = payoutStatus === "failed";
              return (
                <div key={payout.id} className={styles.row}>
                  <div className={styles.rowTop}>
                    <div className={styles.rowColLeft}>
                      <div className={styles.metaItem}>
                        Date: {formatDateTime(payout.createdAt ?? payout.updatedAt)}
                      </div>
                      <div className={styles.stripeDataTitle}>Stripe data</div>
                      <div className={styles.payoutMetaItem}>
                        <b>Status:</b> {payout.stripePayoutStatus ?? "—"}
                      </div>
                      {showArrivalDate && (
                        <div className={styles.payoutMetaItem}>
                          <b>Expected arrival:</b>{" "}
                          {formatDateTime(
                            payout.stripePayoutArrivalDate ?? undefined,
                          )}
                        </div>
                      )}
                      {showPaidAt && (
                        <div className={styles.payoutMetaItem}>
                          <b>Paid at:</b>{" "}
                          {formatDateTime(payout.stripePayoutPaidAt ?? undefined)}
                        </div>
                      )}
                      {showFailure && (
                        <>
                          <div className={styles.payoutMetaItem}>
                            <b>Failed at:</b>{" "}
                            {formatDateTime(
                              payout.stripePayoutFailedAt ?? undefined,
                            )}
                          </div>
                          <div className={styles.payoutMetaItem}>
                            <b>Failure code:</b>{" "}
                            {payout.stripePayoutFailureCode ?? "—"}
                          </div>
                          <div className={styles.payoutMetaItem}>
                            <b>Failure message:</b>{" "}
                            {payout.stripePayoutFailureMessage ?? "—"}
                          </div>
                        </>
                      )}
                    </div>
                    <div className={styles.rowColRight}>
                      <div className={styles.metaItem}>
                        Amount: {formatMoney(payout.paidAmt ?? 0, payout.currency)}
                      </div>
                      {payoutOrderId && (
                        <div className={styles.payoutActions}>
                          <Button
                            title={
                              refreshingOrderId === payoutOrderId
                                ? "Refreshing..."
                                : "Refresh"
                            }
                            type="OUTLINED"
                            onClick={() => refreshPayout(payoutOrderId)}
                            isDisabled={refreshingOrderId !== null}
                            isLoading={refreshingOrderId === payoutOrderId}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {order ? (
                    <Order
                      key={order.id}
                      providerImgUrl={getUserImage(order.approvedProvider?.user?.imgUrl)}
                      clientImgUrl={getUserImage(order.clientUser?.imgUrl)}
                      id={order.id}
                      createdAt={order.createdAt}
                      updatedAt={order.updatedAt}
                      startsAt={order.startsAt}
                      endsAt={order.endsAt}
                      totalPrice={order.totalPrice}
                      providerName={getUserName(
                        order.approvedProvider?.user?.firstName,
                        order.approvedProvider?.user?.lastName,
                      )}
                      clientName={`${getUserName(
                        order.clientUser?.firstName,
                        order.clientUser?.lastName,
                      )} (Client)`}
                      status={order.status}
                      isProviderIgnoredEndNotification={
                        order.isProviderIgnoredEndNotification
                      }
                      pendingProvidersCount={order.pendingProvidersCount}
                    />
                  ) : (
                    <div className={styles.empty}>
                      {payoutOrderId
                        ? "Loading order details..."
                        : "Order details are unavailable"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.paginationRow}>
            <div className={styles.pageSize}>
              <span>Page size</span>
              <select
                className={styles.pageSizeSelect}
                value={itemsPerPage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setItemsPerPage(next);
                  setItemOffset(0);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>Total: {totalCount}</span>
            </div>

            <ReactPaginate
              breakLabel="..."
              nextLabel=""
              onPageChange={handlePageClick}
              pageRangeDisplayed={5}
              pageCount={pageCount}
              forcePage={Math.floor(itemOffset / itemsPerPage)}
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
        </>
      )}

      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default PayoutsSection;
