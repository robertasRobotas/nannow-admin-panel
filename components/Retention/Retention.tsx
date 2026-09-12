import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import { getParentActivityRetention } from "@/pages/api/fetch";
import {
  ParentActivityRetentionResponse,
  RetentionInterval,
} from "@/types/ParentActivityRetention";
import styles from "./retention.module.css";
import RetentionCurveChart from "./RetentionCurveChart";
import RetentionTable from "./RetentionTable";
import {
  AVERAGE_COLOR,
  COHORT_RAMP,
  INTERVAL_META,
  downloadRetentionCsv,
  formatCohortLabel,
  formatIsoDateTime,
  formatNumber,
  formatPercent,
  getCohortColor,
} from "./retention.helpers";

const INTERVALS: RetentionInterval[] = ["week", "biweek", "month"];
const TIMEZONE = "Europe/Vilnius";

type RetentionData = Partial<Record<RetentionInterval, ParentActivityRetentionResponse>>;

const ACTIVITY_LABELS: Record<string, string> = {
  SEARCH_FILTERS_APPLIED: "applied search filters",
  PROVIDER_PROFILE_VIEWED: "opened a provider profile",
  PROVIDER_SAVED: "saved a provider",
  PROVIDER_REQUESTED: "requested a specific provider",
  ORDER_CREATED: "created a childcare request",
  MESSAGE_SENT: "messaged a provider",
};

const toIsoStart = (dateInput: string) =>
  dateInput ? new Date(`${dateInput}T00:00:00`).toISOString() : undefined;

