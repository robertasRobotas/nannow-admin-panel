import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Button from "@/components/Button/Button";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import { nunito } from "@/helpers/fonts";
import {
  getCurrentAdminRolesFromJwt,
  getMarketplaceAnalytics,
  rebuildMarketplaceAnalyticsDailySnapshots,
} from "@/pages/api/fetch";
import {
  getOrderStatusTitle,
  options as orderStatusOptions,
} from "@/data/orderStatusOptions";
import {
  GetMarketplaceAnalyticsResponse,
  MarketplaceAnalyticsAppliedFilters,
  MarketplaceAnalyticsBreakdownItem,
  MarketplaceAnalyticsCohortRow,
  MarketplaceAnalyticsInterval,
  MarketplaceAnalyticsParentTopItem,
  MarketplaceAnalyticsResponseData,
  MarketplaceAnalyticsSitterTopItem,
  MarketplaceAnalyticsTimeseriesItem,
} from "@/types/MarketplaceAnalytics";
import calendarImg from "@/assets/images/calendar.svg";
import defaultAvatarImg from "@/assets/images/default-avatar.png";
import styles from "./analytics.module.css";

const TIMEZONE = "Europe/Vilnius";
const DEFAULT_TOP_LIMIT = 10;

type PeriodPreset = "today" | "this_week" | "this_month" | "this_year" | "custom";

type DateRange = {
  startInput: string;
  endInput: string;
  startIso: string;
  endIso: string;
};

type FilterOption = {
  title: string;
  value: string;
};

type MultiSelectFilterProps = {
  label: string;
  emptyLabel: string;
  selectionLabel: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (nextValues: string[]) => void;
};

const EMPTY_ANALYTICS_DATA: MarketplaceAnalyticsResponseData = {
  overview: {
    kpis: {
      totalOrders: 0,
      paidOrders: 0,
      completedOrders: 0,
      canceledOrders: 0,
      revenueCents: 0,
      uniquePayingParents: 0,
      uniqueActiveSitters: 0,
      repeatParentRate: 0,
      repeatSitterRate: 0,
    },
    timeseries: [],
    funnel: {
      createdOrders: 0,
      paidOrders: 0,
      completedOrders: 0,
      canceledOrders: 0,
      paidRateFromCreated: 0,
      completedRateFromCreated: 0,
      completedRateFromPaid: 0,
    },
    cancellationBreakdown: {
      totalCanceledOrders: 0,
      byStatus: [],
      byReason: [],
    },
  },
  repeat: {
    parents: {
      uniqueUsers: 0,
      repeatUsers: 0,
      repeatRate: 0,
      averagePaidOrdersPerUser: 0,
      totalPaidOrders: 0,
      totalRevenueCents: 0,
      topParents: [],
    },
    sitters: {
      uniqueUsers: 0,
      repeatUsers: 0,
      repeatRate: 0,
      averagePaidOrdersPerUser: 0,
      totalPaidOrders: 0,
      totalRevenueCents: 0,
      topSitters: [],
    },
  },
  cohorts: {
    parents: [],
    sitters: [],
  },
};

const EMPTY_APPLIED_FILTERS: MarketplaceAnalyticsAppliedFilters = {
  interval: "day",
  timezone: TIMEZONE,
  statuses: [],
  paymentStatuses: [],
  topLimit: DEFAULT_TOP_LIMIT,
  city: "",
  country: "",
};

const INTERVAL_OPTIONS = [
  { title: "By day", value: "day" },
  { title: "By week", value: "week" },
  { title: "By month", value: "month" },
] as const;

const TOP_LIMIT_OPTIONS = [
  { title: "Top 5", value: "5" },
  { title: "Top 10", value: "10" },
  { title: "Top 20", value: "20" },
  { title: "Top 50", value: "50" },
] as const;

const PAYMENT_STATUS_OPTIONS: FilterOption[] = [
  { title: "PAID", value: "PAID" },
  { title: "PENDING", value: "PENDING" },
  { title: "FAILED", value: "FAILED" },
  { title: "REFUNDED", value: "REFUNDED" },
  { title: "UNPAID", value: "UNPAID" },
];

const STATUS_FILTER_OPTIONS: FilterOption[] = Array.from(
  new Map(
    orderStatusOptions
      .filter((option) => option.value)
      .map((option) => [option.value, { title: option.title, value: option.value }]),
  ).values(),
);

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

