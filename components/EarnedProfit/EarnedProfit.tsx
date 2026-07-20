import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { FileText, Wallet } from "lucide-react";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import {
  getEarnedProfitByMonth,
  regeneratePlatformFeeInvoiceReport,
} from "@/pages/api/fetch";
import type {
  EarnedProfitBreakdownRow,
  EarnedProfitResponse,
  EarnedProfitTotals,
} from "@/types/EarnedProfit";
import MonthlyReports from "./MonthlyReports";
import ReportMonthControls from "./ReportMonthControls";
import styles from "./earnedProfit.module.css";

type EarnedProfitView = "profit" | "monthly-reports";

const EMPTY_TOTALS: EarnedProfitTotals = {
  rowCount: 0,
  invoiceCount: 0,
  refundCount: 0,
  profitCents: 0,
  stripeFeeCents: 0,
  netProfitCents: 0,
};

const formatLedgerReportMonth = (year: number, month: number) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

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
  fallback = "-",
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
    : "-";

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
      <div className={styles.emptyState}>
        No breakdown rows for this period.
      </div>
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
              <tr
                key={`${row.entryKind}-${row.invoiceOrOrderNumber}-${row.dateTime}`}
              >
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
  const [data, setData] = useState<EarnedProfitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<EarnedProfitView>("profit");
  const [reportRegenerationTarget, setReportRegenerationTarget] = useState<{
    year: number;
    month: number;
    label: string;
  } | null>(null);
  const [regeneratingReportKey, setRegeneratingReportKey] = useState("");
  const [selectedReportMonth, setSelectedReportMonth] = useState(
    () =>
      `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`,
  );

  const [selectedReportYear, selectedReportMonthValue] =
    selectedReportMonth.split("-");
  const selectedReportYearNumber = Number(selectedReportYear);
  const selectedReportMonthNumber = Number(selectedReportMonthValue);
  const selectedReportMonthKey = `${selectedReportYearNumber}-${selectedReportMonthNumber}`;
  const selectedReportMonthLabel =
    selectedReportYearNumber && selectedReportMonthNumber
      ? formatLedgerReportMonth(
          selectedReportYearNumber,
          selectedReportMonthNumber,
        )
      : "Selected month";

  const fetchEarnedProfit = useCallback(async () => {
    if (!selectedReportYearNumber || !selectedReportMonthNumber) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getEarnedProfitByMonth({
        year: selectedReportYearNumber,
        month: selectedReportMonthNumber,
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
  }, [router, selectedReportYearNumber, selectedReportMonthNumber]);

  useEffect(() => {
    fetchEarnedProfit();
  }, [fetchEarnedProfit]);

  const currency = data?.currency ?? "eur";
  const totals = data?.totals ?? EMPTY_TOTALS;
  const breakdown = data?.breakdown ?? [];
  const currentMonthKey = `${new Date().getUTCFullYear()}-${new Date().getUTCMonth() + 1}`;
  const canRegenerateSelectedMonth = selectedReportMonthKey !== currentMonthKey;

  const openReportRegenerationModal = () => {
    if (
      !canRegenerateSelectedMonth ||
      !selectedReportYearNumber ||
      !selectedReportMonthNumber
    )
      return;
    setReportRegenerationTarget({
      year: selectedReportYearNumber,
      month: selectedReportMonthNumber,
      label: selectedReportMonthLabel,
    });
  };

  const closeReportRegenerationModal = () => {
    if (regeneratingReportKey) return;
    setReportRegenerationTarget(null);
  };

  const confirmReportRegeneration = async () => {
    if (!reportRegenerationTarget || regeneratingReportKey) return;

    const { year, month } = reportRegenerationTarget;
    const regenerationKey = `${year}-${month}`;

    try {
      setRegeneratingReportKey(regenerationKey);
      setError("");
      await regeneratePlatformFeeInvoiceReport(year, month);
      await fetchEarnedProfit();
      setReportRegenerationTarget(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setError("Failed to regenerate the monthly report.");
    } finally {
      setRegeneratingReportKey("");
    }
  };

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
                ? `${selectedReportMonthLabel} UTC, end exclusive`
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
        </div>
      </div>

      {activeView === "profit" ? (
        <>
          <ReportMonthControls
            currentYear={new Date().getUTCFullYear()}
            reportYearOptions={Array.from(
              { length: 10 },
              (_, index) => new Date().getUTCFullYear() - index,
            )}
            selectedYear={selectedReportYearNumber}
            selectedMonth={selectedReportMonthNumber}
            onYearChange={(year) =>
              setSelectedReportMonth(
                `${year}-${String(selectedReportMonthNumber || 1).padStart(2, "0")}`,
              )
            }
            onMonthChange={(month) =>
              setSelectedReportMonth(
                `${selectedReportYearNumber || new Date().getUTCFullYear()}-${String(month).padStart(2, "0")}`,
              )
            }
            onRegenerate={openReportRegenerationModal}
            isRegenerating={regeneratingReportKey === selectedReportMonthKey}
            isRegenerateDisabled={!canRegenerateSelectedMonth}
            showRegenerateButton={canRegenerateSelectedMonth}
            toolbarMeta={selectedReportMonthLabel}
          />

          {loading && (
            <div className={styles.emptyState}>Loading earned profit...</div>
          )}
          {!loading && error && (
            <div className={styles.emptyState}>{error}</div>
          )}

          {!loading && !error && data && (
            <>
              <BreakdownTable rows={breakdown} currency={currency} />

              <section className={styles.totalsSection}>
                <div className={styles.totalsHeader}>
                  <h3 className={styles.totalsTitle}>Totals</h3>
                  <div className={styles.sectionSubtitle}>
                    {selectedReportMonthLabel} UTC, end exclusive
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
                    value={formatMoneyFromCents(
                      totals.stripeFeeCents,
                      currency,
                    )}
                  />
                  <MetricCard
                    label="Net profit"
                    value={formatMoneyFromCents(
                      totals.netProfitCents,
                      currency,
                    )}
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

      {reportRegenerationTarget && (
        <div className={styles.confirmationBackdrop}>
          <div className={styles.confirmationModal}>
            <h2 className={styles.confirmationTitle}>Regenerate report?</h2>
            <p className={styles.confirmationBody}>
              {`This will regenerate the ${reportRegenerationTarget.label} monthly profit cache and make it available for CSV download.`}
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeReportRegenerationModal}
                isDisabled={Boolean(regeneratingReportKey)}
              />
              <Button
                title={regeneratingReportKey ? "Regenerating..." : "Confirm"}
                type="BLACK"
                onClick={confirmReportRegeneration}
                isDisabled={Boolean(regeneratingReportKey)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarnedProfit;
