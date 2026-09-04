import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { BarChart3, CreditCard, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { getEarnedProfitByMonth } from "@/pages/api/fetch";
import { nunito } from "@/helpers/fonts";
import type { EarnedProfitResponse } from "@/types/EarnedProfit";
import styles from "./profitGraphs.module.css";

type MonthlyProfit = {
  month: number;
  totalOrderAmountCents: number;
  netProfitCents: number;
  stripeFeeCents: number;
  netMargin: number;
  stripeFeeRate: number;
  orderCount: number;
};

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

const preciseMoney = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

const monthName = (month: number) =>
  MONTH_FORMATTER.format(new Date(Date.UTC(2026, month - 1, 1)));

const extractResponse = (payload: unknown): EarnedProfitResponse =>
  ((payload as { result?: EarnedProfitResponse })?.result ??
    payload) as EarnedProfitResponse;

const BarChart = ({
  data,
  metric,
  color,
  formatValue,
  gridStep,
  gridLabelStep,
  formatBarValue,
}: {
  data: MonthlyProfit[];
  metric: (item: MonthlyProfit) => number;
  color: "blue" | "green" | "purple" | "orange";
  formatValue: (value: number) => string;
  gridStep?: number;
  gridLabelStep?: number;
  formatBarValue?: (value: number) => string;
}) => {
  const width = 740;
  const height = 260;
  const padding = { top: 20, right: 12, bottom: 48, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.map(metric);
  const highestValue = Math.max(0, ...values);
  const labelStep = gridLabelStep ?? 1;
  const max = gridStep
    ? Math.max(gridStep, Math.ceil(highestValue / (gridStep * labelStep)) * gridStep * labelStep)
    : Math.max(1, highestValue);
  const gridValues = gridStep
    ? Array.from(
        { length: Math.round(max / gridStep) + 1 },
        (_, index) => index * gridStep,
      )
    : [0, max * 0.5, max];
  const slot = chartWidth / Math.max(data.length, 1);
  const barWidth = Math.min(38, Math.max(16, slot * 0.55));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} role="img">
      {gridValues.map((value) => {
        const y = padding.top + chartHeight * (1 - value / max);
        return (
          <g key={value}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className={styles.gridLine} />
            {(value === 0 || value === max || !gridStep || value % (gridStep * labelStep) === 0) && (
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className={styles.axisLabel}>
                {formatValue(value)}
              </text>
            )}
          </g>
        );
      })}
      {data.map((item, index) => {
        const value = metric(item);
        const barHeight = Math.max(value === 0 ? 0 : 2, (value / max) * chartHeight);
        const x = padding.left + index * slot + (slot - barWidth) / 2;
        const y = padding.top + chartHeight - barHeight;
        return (
          <g key={item.month}>
            <title>{`${monthName(item.month)}: ${formatValue(value)}`}</title>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={barWidth / 2} className={styles[`bar${color[0].toUpperCase()}${color.slice(1)}`]} />
            {formatBarValue && value !== 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className={styles.barValueLabel}
              >
                {formatBarValue(value)}
              </text>
            )}
            <text x={x + barWidth / 2} y={height - 18} textAnchor="middle" className={styles.axisLabel}>
              {monthName(item.month)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const ProfitGraphs = () => {
  const router = useRouter();
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth() + 1;
  const [data, setData] = useState<MonthlyProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGraphs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const reports = await Promise.all(
        Array.from({ length: currentMonth }, (_, index) => index + 1).map(
          async (month) => {
            const response = await getEarnedProfitByMonth({
              year: currentYear,
              month,
              includeBreakdown: false,
            });
            const report = extractResponse(response.data);
            return {
              month,
              totalOrderAmountCents:
                Number(report?.totals?.totalOrderAmountCents) || 0,
              netProfitCents: Number(report?.totals?.netProfitCents) || 0,
              stripeFeeCents: Number(report?.totals?.stripeFeeCents) || 0,
              orderCount: Number(report?.totals?.totalOrderCount) || 0,
            };
          },
        ),
      );
      setData(
        reports.map((report) => {
          return {
            ...report,
            netMargin:
              report.totalOrderAmountCents > 0
                ? report.netProfitCents / report.totalOrderAmountCents
                : 0,
            stripeFeeRate:
              report.totalOrderAmountCents > 0
                ? report.stripeFeeCents / report.totalOrderAmountCents
                : 0,
          };
        }),
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setError("Failed to load this year's profit data.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, router]);

  useEffect(() => {
    loadGraphs();
  }, [loadGraphs]);

  const totals = useMemo(
    () => data.reduce(
      (summary, item) => ({
        totalOrderAmountCents:
          summary.totalOrderAmountCents + item.totalOrderAmountCents,
        netProfitCents: summary.netProfitCents + item.netProfitCents,
        stripeFeeCents: summary.stripeFeeCents + item.stripeFeeCents,
        orderCount: summary.orderCount + item.orderCount,
      }),
      {
        totalOrderAmountCents: 0,
        netProfitCents: 0,
        stripeFeeCents: 0,
        orderCount: 0,
      },
    ),
    [data],
  );
  const netMargin =
    totals.totalOrderAmountCents > 0
      ? totals.netProfitCents / totals.totalOrderAmountCents
      : 0;
  const stripeFeeRate =
    totals.totalOrderAmountCents > 0
      ? totals.stripeFeeCents / totals.totalOrderAmountCents
      : 0;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={`${styles.title} ${nunito.className}`}>Profit graphs</h1>
          <p className={styles.subtitle}>Current year ({currentYear}) · full value of orders completed in each report month</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={loadGraphs} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.refreshing : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error && <div className={styles.message}>{error}</div>}
      {loading && !data.length && <div className={styles.message}>Loading monthly profit data...</div>}

      {!loading && !error && (
        <>
          <section className={styles.summaryGrid} aria-label="Current year totals">
            <article className={styles.summaryCard}>
              <span className={styles.cardIcon}><Wallet size={19} /></span>
              <span className={styles.cardLabel}>Total finished order amount</span>
              <strong>{preciseMoney(totals.totalOrderAmountCents)}</strong>
              <span className={styles.cardHint}>{totals.orderCount.toLocaleString("en-IE")} completed orders</span>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.cardIcon} ${styles.greenIcon}`}><TrendingUp size={19} /></span>
              <span className={styles.cardLabel}>Net profit</span>
              <strong className={styles.positive}>{preciseMoney(totals.netProfitCents)}</strong>
              <span className={styles.cardHint}>After Stripe fees and refunds</span>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.cardIcon} ${styles.purpleIcon}`}><BarChart3 size={19} /></span>
              <span className={styles.cardLabel}>Net profit percentage</span>
              <strong>{(netMargin * 100).toFixed(1)}%</strong>
              <span className={styles.cardHint}>Net profit ÷ finished order amount</span>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.cardIcon} ${styles.orangeIcon}`}><CreditCard size={19} /></span>
              <span className={styles.cardLabel}>Stripe fee percentage</span>
              <strong>{(stripeFeeRate * 100).toFixed(1)}%</strong>
              <span className={styles.cardHint}>Stripe fees ÷ finished order amount</span>
            </article>
          </section>

          <section className={styles.chartGrid}>
            <article className={styles.chartCard}>
              <div className={styles.chartHeader}><div><h2>Total finished order amount</h2><p>Finished orders in each report month</p></div><span className={styles.blueDot} /></div>
              <BarChart data={data} metric={(item) => item.totalOrderAmountCents} color="blue" formatValue={money} />
            </article>
            <article className={styles.chartCard}>
              <div className={styles.chartHeader}><div><h2>Net profit</h2><p>Monthly profit after fees and refunds</p></div><span className={styles.greenDot} /></div>
              <BarChart data={data} metric={(item) => item.netProfitCents} color="green" formatValue={money} />
            </article>
            <article className={`${styles.chartCard} ${styles.fullChart}`}>
              <div className={styles.chartHeader}><div><h2>Net profit percentage</h2><p>Monthly net profit as a share of finished order amount</p></div><span className={styles.purpleDot} /></div>
              <BarChart data={data} metric={(item) => item.netMargin * 100} color="purple" formatValue={(value) => `${value.toFixed(0)}%`} gridStep={1} formatBarValue={(value) => `${value.toFixed(2)}%`} />
            </article>
            <article className={`${styles.chartCard} ${styles.fullChart}`}>
              <div className={styles.chartHeader}><div><h2>Stripe fee percentage</h2><p>Monthly Stripe fees as a share of finished order amount</p></div><span className={styles.orangeDot} /></div>
              <BarChart data={data} metric={(item) => item.stripeFeeRate * 100} color="orange" formatValue={(value) => `${value.toFixed(0)}%`} gridStep={1} gridLabelStep={5} formatBarValue={(value) => `${value.toFixed(2)}%`} />
            </article>
          </section>
        </>
      )}
    </main>
  );
};

export default ProfitGraphs;
