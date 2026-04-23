import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { useRouter } from "next/router";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import SearchBar from "@/components/SearchBar/SearchBar";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import paginateStyles from "@/styles/paginate.module.css";
import {
  getOrderStatusTitle,
  options as orderStatusOptions,
} from "@/data/orderStatusOptions";
import { getFinancialOrders } from "@/pages/api/fetch";
import {
  FinancialOrderMode,
  FinancialOrderRow,
  FinancialOrdersSubtotal,
  GetFinancialOrdersResponse,
} from "@/types/FinancialOrder";
import calendarImg from "@/assets/images/calendar.svg";
import defaultAvatarImg from "@/assets/images/default-avatar.png";
import styles from "./financialLedger.module.css";

const PAGE_SIZE = 20;

type Tone = "real" | "estimated" | "neutral";

type AmountPresentationItem = {
  amount: string;
  tone: Tone;
  subtitle: string;
  isEmpty: boolean;
};

type AmountPresentation = {
  paid: AmountPresentationItem;
  payout: AmountPresentationItem;
  refund: AmountPresentationItem;
  stripeFee: AmountPresentationItem;
  netProfit: AmountPresentationItem;
};
type PeriodPreset =
  | "today"
  | "this_week"
  | "this_month"
  | "this_year"
  | "custom";

type DateRange = {
  startInput: string;
  endInput: string;
  startIso: string;
  endIso: string;
};

const EMPTY_SUBTOTAL: FinancialOrdersSubtotal = {
  totalOrders: 0,
  clientPaidCents: 0,
  refundCents: 0,
  payoutCents: 0,
  stripeFeeCents: 0,
  grossPlatformRevenueCents: 0,
  netPlatformRevenueCents: 0,
  forecastCount: 0,
  partialRealCount: 0,
  realCount: 0,
};

const SORT_OPTIONS = [
  { title: "Paid latest", value: "paidAt_desc" },
  { title: "Paid oldest", value: "paidAt_asc" },
] as const;

const MODE_OPTIONS: Array<{ title: string; value: FinancialOrderMode | "" }> = [
  { title: "All modes", value: "" },
  { title: "REAL", value: "REAL" },
  { title: "PARTIAL_REAL", value: "PARTIAL_REAL" },
  { title: "FORECAST", value: "FORECAST" },
];

const STATUS_OPTIONS = [
  { title: "All statuses", value: "" },
  ...Array.from(
    new Map(
      orderStatusOptions
        .filter((option) => option.value)
        .map((option) => [option.value, option]),
    ).values(),
  ),
];

const PERIOD_OPTIONS: Array<{
  label: string;
  value: Exclude<PeriodPreset, "custom">;
}> = [
  { label: "Today", value: "today" },
  { label: "This week", value: "this_week" },
  { label: "This month", value: "this_month" },
  { label: "This year", value: "this_year" },
];

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDayStartIso = (inputDate: string) =>
  new Date(`${inputDate}T00:00:00`).toISOString();

