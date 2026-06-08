/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { FileText, Wallet } from "lucide-react";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import { getEarnedProfit } from "@/pages/api/fetch";
import type {
  EarnedProfitBreakdownRow,
  EarnedProfitResponse,
  EarnedProfitTotals,
} from "@/types/EarnedProfit";
import calendarImg from "@/assets/images/calendar.svg";
import MonthlyReports from "./MonthlyReports";
import styles from "./earnedProfit.module.css";

type PeriodPreset = "this_month" | "last_month" | "this_year" | "custom";

type DateRange = {
  startInput: string;
  endInput: string;
  startIso: string;
  endIso: string;
};

type EarnedProfitView = "profit" | "monthly-reports";

const PERIOD_OPTIONS: Array<{
  label: string;
  value: Exclude<PeriodPreset, "custom">;
}> = [
  { label: "This month", value: "this_month" },
  { label: "Last month", value: "last_month" },
  { label: "This year", value: "this_year" },
];

const EMPTY_TOTALS: EarnedProfitTotals = {
  rowCount: 0,
  invoiceCount: 0,
  refundCount: 0,
  profitCents: 0,
  stripeFeeCents: 0,
  netProfitCents: 0,
};

const toInputDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toUtcDayStartIso = (inputDate: string) =>
  new Date(`${inputDate}T00:00:00.000Z`).toISOString();

