import styles from "./retention.module.css";
import {
  ParentActivityRetentionCohort,
  RetentionInterval,
} from "@/types/ParentActivityRetention";
import {
  INTERVAL_META,
  formatCohortLabel,
  formatCohortRange,
  formatNumber,
  formatPercent,
  getMaxPeriod,
} from "./retention.helpers";

type RetentionTableProps = {
  cohorts: ParentActivityRetentionCohort[];
  interval: RetentionInterval;
};

/** Sequential blue fill: the tint deepens with retention; ink flips to white once the tint is dark enough. */
const getCellStyle = (rate: number) => {
  const alpha = 0.1 + Math.min(1, rate / 0.6) * 0.85;
  return {
    backgroundColor: `rgba(42, 120, 214, ${alpha.toFixed(2)})`,
    color: alpha > 0.55 ? "#fff" : "rgba(0, 0, 0, 0.82)",
  };
};

/** Same numbers as the chart, readable without hovering: one row per cohort, one column per period. */
const RetentionTable = ({ cohorts, interval }: RetentionTableProps) => {
  const maxPeriod = getMaxPeriod(cohorts);
  const prefix = INTERVAL_META[interval].periodPrefix;
  const columns = `170px 74px repeat(${maxPeriod + 1}, 72px)`;

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHeaderRow} style={{ gridTemplateColumns: columns }}>
        <div className={styles.tableSticky}>Cohort</div>
        <div className={styles.tableHeadCell}>Parents</div>
        {Array.from({ length: maxPeriod + 1 }, (_, index) => (
          <div key={index} className={styles.tableHeadCell}>{`${prefix}${index}`}</div>
        ))}
      </div>
      {cohorts.map((cohort) => (
        <div key={cohort.cohort} className={styles.tableRow} style={{ gridTemplateColumns: columns }}>
          <div className={styles.tableSticky}>
            <div className={styles.tableCohortLabel}>{formatCohortLabel(cohort, interval)}</div>
            <div className={styles.tableCohortRange}>{formatCohortRange(cohort)}</div>
          </div>
          <div className={styles.tableSizeCell}>{formatNumber(cohort.cohortSize)}</div>
          {Array.from({ length: maxPeriod + 1 }, (_, index) => {
            const cell = cohort.periods.find((period) => period.period === index);
            if (!cell) {
              return <div key={index} className={styles.tableCellEmpty}>–</div>;
            }
            return (
              <div
                key={index}
                className={`${styles.tableCell} ${cell.isPartial ? styles.tableCellPartial : ""}`}
                style={getCellStyle(cell.retentionRate)}
                title={`${formatNumber(cell.activeUsers)} active parents${cell.isPartial ? " (period still running)" : ""}`}
              >
                <span className={styles.tableCellRate}>{formatPercent(cell.retentionRate, 0)}</span>
                <span className={styles.tableCellCount}>{formatNumber(cell.activeUsers)}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default RetentionTable;