const toExclusiveEndIso = (inputDate: string) => {
  const endDate = new Date(`${inputDate}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  return endDate.toISOString();
};

const getPresetRange = (preset: Exclude<PeriodPreset, "custom">): DateRange => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  if (preset === "today") {
    return {
      startInput: toInputDate(todayStart),
      endInput: toInputDate(todayStart),
      startIso: todayStart.toISOString(),
      endIso: todayEnd.toISOString(),
    };
  }

  if (preset === "this_week") {
    const start = new Date(todayStart);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      startInput: toInputDate(start),
      endInput: toInputDate(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

  if (preset === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    return {
      startInput: toInputDate(start),
      endInput: toInputDate(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    startInput: toInputDate(start),
    endInput: toInputDate(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

const formatMoneyFromCents = (value?: number | null) => {
  const amount = typeof value === "number" ? value / 100 : 0;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getPercent = (value: number, total: number) => {
  if (!total) return null;
  return ((value / total) * 100).toFixed(2);
};

const getUserName = (firstName?: string | null, lastName?: string | null) =>
  `${firstName ?? "Deleted"} ${lastName ?? "User"}`.trim();

const getAmountPresentation = (
  order: FinancialOrderRow,
): AmountPresentation => {
  const paidCents =
    typeof order.actualClientPaidCents === "number"
      ? order.actualClientPaidCents
      : (order.clientPaidCents ?? 0);

  const netCents = order.netPlatformRevenueCents ?? 0;

  const percent =
    paidCents > 0 ? ((netCents / paidCents) * 100).toFixed(2) : null;

  const isReal = order.financialMode === "REAL";

  return {
    paid: {
      amount: formatMoneyFromCents(paidCents),
      tone:
        typeof order.actualClientPaidCents === "number" ? "real" : "estimated",
      subtitle:
        typeof order.actualClientPaidCents === "number"
          ? order.paymentStatus
          : "Expected paid",
      isEmpty: false,
    },

    payout: {
      amount: formatMoneyFromCents(
        typeof order.actualPayoutCents === "number"
          ? order.actualPayoutCents
          : (order.displayedPayoutCents ?? order.expectedPayoutCents ?? 0),
      ),
      tone: typeof order.actualPayoutCents === "number" ? "real" : "estimated",
      subtitle:
        typeof order.actualPayoutCents === "number"
          ? "Real payout"
          : "Expected payout",
      isEmpty: false,
    },

    refund: (() => {
      const hasAnyRefund =
        (order.actualRefundCents ?? 0) > 0 ||
        (order.expectedRefundCents ?? 0) > 0 ||
        (order.displayedRefundCents ?? 0) > 0 ||
        Boolean(order.refundedAt);

      if (!hasAnyRefund) {
        return {
          amount: "—",
          tone: "neutral",
          subtitle: "No refund",
          isEmpty: true,
        };
      }

      const hasActualRefund = typeof order.actualRefundCents === "number";

      const cents = hasActualRefund
        ? (order.actualRefundCents ?? 0)
        : (order.displayedRefundCents ?? order.expectedRefundCents ?? 0);

      return {
        amount: formatMoneyFromCents(cents),
        tone: hasActualRefund ? "real" : "estimated",
        subtitle: hasActualRefund ? "Real refund" : "Expected refund",
        isEmpty: false,
      };
    })(),

    stripeFee: (() => {
      const hasKnown = typeof order.knownStripeFeeCents === "number";

      const cents = hasKnown
        ? (order.knownStripeFeeCents ?? 0)
        : (order.forecastStripeFeeCents ?? 0);

      return {
        amount: formatMoneyFromCents(cents),
        tone: hasKnown ? "real" : "estimated",
        subtitle: hasKnown ? "Real fee" : "Estimated fee",
        isEmpty: false,
      };
    })(),

    netProfit: {
      amount: `${formatMoneyFromCents(netCents)}${
        percent ? ` (${percent}%)` : ""
      }`,
      tone: isReal ? "real" : "estimated",
      subtitle: `Gross ${formatMoneyFromCents(
        order.grossPlatformRevenueCents ?? 0,
      )}`,
      isEmpty: false,
    },
  };
};

const getModeClassName = (mode: FinancialOrderMode) => {
  if (mode === "REAL") return styles.modeReal;
  if (mode === "PARTIAL_REAL") return styles.modePartialReal;
  return styles.modeForecast;
};

const getToneClassName = (tone: "real" | "estimated" | "neutral") => {
  if (tone === "real") return styles.valueReal;
  if (tone === "estimated") return styles.valueEstimated;
  return styles.valueNeutral;
};

const openNativeDatePicker = (input: HTMLInputElement | null) => {
  if (!input) return;
  input.focus();
  const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof pickerInput.showPicker === "function") {
    pickerInput.showPicker();
    return;
  }
  input.click();
};

const FinancialLedger = () => {
  const router = useRouter();
  const defaultRange = useMemo(() => getPresetRange("this_month"), []);
  const [items, setItems] = useState<FinancialOrderRow[]>([]);
  const [subtotal, setSubtotal] =
    useState<FinancialOrdersSubtotal>(EMPTY_SUBTOTAL);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [itemOffset, setItemOffset] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedStatusOption, setSelectedStatusOption] = useState(0);
  const [selectedModeOption, setSelectedModeOption] = useState(0);
  const [selectedSortOption, setSelectedSortOption] = useState(0);
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodPreset>("this_month");
  const [startDateInput, setStartDateInput] = useState(defaultRange.startInput);
  const [endDateInput, setEndDateInput] = useState(defaultRange.endInput);
  const [appliedStartDate, setAppliedStartDate] = useState(
    defaultRange.startIso,
  );
  const [appliedEndDate, setAppliedEndDate] = useState(defaultRange.endIso);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const selectedSort = SORT_OPTIONS[selectedSortOption]?.value ?? "paidAt_desc";
  const selectedStatus = STATUS_OPTIONS[selectedStatusOption]?.value ?? "";
  const selectedMode = MODE_OPTIONS[selectedModeOption]?.value ?? "";

  const updateLedgerQuery = useCallback(
    (
      params: {
        page?: number;
        q?: string;
        status?: string;
        mode?: string;
        sort?: string;
        period?: PeriodPreset;
        start?: string;
        end?: string;
      },
      method: "push" | "replace" = "push",
    ) => {
      if (!router.isReady) return;
      const nextQuery = { ...router.query };
      if (typeof params.page === "number" && params.page > 0) {
        nextQuery.page = String(params.page);
      }
      if (typeof params.q === "string" && params.q.trim().length > 0) {
        nextQuery.q = params.q.trim();
      } else if (params.q !== undefined) {
        delete nextQuery.q;
      }
      if (params.status && params.status.length > 0) {
        nextQuery.status = params.status;
      } else if (params.status !== undefined) {
        delete nextQuery.status;
      }
      if (params.mode && params.mode.length > 0) {
        nextQuery.mode = params.mode;
      } else if (params.mode !== undefined) {
        delete nextQuery.mode;
      }
      if (params.sort && params.sort !== "paidAt_desc") {
        nextQuery.sort = params.sort;
      } else if (params.sort !== undefined) {
        delete nextQuery.sort;
      }

      const nextPeriod = params.period ?? selectedPeriod;
      if (nextPeriod && nextPeriod !== "this_month") {
        nextQuery.period = nextPeriod;
      } else {
        delete nextQuery.period;
      }

      const nextStart = params.start;
      const nextEnd = params.end;
      if (typeof nextStart === "string" && nextStart.length > 0) {
        nextQuery.start = nextStart;
      } else if (nextStart !== undefined) {
        delete nextQuery.start;
      }
      if (typeof nextEnd === "string" && nextEnd.length > 0) {
        nextQuery.end = nextEnd;
      } else if (nextEnd !== undefined) {
        delete nextQuery.end;
      }
      router[method](
        { pathname: router.pathname, query: nextQuery },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router, selectedPeriod],
  );

  const fetchFinancialOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getFinancialOrders({
        startIndex: itemOffset,
        pageSize,
        search: appliedSearch.trim() || undefined,
        status: selectedStatus || undefined,
        financialMode: selectedMode || undefined,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        sort: selectedSort,
      });
      const payload = response.data as
        | GetFinancialOrdersResponse
        | { result?: GetFinancialOrdersResponse };
      const data =
        (payload as { result?: GetFinancialOrdersResponse }).result ??
        (payload as GetFinancialOrdersResponse);

      const nextItems = Array.isArray(data?.items) ? data.items : [];
      const nextTotal = Number(data?.total ?? 0);
      const nextPageSize = Number(data?.pageSize ?? pageSize) || pageSize;

      setItems(nextItems);
      setSubtotal(data?.subtotal ?? EMPTY_SUBTOTAL);
      setTotal(nextTotal);
      setPageSize(nextPageSize);
      setPageCount(Math.max(1, Math.ceil(nextTotal / nextPageSize)));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setError("Failed to load financial ledger.");
      setItems([]);
      setSubtotal(EMPTY_SUBTOTAL);
      setTotal(0);
      setPageCount(1);
    } finally {
      setLoading(false);
    }
  }, [
    appliedEndDate,
    appliedSearch,
    appliedStartDate,
    itemOffset,
    pageSize,
    router,
    selectedMode,
    selectedSort,
    selectedStatus,
  ]);

  useEffect(() => {
    fetchFinancialOrders();
  }, [fetchFinancialOrders]);

  useEffect(() => {
    if (!router.isReady) return;
    const qFromQuery = typeof router.query.q === "string" ? router.query.q : "";
    setSearchText(qFromQuery);
    setAppliedSearch(qFromQuery);

    const statusFromQuery =
      typeof router.query.status === "string" ? router.query.status : "";
    const statusIndex = STATUS_OPTIONS.findIndex(
      (option) => option.value === statusFromQuery,
    );
    setSelectedStatusOption(statusIndex >= 0 ? statusIndex : 0);

    const modeFromQuery =
      typeof router.query.mode === "string" ? router.query.mode : "";
    const modeIndex = MODE_OPTIONS.findIndex((option) => option.value === modeFromQuery);
    setSelectedModeOption(modeIndex >= 0 ? modeIndex : 0);

    const sortFromQuery =
      typeof router.query.sort === "string" ? router.query.sort : "paidAt_desc";
    const sortIndex = SORT_OPTIONS.findIndex((option) => option.value === sortFromQuery);
    setSelectedSortOption(sortIndex >= 0 ? sortIndex : 0);

    const periodFromQuery =
      typeof router.query.period === "string" ? router.query.period : "this_month";
    const safePeriod: PeriodPreset =
      periodFromQuery === "today" ||
      periodFromQuery === "this_week" ||
      periodFromQuery === "this_month" ||
      periodFromQuery === "this_year" ||
      periodFromQuery === "custom"
        ? periodFromQuery
        : "this_month";

    if (safePeriod === "custom") {
      const startFromQuery =
        typeof router.query.start === "string" ? router.query.start : "";
      const endFromQuery = typeof router.query.end === "string" ? router.query.end : "";
      const hasValidInputs = startFromQuery.length > 0 && endFromQuery.length > 0;
      if (hasValidInputs) {
        setSelectedPeriod("custom");
        setStartDateInput(startFromQuery);
        setEndDateInput(endFromQuery);
        setAppliedStartDate(toDayStartIso(startFromQuery));
        setAppliedEndDate(toExclusiveEndIso(endFromQuery));
      }
    } else {
      const range = getPresetRange(safePeriod);
      setSelectedPeriod(safePeriod);
      setStartDateInput(range.startInput);
      setEndDateInput(range.endInput);
      setAppliedStartDate(range.startIso);
      setAppliedEndDate(range.endIso);
    }

    const pageFromQuery =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const safePage =
      Number.isFinite(pageFromQuery) && pageFromQuery > 0
        ? Math.floor(pageFromQuery)
        : 1;
    setItemOffset((safePage - 1) * pageSize);
  }, [
    pageSize,
    router.isReady,
    router.query.mode,
    router.query.page,
    router.query.period,
    router.query.q,
    router.query.sort,
    router.query.start,
    router.query.status,
    router.query.end,
  ]);

  const applyCustomDateRange = () => {
    if (!startDateInput || !endDateInput) {
      setValidationError("Select both start and end date.");
      return;
    }

    if (
      new Date(`${startDateInput}T00:00:00`).getTime() >
      new Date(`${endDateInput}T00:00:00`).getTime()
    ) {
      setValidationError("Start date must be before end date.");
      return;
    }

    setValidationError("");
    setSelectedPeriod("custom");
    setAppliedStartDate(toDayStartIso(startDateInput));
    setAppliedEndDate(toExclusiveEndIso(endDateInput));
    updateLedgerQuery(
      {
        page: 1,
        q: appliedSearch,
        status: selectedStatus,
        mode: selectedMode,
        sort: selectedSort,
        period: "custom",
        start: startDateInput,
        end: endDateInput,
      },
      "push",
    );
  };

  const applyPresetRange = (preset: Exclude<PeriodPreset, "custom">) => {
    const range = getPresetRange(preset);
    setSelectedPeriod(preset);
    setValidationError("");
    setStartDateInput(range.startInput);
    setEndDateInput(range.endInput);
    setAppliedStartDate(range.startIso);
    setAppliedEndDate(range.endIso);
    updateLedgerQuery(
      {
        page: 1,
        q: appliedSearch,
        status: selectedStatus,
        mode: selectedMode,
        sort: selectedSort,
        period: preset,
        start: "",
        end: "",
      },
      "push",
    );
  };

  const handlePageClick = (event: { selected: number }) => {
    updateLedgerQuery(
      {
        page: event.selected + 1,
        q: appliedSearch,
        status: selectedStatus,
        mode: selectedMode,
        sort: selectedSort,
      },
      "push",
    );
  };

  const currentPage =
    pageCount === 0 ? 0 : Math.floor(itemOffset / pageSize) + 1;
  const appliedStartLabel = toInputDate(new Date(appliedStartDate));
  const appliedEndLabel = toInputDate(
    new Date(new Date(appliedEndDate).getTime() - 24 * 60 * 60 * 1000),
  );
  const subtotalPercent = getPercent(
    subtotal.netPlatformRevenueCents,
    subtotal.clientPaidCents,
  );

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h2 className={`${styles.title} ${nunito.className}`}>
            Financial ledger
          </h2>
          <div
            className={styles.subtitle}
          >{`${total} orders, page ${currentPage}/${pageCount}`}</div>
        </div>
        <SearchBar
          placeholder="Search order ID or user"
          searchText={searchText}
          setSearchText={setSearchText}
          onButtonClick={() => {
            setAppliedSearch(searchText);
            updateLedgerQuery({
              page: 1,
              q: searchText,
              status: selectedStatus,
              mode: selectedMode,
              sort: selectedSort,
            });
          }}
        />
      </div>

      <div className={styles.filtersPanel}>
        <div className={styles.periodRow}>
          <div className={styles.periodButtons}>
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.periodButton} ${
                  selectedPeriod === option.value
                    ? styles.periodButtonActive
                    : ""
                }`}
                onClick={() => applyPresetRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={styles.customDateControls}>
            <div className={styles.dateField}>
              <span>Start</span>
              <div className={styles.dateInputWrap}>
                <input
                  ref={startDateInputRef}
                  type="date"
                  className={styles.dateInput}
                  value={startDateInput}
                  onChange={(e) => {
                    setSelectedPeriod("custom");
                    setStartDateInput(e.target.value);
                  }}
                />
                <button
                  type="button"
                  className={styles.datePickerBtn}
                  onClick={() =>
                    openNativeDatePicker(startDateInputRef.current)
                  }
                  aria-label="Open start date picker"
                >
                  <img src={calendarImg.src} alt="" />
                </button>
              </div>
            </div>

            <div className={styles.dateField}>
              <span>End</span>
              <div className={styles.dateInputWrap}>
                <input
                  ref={endDateInputRef}
                  type="date"
                  className={styles.dateInput}
                  value={endDateInput}
                  onChange={(e) => {
                    setSelectedPeriod("custom");
                    setEndDateInput(e.target.value);
                  }}
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

            <div className={styles.applyDateButtonWrap}>
              <Button
                title="Apply dates"
                type="OUTLINED"
                onClick={applyCustomDateRange}
              />
            </div>
          </div>
        </div>

        <div className={styles.filtersRow}>
          <DropDownButton
            options={STATUS_OPTIONS.map((option) => ({
              title: option.title,
              value: option.value,
            }))}
            selectedOption={selectedStatusOption}
            setSelectedOption={(nextOption) => {
            setSelectedStatusOption(nextOption as number);
            const nextStatus =
              STATUS_OPTIONS[nextOption as number]?.value ?? "";
            updateLedgerQuery({
              page: 1,
              q: appliedSearch,
              status: nextStatus,
              mode: selectedMode,
              sort: selectedSort,
            });
          }}
          onClickOption={() => {
              updateLedgerQuery({
                page: 1,
                q: appliedSearch,
                status: selectedStatus,
                mode: selectedMode,
                sort: selectedSort,
              });
          }}
        />
          <DropDownButton
            options={MODE_OPTIONS.map((option) => ({
              title: option.title,
              value: option.value,
            }))}
            selectedOption={selectedModeOption}
            setSelectedOption={(nextOption) => {
            setSelectedModeOption(nextOption as number);
            const nextMode = MODE_OPTIONS[nextOption as number]?.value ?? "";
            updateLedgerQuery({
              page: 1,
              q: appliedSearch,
              status: selectedStatus,
              mode: nextMode,
              sort: selectedSort,
            });
          }}
          onClickOption={() => {
              updateLedgerQuery({
                page: 1,
                q: appliedSearch,
                status: selectedStatus,
                mode: selectedMode,
                sort: selectedSort,
              });
          }}
        />
          <DropDownButton
            options={SORT_OPTIONS.map((option) => ({
              title: option.title,
              value: option.value,
            }))}
            selectedOption={selectedSortOption}
            setSelectedOption={(nextOption) => {
            setSelectedSortOption(nextOption as number);
            const nextSort =
              SORT_OPTIONS[nextOption as number]?.value ?? "paidAt_desc";
            updateLedgerQuery({
              page: 1,
              q: appliedSearch,
              status: selectedStatus,
              mode: selectedMode,
              sort: nextSort,
            });
          }}
          onClickOption={() => {
              updateLedgerQuery({
                page: 1,
                q: appliedSearch,
                status: selectedStatus,
                mode: selectedMode,
                sort: selectedSort,
              });
          }}
        />
        </div>

        {validationError && (
          <div className={styles.validationError}>{validationError}</div>
        )}
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <div>Order</div>
          <div>Paid amount</div>
          <div>Payout</div>
          <div>Refund</div>
          <div>Stripe fee</div>
          <div>Net profit</div>
        </div>

        <div className={styles.tableBody}>
          {loading && (
            <div className={styles.emptyState}>Loading financial orders...</div>
          )}
          {!loading && error && (
            <div className={styles.emptyState}>{error}</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className={styles.emptyState}>
              No financial orders for selected filters
            </div>
          )}

          {!loading &&
            !error &&
            items.map((order) => {
              const clientName = getUserName(
                order.clientUser?.firstName,
                order.clientUser?.lastName,
              );
              const providerName = getUserName(
                order.providerUser?.firstName,
                order.providerUser?.lastName,
              );
              const { paid, payout, refund, stripeFee, netProfit } =
                getAmountPresentation(order);

              return (
                <div
                  key={order.id}
                  className={`${styles.row} ${
                    order.financialMode === "REAL" ? styles.rowReal : ""
                  }`}
                >
                  <div className={styles.orderCell} data-label="Order">
                    <div className={styles.orderUsersWrap}>
                      <div className={styles.profilePics}>
                        <img
                          className={styles.providerImg}
                          src={
                            order.providerUser?.imgUrl || defaultAvatarImg.src
                          }
                          alt={providerName}
                        />
                        <img
                          className={styles.clientImg}
                          src={order.clientUser?.imgUrl || defaultAvatarImg.src}
                          alt={clientName}
                        />
                      </div>
                      <div className={styles.orderInfo}>
                        <Link
                          href={`/orders/${order.id}`}
                          className={styles.orderIdLink}
                        >
                          {order.orderPrettyId}
                        </Link>
                        <div
                          className={styles.orderNames}
                        >{`${providerName} / ${clientName}`}</div>
                        <div className={styles.orderMeta}>
                          Paid: {formatDateTime(order.paidAt)}
                        </div>
                        <div className={styles.orderMeta}>
                          {`${formatDateTime(order.startsAt)} - ${formatDateTime(order.endsAt)}`}
                        </div>
                      </div>
                    </div>
                    <div className={styles.orderBadges}>
                      <span className={styles.statusBadge}>
                        {getOrderStatusTitle(order.status)}
                      </span>
                      <span
                        className={`${styles.modeBadge} ${getModeClassName(order.financialMode)}`}
                      >
                        {order.financialMode}
                      </span>
                    </div>
                  </div>

                  <div className={styles.valueCell} data-label="Paid amount">
                    <div
                      className={`${styles.valueMain} ${getToneClassName(paid.tone)}`}
                    >
                      {paid.amount}
                    </div>
                    <div className={styles.valueSub}>{paid.subtitle}</div>
                  </div>

                  <div className={styles.valueCell} data-label="Payout">
                    <div
                      className={`${styles.valueMain} ${getToneClassName(payout.tone)}`}
                    >
                      {payout.amount}
                    </div>
                    <div className={styles.valueSub}>{payout.subtitle}</div>
                  </div>

                  <div className={styles.valueCell} data-label="Refund">
                    <div
                      className={`${styles.valueMain} ${getToneClassName(refund.tone)}`}
                    >
                      {refund.amount}
                    </div>
                    <div className={styles.valueSub}>{refund.subtitle}</div>
                  </div>

                  <div className={styles.valueCell} data-label="Stripe fee">
                    <div
                      className={`${styles.valueMain} ${getToneClassName(stripeFee.tone)}`}
                    >
                      {stripeFee.amount}
                    </div>
                    <div className={styles.valueSub}>{stripeFee.subtitle}</div>
                  </div>

                  <div className={styles.valueCell} data-label="Net profit">
                    <div
                      className={`${styles.valueMain} ${getToneClassName(netProfit.tone)}`}
                    >
                      {netProfit.amount}
                    </div>
                    <div className={styles.valueSub}>{netProfit.subtitle}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {total > pageSize && (
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
          previousClassName={paginateStyles.prevPageBtn}
          previousLinkClassName={paginateStyles.prevLink}
          nextClassName={paginateStyles.nextPageBtn}
          nextLinkClassName={paginateStyles.nextLink}
          breakClassName={paginateStyles.break}
          activeClassName={paginateStyles.activePage}
          forcePage={pageCount === 0 ? 0 : Math.floor(itemOffset / pageSize)}
        />
      )}

      <div className={styles.totalsSection}>
        <div className={styles.totalsHeader}>
          <h3 className={styles.totalsTitle}>Totals for selected period</h3>
          <div
            className={styles.totalsSubtitle}
          >{`${appliedStartLabel} - ${appliedEndLabel}`}</div>
        </div>
        <div className={styles.totalsGrid}>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Orders</div>
            <div className={styles.totalValue}>{subtotal.totalOrders}</div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Client paid</div>
            <div className={`${styles.totalValue} ${styles.valueReal}`}>
              {formatMoneyFromCents(subtotal.clientPaidCents)}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Refunded</div>
            <div className={styles.totalValue}>
              {formatMoneyFromCents(subtotal.refundCents)}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Payouts</div>
            <div className={styles.totalValue}>
              {formatMoneyFromCents(subtotal.payoutCents)}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Stripe fees</div>
            <div className={styles.totalValue}>
              {formatMoneyFromCents(subtotal.stripeFeeCents)}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Gross revenue</div>
            <div className={styles.totalValue}>
              {formatMoneyFromCents(subtotal.grossPlatformRevenueCents)}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Net revenue</div>
            <div className={`${styles.totalValue} ${styles.valueReal}`}>
              {formatMoneyFromCents(subtotal.netPlatformRevenueCents)}

              {subtotalPercent && (
                <span style={{ marginLeft: 6 }}>({subtotalPercent}%)</span>
              )}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Mode counts</div>
            <div className={styles.modeCountsWrap}>
              <span
                className={`${styles.modeCountChip} ${styles.modeForecast}`}
              >
                Forecast {subtotal.forecastCount}
              </span>
              <span
                className={`${styles.modeCountChip} ${styles.modePartialReal}`}
              >
                Partial {subtotal.partialRealCount}
              </span>
              <span className={`${styles.modeCountChip} ${styles.modeReal}`}>
                Real {subtotal.realCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialLedger;