const formatMoneyFromCents = (value?: number | null) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((typeof value === "number" ? value : 0) / 100);

const formatPercent = (value?: number | null) =>
  `${(((typeof value === "number" ? value : 0) || 0) * 100).toFixed(1)}%`;

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("en-IE", { maximumFractionDigits: 0 }).format(
    typeof value === "number" ? value : 0,
  );

const formatAverage = (value?: number | null) =>
  new Intl.NumberFormat("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof value === "number" ? value : 0);

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

const formatBucketLabel = (
  bucket: string,
  interval: MarketplaceAnalyticsInterval,
) => {
  const date = new Date(bucket);
  if (Number.isNaN(date.getTime())) return bucket;

  if (interval === "month") {
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
    });
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getHeatmapOpacity = (rate: number) =>
  0.14 + Math.min(Math.max(rate, 0), 1) * 0.56;

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

const escapeCsvValue = (value: string | number | null | undefined) => {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const downloadCsv = (
  fileName: string,
  rows: Array<Array<string | number | null | undefined>>,
) => {
  const lines = rows.map((row) => row.map(escapeCsvValue).join(","));
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const getUserDisplayName = (firstName?: string | null, lastName?: string | null) =>
  `${firstName ?? "Deleted"} ${lastName ?? "User"}`.trim();

const MultiSelectFilter = ({
  label,
  emptyLabel,
  selectionLabel,
  options,
  selectedValues,
  onChange,
}: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedTitles = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.title);

  const summaryTitle =
    selectedTitles.length === 0
      ? emptyLabel
      : selectedTitles.length === 1
        ? selectedTitles[0]
        : `${selectedTitles.length} ${selectionLabel}`;

  return (
    <div className={styles.multiSelect} ref={dropdownRef}>
      <button
        type="button"
        className={styles.multiSelectButton}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{summaryTitle}</span>
        <span
          className={`${styles.multiSelectArrow} ${
            isOpen ? styles.multiSelectArrowOpen : ""
          }`}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div className={styles.multiSelectMenu}>
          <div className={styles.multiSelectLabel}>{label}</div>
          {options.map((option) => {
            const isChecked = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={styles.multiSelectItem}
                onClick={() => {
                  if (isChecked) {
                    onChange(
                      selectedValues.filter((value) => value !== option.value),
                    );
                    return;
                  }
                  onChange([...selectedValues, option.value]);
                }}
              >
                <span
                  className={`${styles.checkbox} ${
                    isChecked ? styles.checkboxChecked : ""
                  }`}
                >
                  {isChecked ? "✓" : ""}
                </span>
                <span>{option.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OrdersTimeseriesChart = ({
  data,
  interval,
}: {
  data: MarketplaceAnalyticsTimeseriesItem[];
  interval: MarketplaceAnalyticsInterval;
}) => {
  if (data.length === 0) {
    return (
      <div className={styles.chartEmpty}>No timeseries data for selected filters</div>
    );
  }

  const width = 900;
  const height = 280;
  const padding = { top: 18, right: 20, bottom: 54, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...data.map((item) => Math.max(item.totalOrders, item.paidOrders)),
  );
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.max(8, Math.min(18, slotWidth * 0.24));
  const labelStep = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartHeight * ratio;
        const label = Math.round(maxValue * (1 - ratio));
        return (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              className={styles.chartGridLine}
            />
            <text x={padding.left - 8} y={y + 4} className={styles.chartAxisLabel}>
              {label}
            </text>
          </g>
        );
      })}

      {data.map((item, index) => {
        const baseX = padding.left + slotWidth * index;
        const totalHeight = (item.totalOrders / maxValue) * chartHeight;
        const paidHeight = (item.paidOrders / maxValue) * chartHeight;
        const totalX = baseX + slotWidth * 0.18;
        const paidX = baseX + slotWidth * 0.52;
        const totalY = padding.top + chartHeight - totalHeight;
        const paidY = padding.top + chartHeight - paidHeight;
        const shouldShowLabel = index % labelStep === 0 || index === data.length - 1;

        return (
          <g key={`${item.bucket}-${index}`}>
            <rect
              x={totalX}
              y={totalY}
              width={barWidth}
              height={Math.max(totalHeight, 1)}
              rx={barWidth / 2}
              className={styles.totalBar}
            />
            <rect
              x={paidX}
              y={paidY}
              width={barWidth}
              height={Math.max(paidHeight, 1)}
              rx={barWidth / 2}
              className={styles.paidBar}
            />
            {shouldShowLabel && (
              <text
                x={baseX + slotWidth / 2}
                y={height - 18}
                textAnchor="middle"
                className={styles.chartAxisLabel}
              >
                {formatBucketLabel(item.bucket, interval)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const RevenueChart = ({
  data,
  interval,
}: {
  data: MarketplaceAnalyticsTimeseriesItem[];
  interval: MarketplaceAnalyticsInterval;
}) => {
  if (data.length === 0) {
    return (
      <div className={styles.chartEmpty}>No revenue data for selected filters</div>
    );
  }

  const width = 900;
  const height = 280;
  const padding = { top: 18, right: 20, bottom: 54, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...data.map((item) => item.revenueCents));
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.max(12, Math.min(32, slotWidth * 0.54));
  const labelStep = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartHeight * ratio;
        const label = formatMoneyFromCents(maxValue * (1 - ratio));
        return (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              className={styles.chartGridLine}
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              className={styles.chartAxisLabel}
              textAnchor="end"
            >
              {label}
            </text>
          </g>
        );
      })}

      {data.map((item, index) => {
        const baseX = padding.left + slotWidth * index;
        const barHeight = (item.revenueCents / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;
        const shouldShowLabel = index % labelStep === 0 || index === data.length - 1;

        return (
          <g key={`${item.bucket}-${index}`}>
            <rect
              x={baseX + (slotWidth - barWidth) / 2}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 1)}
              rx={barWidth / 2}
              className={styles.revenueBar}
            />
            {shouldShowLabel && (
              <text
                x={baseX + slotWidth / 2}
                y={height - 18}
                textAnchor="middle"
                className={styles.chartAxisLabel}
              >
                {formatBucketLabel(item.bucket, interval)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const TopUsersTable = ({
  title,
  items,
  kind,
}: {
  title: string;
  items: MarketplaceAnalyticsParentTopItem[] | MarketplaceAnalyticsSitterTopItem[];
  kind: "parent" | "sitter";
}) => {
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>{title}</h3>
        <div className={styles.panelSubtle}>{`${items.length} rows`}</div>
      </div>
      {items.length === 0 ? (
        <div className={styles.chartEmpty}>No users for selected period</div>
      ) : (
        <div className={styles.topTable}>
          <div className={styles.topTableHeader}>
            <span>User</span>
            <span>{kind === "parent" ? "Paid orders" : "Paid bookings"}</span>
            <span>Revenue</span>
          </div>
          {items.map((item) => {
            const name = getUserDisplayName(item.firstName, item.lastName);
            const count =
              kind === "parent"
                ? (item as MarketplaceAnalyticsParentTopItem).paidOrdersCount
                : (item as MarketplaceAnalyticsSitterTopItem).paidBookingsCount;
            const href = kind === "parent" ? `/client/${item.userId}` : `/provider/${item.userId}`;
            return (
              <Link
                href={href}
                className={styles.topTableRow}
                key={`${item.userId}-${name}`}
              >
                <span className={styles.topUserCell}>
                  <img
                    src={item.imgUrl || defaultAvatarImg.src}
                    alt={name}
                    className={styles.topUserAvatar}
                  />
                  <span className={styles.topUserMeta}>
                    <span className={styles.topUserName}>{name}</span>
                    <span className={styles.topUserEmail}>{item.email || "—"}</span>
                  </span>
                </span>
                <span className={styles.topMetric}>{formatNumber(count)}</span>
                <span className={styles.topMetric}>
                  {formatMoneyFromCents(item.revenueCents)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CohortTable = ({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: MarketplaceAnalyticsCohortRow[];
  tone: "parent" | "sitter";
}) => {
  const maxPeriod = rows.reduce(
    (acc, row) => Math.max(acc, ...row.periods.map((period) => period.period), 0),
    0,
  );

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>{title}</h3>
        <div className={styles.panelSubtle}>{`${rows.length} cohorts`}</div>
      </div>
      {rows.length === 0 ? (
        <div className={styles.chartEmpty}>No cohort data for selected period</div>
      ) : (
        <div className={styles.cohortWrap}>
          <div
            className={styles.cohortHeaderRow}
            style={{
              gridTemplateColumns: `130px repeat(${maxPeriod + 1}, 88px)`,
            }}
          >
            <div className={styles.cohortHeadSticky}>Cohort</div>
            {Array.from({ length: maxPeriod + 1 }, (_, index) => (
              <div key={index} className={styles.cohortHeadCell}>{`P${index}`}</div>
            ))}
          </div>
          {rows.map((row) => (
            <div
              className={styles.cohortRow}
              key={row.cohort}
              style={{
                gridTemplateColumns: `130px repeat(${maxPeriod + 1}, 88px)`,
              }}
            >
              <div className={styles.cohortStickyCell}>
                <div className={styles.cohortLabel}>{row.cohort}</div>
                <div className={styles.cohortSize}>{`${row.cohortSize} users`}</div>
              </div>
              {Array.from({ length: maxPeriod + 1 }, (_, index) => {
                const cell = row.periods.find((period) => period.period === index);
                const rate = cell?.retentionRate ?? 0;
                return (
                  <div
                    key={`${row.cohort}-${index}`}
                    className={`${styles.cohortCell} ${
                      tone === "parent"
                        ? styles.cohortCellParent
                        : styles.cohortCellSitter
                    }`}
                    style={{ opacity: cell ? getHeatmapOpacity(rate) : 0.06 }}
                  >
                    {cell ? (
                      <>
                        <span className={styles.cohortCellValue}>{cell.activeUsers}</span>
                        <span className={styles.cohortCellRate}>{formatPercent(cell.retentionRate)}</span>
                      </>
                    ) : (
                      <span className={styles.cohortCellRate}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BreakdownList = ({
  title,
  items,
}: {
  title: string;
  items: MarketplaceAnalyticsBreakdownItem[];
}) => {
  const maxCount = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>{title}</h3>
        <div className={styles.panelSubtle}>{`${items.length} items`}</div>
      </div>
      {items.length === 0 ? (
        <div className={styles.chartEmpty}>No cancellation data</div>
      ) : (
        <div className={styles.breakdownList}>
          {items.map((item, index) => {
            const label = item.status
              ? getOrderStatusTitle(item.status)
              : item.reason || "Unknown";
            const width = `${(item.count / maxCount) * 100}%`;
            return (
              <div key={`${label}-${index}`} className={styles.breakdownRow}>
                <div className={styles.breakdownTextWrap}>
                  <span className={styles.breakdownLabel}>{label}</span>
                  <span className={styles.breakdownCount}>{item.count}</span>
                </div>
                <div className={styles.breakdownBarTrack}>
                  <div className={styles.breakdownBarFill} style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const exportOverviewCsv = (timeseries: MarketplaceAnalyticsTimeseriesItem[]) => {
  downloadCsv("analytics-overview.csv", [
    ["bucket", "total_orders", "paid_orders", "revenue_eur"],
    ...timeseries.map((item) => [
      item.bucket,
      item.totalOrders,
      item.paidOrders,
      (item.revenueCents / 100).toFixed(2),
    ]),
  ]);
};

const exportTopParentsCsv = (parents: MarketplaceAnalyticsParentTopItem[]) => {
  downloadCsv("analytics-top-parents.csv", [
    [
      "user_id",
      "first_name",
      "last_name",
      "email",
      "paid_orders",
      "revenue_eur",
    ],
    ...parents.map((item) => [
      item.userId,
      item.firstName,
      item.lastName,
      item.email,
      item.paidOrdersCount,
      (item.revenueCents / 100).toFixed(2),
    ]),
  ]);
};

const exportTopSittersCsv = (sitters: MarketplaceAnalyticsSitterTopItem[]) => {
  downloadCsv("analytics-top-sitters.csv", [
    [
      "provider_id",
      "user_id",
      "first_name",
      "last_name",
      "email",
      "paid_bookings",
      "revenue_eur",
    ],
    ...sitters.map((item) => [
      item.providerId,
      item.userId,
      item.firstName,
      item.lastName,
      item.email,
      item.paidBookingsCount,
      (item.revenueCents / 100).toFixed(2),
    ]),
  ]);
};

const exportCohortsCsv = (
  parentRows: MarketplaceAnalyticsCohortRow[],
  sitterRows: MarketplaceAnalyticsCohortRow[],
) => {
  const flattenRows = (type: string, rows: MarketplaceAnalyticsCohortRow[]) =>
    rows.flatMap((row) =>
      row.periods.map((period) => [
        type,
        row.cohort,
        row.cohortSize,
        period.period,
        period.activeUsers,
        period.retentionRate,
      ]),
    );

  downloadCsv("analytics-cohorts.csv", [
    [
      "type",
      "cohort",
      "cohort_size",
      "period",
      "active_users",
      "retention_rate",
    ],
    ...flattenRows("parents", parentRows),
    ...flattenRows("sitters", sitterRows),
  ]);
};

const Analytics = () => {
  const router = useRouter();
  const defaultRange = useMemo(() => getPresetRange("this_month"), []);
  const [analytics, setAnalytics] =
    useState<MarketplaceAnalyticsResponseData>(EMPTY_ANALYTICS_DATA);
  const [appliedFilters, setAppliedFilters] =
    useState<MarketplaceAnalyticsAppliedFilters>(EMPTY_APPLIED_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodPreset>("this_month");
  const [startDateInput, setStartDateInput] = useState(defaultRange.startInput);
  const [endDateInput, setEndDateInput] = useState(defaultRange.endInput);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultRange.startIso);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultRange.endIso);
  const [countryInput, setCountryInput] = useState("");
  const [appliedCountry, setAppliedCountry] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([]);
  const [selectedIntervalOption, setSelectedIntervalOption] = useState(0);
  const [selectedTopLimitOption, setSelectedTopLimitOption] = useState(1);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isRebuildLoading, setIsRebuildLoading] = useState(false);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const selectedInterval =
    (INTERVAL_OPTIONS[selectedIntervalOption]?.value as MarketplaceAnalyticsInterval) ||
    "day";
  const selectedTopLimit = Number(
    TOP_LIMIT_OPTIONS[selectedTopLimitOption]?.value ?? DEFAULT_TOP_LIMIT,
  );

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    setIsSuperAdmin(roles.includes("SUPER_ADMIN"));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAppliedCountry(countryInput.trim().toUpperCase());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [countryInput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAppliedCity(cityInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [cityInput]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMarketplaceAnalytics({
        dateFrom: appliedStartDate,
        dateTo: appliedEndDate,
        interval: selectedInterval,
        timezone: TIMEZONE,
        country: appliedCountry || undefined,
        city: appliedCity || undefined,
        statuses: selectedStatuses,
        paymentStatuses: selectedPaymentStatuses,
        topLimit: selectedTopLimit,
      });

      const payload = response.data as GetMarketplaceAnalyticsResponse;
      setAnalytics(payload?.result ?? EMPTY_ANALYTICS_DATA);
      setAppliedFilters(payload?.filters ?? EMPTY_APPLIED_FILTERS);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setError("Failed to load analytics.");
      setAnalytics(EMPTY_ANALYTICS_DATA);
      setAppliedFilters(EMPTY_APPLIED_FILTERS);
    } finally {
      setLoading(false);
    }
  }, [
    appliedCountry,
    appliedCity,
    appliedEndDate,
    appliedStartDate,
    router,
    selectedInterval,
    selectedPaymentStatuses,
    selectedStatuses,
    selectedTopLimit,
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
  };

  const applyPresetRange = (preset: Exclude<PeriodPreset, "custom">) => {
    const range = getPresetRange(preset);
    setSelectedPeriod(preset);
    setValidationError("");
    setStartDateInput(range.startInput);
    setEndDateInput(range.endInput);
    setAppliedStartDate(range.startIso);
    setAppliedEndDate(range.endIso);
  };

  const rebuildSnapshots = async () => {
    if (!isSuperAdmin || isRebuildLoading) return;
    try {
      setIsRebuildLoading(true);
      const response = await rebuildMarketplaceAnalyticsDailySnapshots({
        dateFrom: appliedStartDate,
        dateTo: appliedEndDate,
      });
      const result = response.data?.result;
      toast.success(
        `Rebuilt ${Number(result?.dailySnapshotsRebuilt ?? 0)} snapshots, scanned ${Number(
          result?.ordersScanned ?? 0,
        )} orders`,
      );
      fetchAnalytics();
    } catch (err) {
      console.log(err);
      toast.error("Failed to rebuild marketplace analytics snapshots");
    } finally {
      setIsRebuildLoading(false);
    }
  };

  const appliedStartLabel = toInputDate(new Date(appliedStartDate));
  const appliedEndLabel = toInputDate(
    new Date(new Date(appliedEndDate).getTime() - 24 * 60 * 60 * 1000),
  );

  const timeseries = analytics.overview.timeseries ?? [];
  const kpis = analytics.overview.kpis;
  const funnel = analytics.overview.funnel;
  const cancellationBreakdown = analytics.overview.cancellationBreakdown;
  const repeatParents = analytics.repeat.parents;
  const repeatSitters = analytics.repeat.sitters;

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h2 className={`${styles.title} ${nunito.className}`}>Analytics</h2>
          <div className={styles.subtitle}>{`${formatNumber(
            kpis.totalOrders,
          )} orders in selected period`}</div>
        </div>
        <div className={styles.headerActions}>
          {isSuperAdmin && (
            <Button
              title={isRebuildLoading ? "Rebuilding..." : "Rebuild daily snapshots"}
              type="OUTLINED"
              onClick={rebuildSnapshots}
              isLoading={isRebuildLoading}
              isDisabled={isRebuildLoading}
            />
          )}
          <Button
            title="Overview CSV"
            type="OUTLINED"
            onClick={() => exportOverviewCsv(timeseries)}
          />
          <Button
            title="Top parents CSV"
            type="OUTLINED"
            onClick={() => exportTopParentsCsv(repeatParents.topParents)}
          />
          <Button
            title="Top sitters CSV"
            type="OUTLINED"
            onClick={() => exportTopSittersCsv(repeatSitters.topSitters)}
          />
          <Button
            title="Cohorts CSV"
            type="OUTLINED"
            onClick={() =>
              exportCohortsCsv(
                analytics.cohorts.parents,
                analytics.cohorts.sitters,
              )
            }
          />
        </div>
      </div>

      <div className={styles.filtersPanel}>
        <div className={styles.periodRow}>
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

            <Button title="Apply dates" type="OUTLINED" onClick={applyCustomDateRange} />
          </div>
        </div>

        <div className={styles.filtersRow}>
          <DropDownButton
            options={INTERVAL_OPTIONS.map((option) => ({
              title: option.title,
              value: option.value,
            }))}
            selectedOption={selectedIntervalOption}
            setSelectedOption={(nextOption) => {
              setSelectedIntervalOption(nextOption as number);
            }}
          />
          <DropDownButton
            options={TOP_LIMIT_OPTIONS.map((option) => ({
              title: option.title,
              value: option.value,
            }))}
            selectedOption={selectedTopLimitOption}
            setSelectedOption={(nextOption) => {
              setSelectedTopLimitOption(nextOption as number);
            }}
          />
          <div className={styles.textFieldWrap}>
            <label className={styles.fieldLabel} htmlFor="analytics-country">
              Country
            </label>
            <input
              id="analytics-country"
              className={styles.textInput}
              placeholder="LT"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
            />
          </div>
          <div className={styles.textFieldWrap}>
            <label className={styles.fieldLabel} htmlFor="analytics-city">
              City
            </label>
            <input
              id="analytics-city"
              className={styles.textInput}
              placeholder="All cities"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
          </div>
          <MultiSelectFilter
            label="Booking statuses"
            emptyLabel="All booking statuses"
            selectionLabel="statuses"
            options={STATUS_FILTER_OPTIONS}
            selectedValues={selectedStatuses}
            onChange={setSelectedStatuses}
          />
          <MultiSelectFilter
            label="Payment statuses"
            emptyLabel="All payment statuses"
            selectionLabel="payment statuses"
            options={PAYMENT_STATUS_OPTIONS}
            selectedValues={selectedPaymentStatuses}
            onChange={setSelectedPaymentStatuses}
          />
        </div>

        <div className={styles.filterSummary}>{`Period ${appliedStartLabel} - ${appliedEndLabel} · Timezone ${TIMEZONE}${
          appliedCountry ? ` · Country ${appliedCountry}` : ""
        }${
          appliedCity ? ` · City ${appliedCity}` : ""
        }${
          appliedFilters.statuses && appliedFilters.statuses.length > 0
            ? ` · ${appliedFilters.statuses.length} booking statuses`
            : ""
        }${
          appliedFilters.paymentStatuses &&
          appliedFilters.paymentStatuses.length > 0
            ? ` · ${appliedFilters.paymentStatuses.length} payment statuses`
            : ""
        }`}</div>

        {validationError && <div className={styles.validationError}>{validationError}</div>}
      </div>

      {loading && <div className={styles.loadingState}>Loading analytics...</div>}
      {!loading && error && <div className={styles.loadingState}>{error}</div>}

      {!loading && !error && (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Overview</h3>
              <div className={styles.sectionSubtle}>KPI cards and marketplace volume</div>
            </div>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Total orders</div>
                <div className={styles.kpiValue}>{formatNumber(kpis.totalOrders)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Paid orders</div>
                <div className={styles.kpiValue}>{formatNumber(kpis.paidOrders)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Completed orders</div>
                <div className={styles.kpiValue}>{formatNumber(kpis.completedOrders)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Cancelled orders</div>
                <div className={styles.kpiValue}>{formatNumber(kpis.canceledOrders)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Revenue</div>
                <div className={styles.kpiValue}>{formatMoneyFromCents(kpis.revenueCents)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Unique paying parents</div>
                <div className={styles.kpiValue}>{formatNumber(kpis.uniquePayingParents)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Unique active sitters</div>
                <div className={styles.kpiValue}>{formatNumber(kpis.uniqueActiveSitters)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Repeat parent rate</div>
                <div className={styles.kpiValue}>{formatPercent(kpis.repeatParentRate)}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Repeat sitter rate</div>
                <div className={styles.kpiValue}>{formatPercent(kpis.repeatSitterRate)}</div>
              </div>
            </div>

            <div className={styles.chartGrid}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Total vs paid orders</h3>
                  <div className={styles.chartLegend}>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendDotTotal}`} />
                      Total orders
                    </span>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendDotPaid}`} />
                      Paid orders
                    </span>
                  </div>
                </div>
                <OrdersTimeseriesChart data={timeseries} interval={selectedInterval} />
              </div>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Revenue over time</h3>
                  <div className={styles.panelSubtle}>{`Interval ${selectedInterval}`}</div>
                </div>
                <RevenueChart data={timeseries} interval={selectedInterval} />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Repeat analytics</h3>
              <div className={styles.sectionSubtle}>Parents and sitters with 2+ paid bookings</div>
            </div>

            <div className={styles.repeatSummaryGrid}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Parents</h3>
                  <div className={styles.panelSubtle}>{formatPercent(repeatParents.repeatRate)}</div>
                </div>
                <div className={styles.repeatMetricsGrid}>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Repeat users</span>
                    <span className={styles.repeatMetricValue}>{`${formatNumber(
                      repeatParents.repeatUsers,
                    )} / ${formatNumber(repeatParents.uniqueUsers)}`}</span>
                  </div>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Average paid orders</span>
                    <span className={styles.repeatMetricValue}>{formatAverage(
                      repeatParents.averagePaidOrdersPerUser,
                    )}</span>
                  </div>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Total paid orders</span>
                    <span className={styles.repeatMetricValue}>{formatNumber(
                      repeatParents.totalPaidOrders,
                    )}</span>
                  </div>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Revenue</span>
                    <span className={styles.repeatMetricValue}>{formatMoneyFromCents(
                      repeatParents.totalRevenueCents,
                    )}</span>
                  </div>
                </div>
              </div>

              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Sitters</h3>
                  <div className={styles.panelSubtle}>{formatPercent(repeatSitters.repeatRate)}</div>
                </div>
                <div className={styles.repeatMetricsGrid}>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Repeat users</span>
                    <span className={styles.repeatMetricValue}>{`${formatNumber(
                      repeatSitters.repeatUsers,
                    )} / ${formatNumber(repeatSitters.uniqueUsers)}`}</span>
                  </div>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Average bookings</span>
                    <span className={styles.repeatMetricValue}>{formatAverage(
                      repeatSitters.averagePaidOrdersPerUser,
                    )}</span>
                  </div>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Total paid bookings</span>
                    <span className={styles.repeatMetricValue}>{formatNumber(
                      repeatSitters.totalPaidOrders,
                    )}</span>
                  </div>
                  <div className={styles.repeatMetric}>
                    <span className={styles.repeatMetricLabel}>Revenue</span>
                    <span className={styles.repeatMetricValue}>{formatMoneyFromCents(
                      repeatSitters.totalRevenueCents,
                    )}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.twoColumnGrid}>
              <TopUsersTable
                title="Top parents"
                items={repeatParents.topParents}
                kind="parent"
              />
              <TopUsersTable
                title="Top sitters"
                items={repeatSitters.topSitters}
                kind="sitter"
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Retention and conversion</h3>
              <div className={styles.sectionSubtle}>Cohorts, funnel, and cancellation patterns</div>
            </div>

            <div className={styles.twoColumnGrid}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Created → paid → completed funnel</h3>
                  <div className={styles.panelSubtle}>{`${formatNumber(
                    funnel.createdOrders,
                  )} created orders`}</div>
                </div>
                <div className={styles.funnelRow}>
                  <div className={styles.funnelStep}>
                    <span className={styles.funnelLabel}>Created</span>
                    <span className={styles.funnelValue}>{formatNumber(funnel.createdOrders)}</span>
                    <span className={styles.funnelRate}>100%</span>
                  </div>
                  <div className={styles.funnelArrow}>→</div>
                  <div className={styles.funnelStep}>
                    <span className={styles.funnelLabel}>Paid</span>
                    <span className={styles.funnelValue}>{formatNumber(funnel.paidOrders)}</span>
                    <span className={styles.funnelRate}>{formatPercent(
                      funnel.paidRateFromCreated,
                    )}</span>
                  </div>
                  <div className={styles.funnelArrow}>→</div>
                  <div className={styles.funnelStep}>
                    <span className={styles.funnelLabel}>Completed</span>
                    <span className={styles.funnelValue}>{formatNumber(
                      funnel.completedOrders,
                    )}</span>
                    <span className={styles.funnelRate}>{formatPercent(
                      funnel.completedRateFromPaid,
                    )}</span>
                  </div>
                  <div className={styles.funnelArrow}>→</div>
                  <div className={styles.funnelStep}>
                    <span className={styles.funnelLabel}>Cancelled</span>
                    <span className={styles.funnelValue}>{formatNumber(
                      funnel.canceledOrders,
                    )}</span>
                    <span className={styles.funnelRate}>{formatPercent(
                      funnel.createdOrders > 0
                        ? funnel.canceledOrders / funnel.createdOrders
                        : 0,
                    )}</span>
                  </div>
                </div>
              </div>

              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Cancellation overview</h3>
                  <div className={styles.panelSubtle}>{`${formatNumber(
                    cancellationBreakdown.totalCanceledOrders,
                  )} canceled`}</div>
                </div>
                <div className={styles.cancellationCards}>
                  <div className={styles.cancellationMetric}>
                    <span className={styles.repeatMetricLabel}>Total canceled orders</span>
                    <span className={styles.cancellationMetricValue}>{formatNumber(
                      cancellationBreakdown.totalCanceledOrders,
                    )}</span>
                  </div>
                  <div className={styles.cancellationMetric}>
                    <span className={styles.repeatMetricLabel}>Paid from created</span>
                    <span className={styles.cancellationMetricValue}>{formatPercent(
                      funnel.paidRateFromCreated,
                    )}</span>
                  </div>
                  <div className={styles.cancellationMetric}>
                    <span className={styles.repeatMetricLabel}>Completed from created</span>
                    <span className={styles.cancellationMetricValue}>{formatPercent(
                      funnel.completedRateFromCreated,
                    )}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.twoColumnGrid}>
              <BreakdownList
                title="Cancellation by status"
                items={cancellationBreakdown.byStatus}
              />
              <BreakdownList
                title="Cancellation by reason"
                items={cancellationBreakdown.byReason}
              />
            </div>

            <div className={styles.twoColumnGrid}>
              <CohortTable
                title="Parent cohorts"
                rows={analytics.cohorts.parents}
                tone="parent"
              />
              <CohortTable
                title="Sitter cohorts"
                rows={analytics.cohorts.sitters}
                tone="sitter"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Analytics;
