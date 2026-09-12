import {
  ParentActivityRetentionCohort,
  RetentionInterval,
} from "@/types/ParentActivityRetention";

/** Ordinal blue ramp (validated light-mode steps 250/350/450/550/700): older cohorts light, newer dark. */
export const COHORT_RAMP = [
  "#86b6ef",
  "#5598e7",
  "#2a78d6",
  "#1c5cab",
  "#0d366b",
] as const;
/** Categorical slot 2 - reserved for the weighted-average headline line. */
export const AVERAGE_COLOR = "#eb6834";
export const MUTED_LINE_COLOR = "#d6d5d0";

export const INTERVAL_META: Record<
  RetentionInterval,
  { title: string; periodNoun: string; periodPrefix: string; axisLabel: string }
> = {
  week: {
    title: "Weekly activity retention",
    periodNoun: "week",
    periodPrefix: "W",
    axisLabel: "Weeks since first use",
  },
  biweek: {
    title: "Bi-weekly activity retention",
    periodNoun: "2-week period",
    periodPrefix: "P",
    axisLabel: "2-week periods since first use",
  },
  month: {
    title: "Monthly activity retention",
    periodNoun: "month",
    periodPrefix: "M",
    axisLabel: "Months since first use",
  },
};

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;

/** Position 0 = oldest cohort (lightest), 1 = newest (darkest). */
export const getCohortColor = (position: number) => {
  const clamped = Math.min(1, Math.max(0, position));
  const scaled = clamped * (COHORT_RAMP.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(COHORT_RAMP.length - 1, lower + 1);
  const t = scaled - lower;
  const from = hexToRgb(COHORT_RAMP[lower]);
  const to = hexToRgb(COHORT_RAMP[upper]);
  return rgbToHex({
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
  });
};

export const formatPercent = (value?: number | null, digits = 1) =>
  `${(((typeof value === "number" ? value : 0) || 0) * 100).toFixed(digits)}%`;

export const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("en-IE", { maximumFractionDigits: 0 }).format(
    typeof value === "number" ? value : 0,
  );

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatDayKey = (dayKey: string, withYear: boolean) => {
  const [year, month, day] = dayKey.split("-").map(Number);
  const label = `${day} ${MONTHS[(month || 1) - 1]}`;
  return withYear ? `${label} ${year}` : label;
};

/** Human label for a cohort: "Mar 2026" for months, "2 Mar 2026" (period start) for weeks and bi-weeks. */
export const formatCohortLabel = (
  cohort: ParentActivityRetentionCohort,
  interval: RetentionInterval,
) => {
  if (interval === "month") {
    const [year, month] = cohort.cohort.split("-").map(Number);
    return `${MONTHS[(month || 1) - 1]} ${year}`;
  }
  return formatDayKey(cohort.cohortStart, true);
};

export const formatCohortRange = (cohort: ParentActivityRetentionCohort) =>
  `${formatDayKey(cohort.cohortStart, false)} – ${formatDayKey(cohort.cohortEnd, true)}`;

export const formatIsoDateTime = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/** Rounds the y-axis ceiling up to a clean step so short curves are not squashed against 100%. */
export const getNiceMaxRate = (maxRate: number) => {
  if (maxRate >= 0.6) return 1;
  const step = maxRate > 0.25 ? 0.1 : 0.05;
  return Math.max(step, Math.ceil((maxRate + 0.001) / step) * step);
};

export const getMaxPeriod = (cohorts: ParentActivityRetentionCohort[]) =>
  cohorts.reduce(
    (acc, cohort) =>
      Math.max(acc, ...cohort.periods.map((period) => period.period)),
    0,
  );

const escapeCsvValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const downloadRetentionCsv = (
  interval: RetentionInterval,
  cohorts: ParentActivityRetentionCohort[],
) => {
  const rows: Array<Array<string | number | null | undefined>> = [
    [
      "interval",
      "cohort",
      "cohort_start",
      "cohort_end",
      "cohort_size",
      "period",
      "active_parents",
      "retention_rate",
      "is_partial",
    ],
    ...cohorts.flatMap((cohort) =>
      cohort.periods.map((period) => [
        interval,
        cohort.cohort,
        cohort.cohortStart,
        cohort.cohortEnd,
        cohort.cohortSize,
        period.period,
        period.activeUsers,
        period.retentionRate,
        period.isPartial ? "yes" : "no",
      ]),
    ),
  ];
  const lines = rows.map((row) => row.map(escapeCsvValue).join(","));
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `parent-activity-retention-${interval}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
