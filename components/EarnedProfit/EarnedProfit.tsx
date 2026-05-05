/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import { getEarnedProfit } from "@/pages/api/fetch";
import type {
  EarnedProfitResponse,
  EarnedProfitSummary,
  EarnedProfitTotals,
} from "@/types/EarnedProfit";
import calendarImg from "@/assets/images/calendar.svg";
import styles from "./earnedProfit.module.css";

type PeriodPreset = "this_month" | "last_month" | "this_year" | "custom";

type DateRange = {
  startInput: string;
  endInput: string;
  startIso: string;
  endIso: string;
};

const PERIOD_OPTIONS: Array<{
  label: string;
  value: Exclude<PeriodPreset, "custom">;
}> = [
  { label: "This month", value: "this_month" },
  { label: "Last month", value: "last_month" },
  { label: "This year", value: "this_year" },
];

const EMPTY_TOTALS: EarnedProfitTotals = {
  clientPaidCents: 0,
  providerEarnedCents: 0,
  grossProfitBeforeStripeFeesCents: 0,
  knownStripeFeeCents: 0,
  netProfitCents: null,
  stripeFeeUnknownPaymentCount: 0,
};

const EMPTY_SECTION: EarnedProfitSummary = {
  count: 0,
  paymentCount: 0,
  clientPaidCents: 0,
  providerEarnedCents: 0,
  grossProfitBeforeStripeFeesCents: 0,
  knownStripeFeeCents: 0,
  netProfitCents: null,
  stripeFeeUnknownPaymentCount: 0,
  recordsWithUnknownStripeFee: 0,
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

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      })
    : "—";

const getPercent = (value?: number | null, total?: number | null) => {
  if (typeof value !== "number" || !total) return null;
  return ((value / total) * 100).toFixed(2);
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

const SectionSummary = ({
  title,
  summary,
  currency,
}: {
  title: string;
  summary: EarnedProfitSummary;
  currency: string;
}) => (
  <section className={styles.sectionCard}>
    <div className={styles.sectionHeader}>
      <div>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.sectionSubtitle}>
          {summary.count} records, {summary.paymentCount} payments
        </div>
      </div>
      {summary.stripeFeeUnknownPaymentCount > 0 && (
        <span className={styles.warningBadge}>
          {summary.stripeFeeUnknownPaymentCount} unknown fees
        </span>
      )}
    </div>
    <div className={styles.sectionGrid}>
      <MetricCard
        label="Client paid"
        value={formatMoneyFromCents(summary.clientPaidCents, currency)}
      />
      <MetricCard
        label="Provider earned"
        value={formatMoneyFromCents(summary.providerEarnedCents, currency)}
      />
      <MetricCard
        label="Gross profit"
        value={formatMoneyFromCents(
          summary.grossProfitBeforeStripeFeesCents,
          currency,
        )}
        subtitle="Before Stripe fees"
        tone="positive"
      />
      <MetricCard
        label="Known Stripe fees"
        value={formatMoneyFromCents(summary.knownStripeFeeCents, currency)}
      />
      <MetricCard
        label="Net profit"
        value={formatMoneyFromCents(summary.netProfitCents, currency)}
        subtitle={
          summary.netProfitCents === null
            ? "Waiting for missing Stripe fees"
            : undefined
        }
        tone={summary.netProfitCents === null ? "warning" : "positive"}
      />
      <MetricCard
        label="Records with unknown fee"
        value={summary.recordsWithUnknownStripeFee}
      />
    </div>
  </section>
);

const EarnedProfit = () => {
  const router = useRouter();
  const defaultRange = useMemo(() => getPresetRange("this_month"), []);
  const [data, setData] = useState<EarnedProfitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
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

  const fetchEarnedProfit = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getEarnedProfit({
        startDate: appliedStartDate,
        endDate: appliedEndDate,
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
  const normalServices = data?.normalServices ?? EMPTY_SECTION;
  const additionalProviderPayments =
    data?.additionalProviderPayments ?? EMPTY_SECTION;
  const netProfitPercent = getPercent(
    totals.netProfitCents,
    totals.clientPaidCents,
  );
  const grossProfitPercent = getPercent(
    totals.grossProfitBeforeStripeFeesCents,
    totals.clientPaidCents,
  );

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h2 className={`${styles.title} ${nunito.className}`}>
            Earned profit
          </h2>
          <div className={styles.subtitle}>
            {data
              ? `${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)} UTC, end exclusive`
              : "Earned profit for completed services and additional payments"}
          </div>
        </div>
      </div>

      <div className={styles.filtersPanel}>
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

      {!loading && !error && (
        <>
          <section className={styles.totalsSection}>
            <div className={styles.totalsHeader}>
              <h3 className={styles.totalsTitle}>Totals</h3>
              {totals.stripeFeeUnknownPaymentCount > 0 && (
                <span className={styles.warningBadge}>
                  {totals.stripeFeeUnknownPaymentCount} payments missing Stripe
                  fee
                </span>
              )}
            </div>
            <div className={styles.totalsGrid}>
              <MetricCard
                label="Client paid"
                value={formatMoneyFromCents(totals.clientPaidCents, currency)}
              />
              <MetricCard
                label="Provider earned"
                value={formatMoneyFromCents(
                  totals.providerEarnedCents,
                  currency,
                )}
              />
              <MetricCard
                label="Gross profit"
                value={formatMoneyFromCents(
                  totals.grossProfitBeforeStripeFeesCents,
                  currency,
                )}
                subtitle={
                  grossProfitPercent
                    ? `${grossProfitPercent}% of client paid`
                    : undefined
                }
                tone="positive"
              />
              <MetricCard
                label="Known Stripe fees"
                value={formatMoneyFromCents(
                  totals.knownStripeFeeCents,
                  currency,
                )}
              />
              <MetricCard
                label="Net profit"
                value={formatMoneyFromCents(totals.netProfitCents, currency)}
                subtitle={
                  totals.netProfitCents === null
                    ? "Null until all included Stripe fees are known"
                    : netProfitPercent
                      ? `${netProfitPercent}% of client paid`
                      : undefined
                }
                tone={totals.netProfitCents === null ? "warning" : "positive"}
              />
              <MetricCard
                label="Unknown fee payments"
                value={totals.stripeFeeUnknownPaymentCount}
              />
            </div>
          </section>

          <div className={styles.sectionsGrid}>
            <SectionSummary
              title="Normal services"
              summary={normalServices}
              currency={currency}
            />
            <SectionSummary
              title="Additional provider payments"
              summary={additionalProviderPayments}
              currency={currency}
            />
          </div>

          {data?.assumptions && (
            <section className={styles.assumptionsSection}>
              <h3 className={styles.assumptionsTitle}>Assumptions</h3>
              <div className={styles.assumptionsGrid}>
                {Object.entries(data.assumptions).map(([key, value]) => (
                  <div key={key} className={styles.assumptionItem}>
                    <div className={styles.assumptionLabel}>
                      {key.replace(/([A-Z])/g, " $1")}
                    </div>
                    <div className={styles.assumptionText}>{value}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default EarnedProfit;