const toUtcExclusiveEndIso = (inputDate: string) => {
  const endDate = new Date(`${inputDate}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  return endDate.toISOString();
};

const getPresetRange = (preset: Exclude<PeriodPreset, "custom">): DateRange => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  if (preset === "last_month") {
    const start = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const end = new Date(Date.UTC(currentYear, currentMonth, 1));
    return {
      startInput: toInputDate(start),
      endInput: toInputDate(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

  if (preset === "this_year") {
    const start = new Date(Date.UTC(currentYear, 0, 1));
    const end = new Date(Date.UTC(currentYear + 1, 0, 1));
    return {
      startInput: toInputDate(start),
      endInput: toInputDate(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

  const start = new Date(Date.UTC(currentYear, currentMonth, 1));
  const end = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
  return {
    startInput: toInputDate(start),
    endInput: toInputDate(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const formatMoneyFromCents = (value?: number | null, currency = "eur") => {
  if (value === null || value === undefined) return "Unknown";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

const formatMoneyFromDecimal = (
  value?: string | null,
  currency = "eur",
  fallback = "—",
) => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
};

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      })
    : "—";

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
    : "—";

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

const MetricCard = ({
  label,
  value,
  subtitle,
  tone = "default",
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: "default" | "positive" | "warning";
}) => (
  <div className={styles.metricCard}>
    <div className={styles.metricLabel}>{label}</div>
    <div
      className={`${styles.metricValue} ${
        tone === "positive"
          ? styles.metricPositive
          : tone === "warning"
            ? styles.metricWarning
            : ""
      }`}
    >
      {value}
    </div>
    {subtitle && <div className={styles.metricSubtitle}>{subtitle}</div>}
  </div>
);

const BreakdownTable = ({
  rows,
  currency,
}: {
  rows: EarnedProfitBreakdownRow[];
  currency: string;
}) => (
  <section className={styles.breakdownSection}>
    <div className={styles.breakdownHeader}>
      <div>
        <h3 className={styles.breakdownTitle}>Breakdown</h3>
        <div className={styles.sectionSubtitle}>
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </div>
      </div>
    </div>
    {rows.length === 0 ? (
      <div className={styles.emptyState}>No breakdown rows for this period.</div>
    ) : (
      <div className={styles.breakdownTableScroll}>
        <table className={styles.breakdownTable}>
          <thead>
            <tr>
              <th>Kind</th>
              <th>Invoice / order</th>
              <th>Date</th>
              <th>Timestamp</th>
              <th>Client</th>
              <th>Provider</th>
              <th>Total amount</th>
              <th>Profit</th>
              <th>Stripe fee</th>
              <th>Net profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.entryKind}-${row.invoiceOrOrderNumber}-${row.dateTime}`}>
                <td>
                  <span
                    className={`${styles.entryKindBadge} ${
                      row.entryKind === "REFUND"
                        ? styles.entryKindRefund
                        : styles.entryKindInvoice
                    }`}
                  >
                    {row.entryKind}
                  </span>
                </td>
                <td>
                  <Link
                    href={`/orders/${row.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.orderNumberLink}
                  >
                    {row.invoiceOrOrderNumber}
                  </Link>
                </td>
                <td>{row.date}</td>
                <td>{formatDateTime(row.dateTime)}</td>
                <td>{row.client}</td>
                <td>{row.provider}</td>
                <td>{formatMoneyFromDecimal(row.totalAmount, currency)}</td>
                <td>{formatMoneyFromDecimal(row.profit, currency)}</td>
                <td>{formatMoneyFromDecimal(row.stripeFee, currency)}</td>
                <td>{formatMoneyFromDecimal(row.netProfit, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const BREAKDOWN_LIMIT = 200;

const EarnedProfit = () => {
  const router = useRouter();
  const defaultRange = useMemo(() => getPresetRange("this_month"), []);
  const [data, setData] = useState<EarnedProfitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodPreset>("this_month");
  const [activeView, setActiveView] = useState<EarnedProfitView>("profit");
  const [startDateInput, setStartDateInput] = useState(defaultRange.startInput);
  const [endDateInput, setEndDateInput] = useState(defaultRange.endInput);
  const [appliedStartDate, setAppliedStartDate] = useState(
    defaultRange.startIso,
  );
  const [appliedEndDate, setAppliedEndDate] = useState(defaultRange.endIso);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const fetchEarnedProfit = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getEarnedProfit({
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        includeBreakdown: true,
        breakdownLimit: BREAKDOWN_LIMIT,
      });
      const payload = response.data as
        | EarnedProfitResponse
        | { result?: EarnedProfitResponse };
      const nextData =
        (payload as { result?: EarnedProfitResponse }).result ??
        (payload as EarnedProfitResponse);
      setData(nextData);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setError("Failed to load earned profit.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [appliedEndDate, appliedStartDate, router]);

  useEffect(() => {
    fetchEarnedProfit();
  }, [fetchEarnedProfit]);

  const applyPresetRange = (preset: Exclude<PeriodPreset, "custom">) => {
    const nextRange = getPresetRange(preset);
    setSelectedPeriod(preset);
    setStartDateInput(nextRange.startInput);
    setEndDateInput(nextRange.endInput);
    setAppliedStartDate(nextRange.startIso);
    setAppliedEndDate(nextRange.endIso);
    setValidationError("");
  };

  const applyCustomDateRange = () => {
    if (!startDateInput || !endDateInput) {
      setValidationError("Select both start and end dates.");
      return;
    }
    const startIso = toUtcDayStartIso(startDateInput);
    const endIso = toUtcExclusiveEndIso(endDateInput);
    if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
      setValidationError("End date must be after start date.");
      return;
    }
    setSelectedPeriod("custom");
    setAppliedStartDate(startIso);
    setAppliedEndDate(endIso);
    setValidationError("");
  };

  const currency = data?.currency ?? "eur";
  const totals = data?.totals ?? EMPTY_TOTALS;
  const breakdown = data?.breakdown ?? [];

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h2 className={`${styles.title} ${nunito.className}`}>
            {activeView === "profit" ? "Earned profit" : "Monthly reports"}
          </h2>
          <div className={styles.subtitle}>
            {activeView === "profit"
              ? data
                ? `${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)} UTC, end exclusive`
                : "Earned profit report for issued invoices and refund-period losses"
              : "Monthly platform fee invoice reports"}
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewTabs}>
            <button
              type="button"
              className={`${styles.viewTab} ${
                activeView === "profit" ? styles.viewTabActive : ""
              }`}
              onClick={() => setActiveView("profit")}
            >
              <Wallet size={16} strokeWidth={2} />
              <span>Earned profit</span>
            </button>
            <button
              type="button"
              className={`${styles.viewTab} ${
                activeView === "monthly-reports" ? styles.viewTabActive : ""
              }`}
              onClick={() => setActiveView("monthly-reports")}
            >
              <FileText size={16} strokeWidth={2} />
              <span>Monthly reports</span>
            </button>
          </div>
          {activeView === "profit" && (
            <div className={styles.periodButtons}>
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.periodButton} ${
                    selectedPeriod === option.value ? styles.periodButtonActive : ""
                  }`}
                  onClick={() => applyPresetRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeView === "profit" ? (
        <>
          <div className={styles.filtersPanel}>
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
                    onClick={() => openNativeDatePicker(startDateInputRef.current)}
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

            {validationError && (
              <div className={styles.validationError}>{validationError}</div>
            )}
          </div>

          {loading && <div className={styles.emptyState}>Loading earned profit...</div>}
          {!loading && error && <div className={styles.emptyState}>{error}</div>}

          {!loading && !error && data && (
            <>
              <BreakdownTable rows={breakdown} currency={currency} />

              <section className={styles.totalsSection}>
                <div className={styles.totalsHeader}>
                  <h3 className={styles.totalsTitle}>Totals</h3>
                  <div className={styles.sectionSubtitle}>
                    {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)} UTC, end exclusive
                  </div>
                </div>
                <div className={styles.totalsGrid}>
                  <MetricCard label="Rows" value={totals.rowCount} />
                  <MetricCard label="Invoices" value={totals.invoiceCount} />
                  <MetricCard label="Refunds" value={totals.refundCount} />
                  <MetricCard
                    label="Profit"
                    value={formatMoneyFromCents(totals.profitCents, currency)}
                    tone="positive"
                  />
                  <MetricCard
                    label="Stripe fees"
                    value={formatMoneyFromCents(totals.stripeFeeCents, currency)}
                  />
                  <MetricCard
                    label="Net profit"
                    value={formatMoneyFromCents(totals.netProfitCents, currency)}
                    tone="positive"
                  />
                </div>
              </section>
            </>
          )}
        </>
      ) : (
        <MonthlyReports />
      )}
    </div>
  );
};

export default EarnedProfit;
