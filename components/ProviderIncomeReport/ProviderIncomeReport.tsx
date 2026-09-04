import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Button from "@/components/Button/Button";
import ReportMonthControls from "@/components/EarnedProfit/ReportMonthControls";
import { nunito } from "@/helpers/fonts";
import {
  downloadProviderIncomeReport,
  getProviderIncomeByMonth,
  regeneratePlatformFeeInvoiceReport,
} from "@/pages/api/fetch";
import type { ProviderIncomeReportResponse } from "@/types/ProviderIncomeReport";
import styles from "@/components/EarnedProfit/earnedProfit.module.css";
import localStyles from "./providerIncomeReport.module.css";

const getPreviousMonth = () => {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
};

const formatMonth = (year: number, month: number) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));

const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

const ProviderIncomeReport = () => {
  const router = useRouter();
  const initial = useMemo(getPreviousMonth, []);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [data, setData] = useState<ProviderIncomeReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const monthLabel = formatMonth(year, month);
  const isCurrentMonth =
    year === new Date().getUTCFullYear() && month === new Date().getUTCMonth() + 1;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getProviderIncomeByMonth(year, month);
      setData(response.data as ProviderIncomeReportResponse);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setData(null);
      setError(
        axios.isAxiosError(err) && err.response?.status === 404
          ? "No stored report for this month. Regenerate the month to create it."
          : "Failed to load provider income report.",
      );
    } finally {
      setLoading(false);
    }
  }, [month, router, year]);

  useEffect(() => { load(); }, [load]);

  const regenerate = async () => {
    try {
      setRegenerating(true);
      setError("");
      await regeneratePlatformFeeInvoiceReport(year, month);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setError("Failed to regenerate the monthly provider income report.");
    } finally {
      setRegenerating(false);
      setConfirming(false);
    }
  };

  const download = async () => {
    try {
      const response = await downloadProviderIncomeReport(year, month);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `monthly-provider-income-report-${year}-${String(month).padStart(2, "0")}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download provider income CSV. Regenerate the month first.");
    }
  };

  const currency = data?.currency ?? "eur";
  const totals = data?.totals;

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h1 className={`${styles.title} ${nunito.className}`}>Provider income</h1>
          <div className={styles.subtitle}>Monthly provider income and generated platform fees</div>
        </div>
      </div>

      <ReportMonthControls
        currentYear={new Date().getUTCFullYear()}
        reportYearOptions={Array.from({ length: 10 }, (_, index) => new Date().getUTCFullYear() - index)}
        selectedYear={year}
        selectedMonth={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onRegenerate={() => setConfirming(true)}
        isRegenerating={regenerating}
        isRegenerateDisabled={isCurrentMonth}
        toolbarMeta={monthLabel}
      />

      {loading && <div className={styles.emptyState}>Loading provider income...</div>}
      {!loading && error && <div className={styles.emptyState}>{error}</div>}
      {!loading && !error && data?.requiresRegeneration && (
        <div className={styles.emptyState}>Regenerate this month to populate provider income data.</div>
      )}

      {!loading && !error && data && !data.requiresRegeneration && (
        <>
          <section className={styles.totalsSection}>
            <div className={styles.totalsHeader}>
              <h2 className={styles.totalsTitle}>Totals</h2>
              <div className={styles.sectionSubtitle}>{monthLabel} UTC, end exclusive</div>
            </div>
            <div className={styles.totalsGrid}>
              {[
                ["Providers", totals?.providerCount ?? 0],
                ["Finished orders", totals?.orderCount ?? 0],
                ["Finished order amount", formatMoney(totals?.orderAmountCents ?? 0, currency)],
                ["Provider income", formatMoney(totals?.providerIncomeCents ?? 0, currency)],
                ["Stripe fees", formatMoney(totals?.stripeFeeCents ?? 0, currency)],
                ["Refund Stripe fees", formatMoney(totals?.refundStripeFeeCents ?? 0, currency)],
                ["Active Stripe accounts", totals?.activeStripeAccountCount ?? 0],
                ["Connect active acct fee", formatMoney(totals?.connectActiveAccountFeeCents ?? 0, currency)],
                ["Total Stripe cost", formatMoney(totals?.totalStripeCostCents ?? 0, currency)],
                ["Gross platform fee", formatMoney(totals?.grossPlatformFeeCents ?? 0, currency)],
                ["Net platform fee", formatMoney(totals?.netPlatformFeeCents ?? 0, currency)],
                ["Net after Connect", formatMoney(totals?.netPlatformFeeAfterConnectCents ?? 0, currency)],
                [
                  "Net after refunds + Connect",
                  formatMoney(totals?.netPlatformFeeAfterRefundsAndConnectCents ?? 0, currency),
                ],
              ].map(([label, value]) => (
                <div className={styles.metricCard} key={String(label)}>
                  <div className={styles.metricLabel}>{label}</div>
                  <div className={styles.metricValue}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.breakdownSection}>
            <div className={styles.breakdownHeader}>
              <div>
                <h2 className={styles.breakdownTitle}>Providers</h2>
                <div className={styles.sectionSubtitle}>{data.providers.length} providers</div>
              </div>
              <Button title="Download CSV" type="OUTLINED" onClick={download} />
            </div>
            <div className={styles.breakdownTableScroll}>
              <table className={`${styles.breakdownTable} ${localStyles.table}`}>
                <thead><tr>
                  <th>Provider</th><th>Finished orders</th><th>Finished order amount</th>
                  <th>Provider income</th><th>Stripe fee</th><th>Active accounts</th>
                  <th>Connect fee</th><th>Total Stripe cost</th><th>Gross platform fee</th>
                  <th>Net platform fee</th><th>Net after Connect</th>
                </tr></thead>
                <tbody>
                  {data.providers.map((provider) => (
                    <tr key={provider.providerId}>
                      <td>{provider.provider}</td>
                      <td>{provider.orderCount}</td>
                      <td>{formatMoney(provider.orderAmountCents, currency)}</td>
                      <td>{formatMoney(provider.providerIncomeCents, currency)}</td>
                      <td>{formatMoney(provider.stripeFeeCents, currency)}</td>
                      <td>{provider.activeStripeAccountCount}</td>
                      <td>{formatMoney(provider.connectActiveAccountFeeCents, currency)}</td>
                      <td>{formatMoney(provider.totalStripeCostCents, currency)}</td>
                      <td>{formatMoney(provider.grossPlatformFeeCents, currency)}</td>
                      <td className={provider.netPlatformFeeCents < 0 ? localStyles.negative : localStyles.positive}>
                        {formatMoney(provider.netPlatformFeeCents, currency)}
                      </td>
                      <td
                        className={
                          provider.netPlatformFeeAfterConnectCents < 0 ? localStyles.negative : localStyles.positive
                        }
                      >
                        {formatMoney(provider.netPlatformFeeAfterConnectCents, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {confirming && (
        <div className={styles.confirmationBackdrop}>
          <div className={styles.confirmationModal}>
            <h2 className={styles.confirmationTitle}>Regenerate report?</h2>
            <p className={styles.confirmationBody}>This will rebuild {monthLabel} profit and provider income snapshots.</p>
            <div className={styles.confirmationActions}>
              <Button title="Cancel" type="OUTLINED" onClick={() => setConfirming(false)} isDisabled={regenerating} />
              <Button title={regenerating ? "Regenerating..." : "Confirm"} type="BLACK" onClick={regenerate} isLoading={regenerating} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProviderIncomeReport;