const toIsoEndExclusive = (dateInput: string) => {
  if (!dateInput) return undefined;
  const date = new Date(`${dateInput}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
};

export const RetentionPanel = ({
  interval,
  data,
  isRefreshing,
}: {
  interval: RetentionInterval;
  data?: ParentActivityRetentionResponse;
  isRefreshing: boolean;
}) => {
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [showTable, setShowTable] = useState(false);
  const meta = INTERVAL_META[interval];
  const cohorts = useMemo(() => data?.cohorts ?? [], [data]);
  const average = useMemo(() => data?.average ?? [], [data]);

  useEffect(() => {
    setHighlighted((current) => {
      const known = new Set(cohorts.map((cohort) => cohort.cohort));
      const next = new Set([...current].filter((cohort) => known.has(cohort)));
      return next.size === current.size ? current : next;
    });
  }, [cohorts]);

  const toggleCohort = useCallback((cohort: string) => {
    setHighlighted((current) => {
      const next = new Set(current);
      if (next.has(cohort)) next.delete(cohort);
      else next.add(cohort);
      return next;
    });
  }, []);

  const totalParents = cohorts.reduce((sum, cohort) => sum + cohort.cohortSize, 0);
  const lastAverage = average.length > 0 ? average[average.length - 1] : null;
  const firstAverage = average.length > 0 ? average[0] : null;

  return (
    <section className={`${styles.panelCard} ${isRefreshing ? styles.panelRefreshing : ""}`}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>{meta.title}</h3>
          <div className={styles.panelSubtle}>
            {`${cohorts.length} cohorts · ${formatNumber(totalParents)} parents`}
            {firstAverage && lastAverage && lastAverage.period > 0
              ? ` · average ${formatPercent(firstAverage.retentionRate, 0)} in ${meta.periodPrefix}0 → ${formatPercent(lastAverage.retentionRate, 0)} by ${meta.periodPrefix}${lastAverage.period}`
              : ""}
          </div>
        </div>
        <div className={styles.panelActions}>
          <Button
            title={showTable ? "Hide table" : "Show table"}
            type="OUTLINED"
            onClick={() => setShowTable((value) => !value)}
          />
          <Button
            title="CSV"
            type="OUTLINED"
            onClick={() => downloadRetentionCsv(interval, cohorts)}
            isDisabled={cohorts.length === 0}
          />
        </div>
      </div>

      <div className={styles.legendRow}>
        <span className={styles.legendItem}>
          <span className={styles.legendLine} style={{ background: AVERAGE_COLOR }} />
          Weighted average of completed periods
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendGradient}
            style={{ background: `linear-gradient(90deg, ${COHORT_RAMP[0]}, ${COHORT_RAMP[COHORT_RAMP.length - 1]})` }}
          />
          {cohorts.length > 0
            ? `Cohorts: ${formatCohortLabel(cohorts[0], interval)} → ${formatCohortLabel(cohorts[cohorts.length - 1], interval)}`
            : "Cohorts, oldest to newest"}
        </span>
        <span className={styles.legendHint}>Click a cohort or line to highlight it</span>
      </div>

      <RetentionCurveChart
        cohorts={cohorts}
        average={average}
        interval={interval}
        highlighted={highlighted}
        onToggleCohort={toggleCohort}
      />

      {cohorts.length > 0 && (
        <div className={styles.cohortChips}>
          {cohorts.map((cohort, index) => {
            const isActive = highlighted.has(cohort.cohort);
            const color = getCohortColor(cohorts.length <= 1 ? 1 : index / (cohorts.length - 1));
            return (
              <button
                key={cohort.cohort}
                type="button"
                className={`${styles.cohortChip} ${isActive ? styles.cohortChipActive : ""}`}
                onClick={() => toggleCohort(cohort.cohort)}
                aria-pressed={isActive}
              >
                <span className={styles.cohortChipDot} style={{ background: color }} />
                <span>{formatCohortLabel(cohort, interval)}</span>
                <span className={styles.cohortChipSize}>{formatNumber(cohort.cohortSize)}</span>
              </button>
            );
          })}
          {highlighted.size > 0 && (
            <button
              type="button"
              className={`${styles.cohortChip} ${styles.cohortChipClear}`}
              onClick={() => setHighlighted(new Set())}
            >
              Clear highlight
            </button>
          )}
        </div>
      )}

      {showTable && cohorts.length > 0 && (
        <RetentionTable cohorts={cohorts} interval={interval} />
      )}
    </section>
  );
};

const Retention = () => {
  const router = useRouter();
  const [data, setData] = useState<RetentionData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cohortFromInput, setCohortFromInput] = useState("");
  const [cohortToInput, setCohortToInput] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ from?: string; to?: string }>({});

  const fetchRetention = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const responses = await Promise.all(
        INTERVALS.map((interval) =>
          getParentActivityRetention({
            interval,
            timezone: TIMEZONE,
            cohortFrom: appliedRange.from,
            cohortTo: appliedRange.to,
          }),
        ),
      );
      const next: RetentionData = {};
      INTERVALS.forEach((interval, index) => {
        next[interval] = responses[index].data as ParentActivityRetentionResponse;
      });
      setData(next);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setError("Failed to load activity retention.");
    } finally {
      setLoading(false);
    }
  }, [appliedRange, router]);

  useEffect(() => {
    fetchRetention();
  }, [fetchRetention]);

  const applyRange = () => {
    if (cohortFromInput && cohortToInput && cohortToInput < cohortFromInput) {
      setError("Cohort end date must be after the start date.");
      return;
    }
    setAppliedRange({
      from: toIsoStart(cohortFromInput),
      to: toIsoEndExclusive(cohortToInput),
    });
  };

  const resetRange = () => {
    setCohortFromInput("");
    setCohortToInput("");
    setAppliedRange({});
  };

  const reference = data.month ?? data.week ?? data.biweek;
  const trackingStarted = formatIsoDateTime(reference?.trackingStartedAt ?? null);
  const launchDay = reference?.launchDay ? formatIsoDateTime(`${reference.launchDay}T12:00:00`) : null;
  const activityList = (reference?.qualifyingActivityTypes ?? Object.keys(ACTIVITY_LABELS))
    .map((type) => ACTIVITY_LABELS[type] ?? type.toLowerCase().replace(/_/g, " "))
    .join(", ");
  const hasAnyData = Boolean(data.week || data.biweek || data.month);

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h2 className={`${styles.title} ${nunito.className}`}>Activity retention</h2>
          <div className={styles.subtitle}>
            Parents only · share of each sign-up cohort that performed a qualifying action in a period
          </div>
        </div>
      </div>

      <div className={styles.filtersPanel}>
        <div className={styles.filtersRow}>
          <label className={styles.dateField}>
            <span>Cohorts from</span>
            <input
              type="date"
              className={styles.dateInput}
              value={cohortFromInput}
              onChange={(event) => setCohortFromInput(event.target.value)}
            />
          </label>
          <label className={styles.dateField}>
            <span>Cohorts to</span>
            <input
              type="date"
              className={styles.dateInput}
              value={cohortToInput}
              onChange={(event) => setCohortToInput(event.target.value)}
            />
          </label>
          <div className={styles.filterButtons}>
            <Button title="Apply" type="OUTLINED" onClick={applyRange} />
            <Button title="All cohorts" type="PLAIN" onClick={resetRange} />
          </div>
        </div>
        <div className={styles.definition}>
          <strong>Active</strong>
          {` = ${activityList}. App opens, logins, push-notification opens and the automatic map load do not count. Each parent counts once per period. Babysitters, nannies and other providers are excluded.`}
          {launchDay ? ` First parent joined ${launchDay}.` : ""}
          {trackingStarted
            ? ` Live tracking started ${trackingStarted}; earlier periods only see backfilled requests and messages, so they are a lower bound.`
            : " Live tracking has not recorded any events yet; the curves currently show backfilled requests and messages only."}
        </div>
      </div>

      {error && <div className={styles.errorState}>{error}</div>}
      {loading && !hasAnyData && <div className={styles.loadingState}>Loading activity retention...</div>}

      {hasAnyData &&
        INTERVALS.map((interval) => (
          <RetentionPanel
            key={interval}
            interval={interval}
            data={data[interval]}
            isRefreshing={loading}
          />
        ))}
    </div>
  );
};

export default Retention;
