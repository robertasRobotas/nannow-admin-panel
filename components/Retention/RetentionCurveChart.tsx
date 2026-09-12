import { useMemo, useState } from "react";
import styles from "./retention.module.css";
import {
  ParentActivityRetentionAveragePoint,
  ParentActivityRetentionCohort,
  RetentionInterval,
} from "@/types/ParentActivityRetention";
import {
  AVERAGE_COLOR,
  INTERVAL_META,
  MUTED_LINE_COLOR,
  formatCohortLabel,
  formatNumber,
  formatPercent,
  getCohortColor,
  getMaxPeriod,
  getNiceMaxRate,
} from "./retention.helpers";

const WIDTH = 900;
const HEIGHT = 320;
const PADDING = { top: 20, right: 88, bottom: 52, left: 52 };
const MAX_DIRECT_LABELS = 4;

type RetentionCurveChartProps = {
  cohorts: ParentActivityRetentionCohort[];
  average: ParentActivityRetentionAveragePoint[];
  interval: RetentionInterval;
  highlighted: Set<string>;
  onToggleCohort: (cohort: string) => void;
};

type TooltipRow = {
  key: string;
  label: string;
  color: string;
  value: number | null;
  detail: string;
  isPartial: boolean;
  emphasis: boolean;
};

const RetentionCurveChart = ({
  cohorts,
  average,
  interval,
  highlighted,
  onToggleCohort,
}: RetentionCurveChartProps) => {
  const [hoverPeriod, setHoverPeriod] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState(0);

  const meta = INTERVAL_META[interval];
  const maxPeriod = Math.max(1, getMaxPeriod(cohorts));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const maxRate = useMemo(() => {
    const observed = Math.max(
      0,
      ...cohorts.flatMap((cohort) =>
        cohort.periods.map((period) => period.retentionRate),
      ),
      ...average.map((point) => point.retentionRate),
    );
    return getNiceMaxRate(observed);
  }, [cohorts, average]);

  const xFor = (period: number) =>
    PADDING.left + (period / maxPeriod) * plotWidth;
  const yFor = (rate: number) =>
    PADDING.top + plotHeight - (Math.min(rate, maxRate) / maxRate) * plotHeight;

  const anyHighlighted = highlighted.size > 0;
  const cohortColor = (index: number) =>
    getCohortColor(cohorts.length <= 1 ? 1 : index / (cohorts.length - 1));

  const buildPath = (points: Array<{ x: number; y: number }>) =>
    points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ");

  const series = cohorts.map((cohort, index) => {
    const complete = cohort.periods.filter((period) => !period.isPartial);
    const partial = cohort.periods.find((period) => period.isPartial);
    const points = complete.map((period) => ({
      x: xFor(period.period),
      y: yFor(period.retentionRate),
    }));
    const lastComplete = points[points.length - 1];
    const partialPoint = partial
      ? { x: xFor(partial.period), y: yFor(partial.retentionRate) }
      : null;
    const isHighlighted = highlighted.has(cohort.cohort);
    return {
      cohort,
      color: anyHighlighted && !isHighlighted ? MUTED_LINE_COLOR : cohortColor(index),
      isHighlighted,
      points,
      lastComplete,
      partialPoint,
    };
  });

  const averagePoints = average.map((point) => ({
    x: xFor(point.period),
    y: yFor(point.retentionRate),
  }));

  const directLabelSeries = anyHighlighted
    ? series.filter((item) => item.isHighlighted).slice(0, MAX_DIRECT_LABELS)
    : [];

  const tickPeriods = useMemo(() => {
    const step = maxPeriod <= 12 ? 1 : maxPeriod <= 30 ? 2 : Math.ceil(maxPeriod / 13);
    const ticks: number[] = [];
    for (let period = 0; period <= maxPeriod; period += step) ticks.push(period);
    // Label the final period too, unless it would sit on top of the previous tick.
    if (maxPeriod - ticks[ticks.length - 1] > step / 2) ticks.push(maxPeriod);
    return ticks;
  }, [maxPeriod]);

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const scale = WIDTH / bounds.width;
    const svgX = (event.clientX - bounds.left) * scale;
    const period = Math.round(((svgX - PADDING.left) / plotWidth) * maxPeriod);
    setHoverPeriod(Math.min(maxPeriod, Math.max(0, period)));
    setHoverY((event.clientY - bounds.top) * scale);
  };

  const tooltipRows: TooltipRow[] = useMemo(() => {
    if (hoverPeriod === null) return [];
    const rows: TooltipRow[] = [];
    const averagePoint = average.find((point) => point.period === hoverPeriod);
    rows.push({
      key: "average",
      label: "Weighted average",
      color: AVERAGE_COLOR,
      value: averagePoint ? averagePoint.retentionRate : null,
      detail: averagePoint
        ? `${formatNumber(averagePoint.activeUsers)} of ${formatNumber(averagePoint.cohortUsers)} · ${averagePoint.cohorts} cohorts`
        : "no completed cohorts yet",
      isPartial: false,
      emphasis: true,
    });
    const ordered = [...series].sort((left, right) => {
      if (left.isHighlighted !== right.isHighlighted) return left.isHighlighted ? -1 : 1;
      return right.cohort.cohortStart.localeCompare(left.cohort.cohortStart);
    });
    for (const item of ordered) {
      const point = item.cohort.periods.find((period) => period.period === hoverPeriod);
      if (!point) continue;
      rows.push({
        key: item.cohort.cohort,
        label: formatCohortLabel(item.cohort, interval),
        color: anyHighlighted && !item.isHighlighted ? MUTED_LINE_COLOR : item.color,
        value: point.retentionRate,
        detail: `${formatNumber(point.activeUsers)} of ${formatNumber(item.cohort.cohortSize)}`,
        isPartial: point.isPartial,
        emphasis: item.isHighlighted,
      });
    }
    return rows;
  }, [hoverPeriod, average, series, interval, anyHighlighted]);

  if (cohorts.length === 0) {
    return (
      <div className={styles.chartEmpty}>
        No parent cohorts in the selected range
      </div>
    );
  }

  const tooltipLeftPercent = hoverPeriod === null ? 0 : (xFor(hoverPeriod) / WIDTH) * 100;
  const tooltipOnLeft = tooltipLeftPercent > 60;
  const tooltipTopPercent = Math.min(70, Math.max(4, (hoverY / HEIGHT) * 100 - 6));

  return (
    <div className={styles.chartWrap}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.chartSvg}
        role="img"
        aria-label={`${meta.title}: one line per cohort, percentage of the cohort active in each ${meta.periodNoun} since first use`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverPeriod(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = PADDING.top + plotHeight * ratio;
          return (
            <g key={ratio}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={WIDTH - PADDING.right}
                y2={y}
                className={styles.chartGridLine}
              />
              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                className={styles.chartAxisLabel}
              >
                {formatPercent(maxRate * (1 - ratio), 0)}
              </text>
            </g>
          );
        })}

        {tickPeriods.map((period) => (
          <text
            key={period}
            x={xFor(period)}
            y={HEIGHT - PADDING.bottom + 20}
            textAnchor="middle"
            className={styles.chartAxisLabel}
          >
            {`${meta.periodPrefix}${period}`}
          </text>
        ))}
        <text
          x={PADDING.left + plotWidth / 2}
          y={HEIGHT - 8}
          textAnchor="middle"
          className={styles.chartAxisTitle}
        >
          {meta.axisLabel}
        </text>

        {series
          .filter((item) => !item.isHighlighted)
          .map((item) => (
            <g key={item.cohort.cohort} className={styles.cohortLineGroup} onClick={() => onToggleCohort(item.cohort.cohort)}>
              {item.points.length > 0 && (
                <path d={buildPath(item.points)} stroke={item.color} className={styles.cohortLine} />
              )}
              {item.lastComplete && item.partialPoint && (
                <line
                  x1={item.lastComplete.x}
                  y1={item.lastComplete.y}
                  x2={item.partialPoint.x}
                  y2={item.partialPoint.y}
                  stroke={item.color}
                  className={styles.cohortLinePartial}
                />
              )}
            </g>
          ))}

        {series
          .filter((item) => item.isHighlighted)
          .map((item) => (
            <g key={item.cohort.cohort} className={styles.cohortLineGroup} onClick={() => onToggleCohort(item.cohort.cohort)}>
              {item.points.length > 0 && (
                <path d={buildPath(item.points)} stroke={item.color} className={styles.cohortLineHighlighted} />
              )}
              {item.lastComplete && item.partialPoint && (
                <line
                  x1={item.lastComplete.x}
                  y1={item.lastComplete.y}
                  x2={item.partialPoint.x}
                  y2={item.partialPoint.y}
                  stroke={item.color}
                  className={styles.cohortLinePartialHighlighted}
                />
              )}
              {item.points.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r={4} fill={item.color} className={styles.marker} />
              ))}
            </g>
          ))}

        {averagePoints.length > 0 && (
          <g>
            <path d={buildPath(averagePoints)} stroke={AVERAGE_COLOR} className={styles.averageLine} />
            {averagePoints.map((point, index) => (
              <circle key={index} cx={point.x} cy={point.y} r={4.5} fill={AVERAGE_COLOR} className={styles.marker} />
            ))}
            <text
              x={averagePoints[averagePoints.length - 1].x + 10}
              y={averagePoints[averagePoints.length - 1].y + 4}
              className={styles.directLabel}
            >
              Average
            </text>
          </g>
        )}

        {directLabelSeries.map((item) => {
          const end = item.partialPoint ?? item.lastComplete;
          if (!end) return null;
          return (
            <text
              key={item.cohort.cohort}
              x={end.x + 10}
              y={end.y + 4}
              className={styles.directLabel}
            >
              {formatCohortLabel(item.cohort, interval)}
            </text>
          );
        })}

        {hoverPeriod !== null && (
          <line
            x1={xFor(hoverPeriod)}
            y1={PADDING.top}
            x2={xFor(hoverPeriod)}
            y2={PADDING.top + plotHeight}
            className={styles.crosshair}
          />
        )}
      </svg>

      {hoverPeriod !== null && (
        <div
          className={`${styles.tooltip} ${tooltipOnLeft ? styles.tooltipLeft : ""}`}
          style={{
            left: `${tooltipLeftPercent}%`,
            top: `${tooltipTopPercent}%`,
          }}
        >
          <div className={styles.tooltipTitle}>
            {`${meta.periodPrefix}${hoverPeriod} · ${hoverPeriod} ${meta.periodNoun}${hoverPeriod === 1 ? "" : "s"} after first use`}
          </div>
          <div className={styles.tooltipRows}>
            {tooltipRows.map((row) => (
              <div
                key={row.key}
                className={`${styles.tooltipRow} ${row.emphasis ? styles.tooltipRowEmphasis : ""}`}
              >
                <span className={styles.tooltipKey} style={{ background: row.color }} />
                <span className={styles.tooltipValue}>
                  {row.value === null ? "–" : formatPercent(row.value)}
                  {row.isPartial ? "*" : ""}
                </span>
                <span className={styles.tooltipLabel}>{row.label}</span>
                <span className={styles.tooltipDetail}>{row.detail}</span>
              </div>
            ))}
          </div>
          {tooltipRows.some((row) => row.isPartial) && (
            <div className={styles.tooltipFootnote}>* period still running</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetentionCurveChart;
