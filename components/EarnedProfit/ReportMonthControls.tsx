import Button from "@/components/Button/Button";
import styles from "./earnedProfit.module.css";

export const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

const formatLedgerReportMonth = (year: number, month: number) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

type ReportMonthControlsProps = {
  currentYear: number;
  reportYearOptions: number[];
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  isRegenerateDisabled?: boolean;
  showRegenerateButton?: boolean;
  toolbarMeta?: string;
};

const ReportMonthControls = ({
  currentYear,
  reportYearOptions,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onRegenerate,
  isRegenerating = false,
  isRegenerateDisabled = false,
  showRegenerateButton = true,
  toolbarMeta,
}: ReportMonthControlsProps) => {
  const selectedMonthLabel =
    selectedYear && selectedMonth
      ? formatLedgerReportMonth(selectedYear, selectedMonth)
      : "Selected month";

  return (
    <div className={styles.reportsToolbar}>
      <div className={styles.reportControls}>
        <div className={styles.reportField}>
          <span>Year</span>
          <select
            value={selectedYear || currentYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {reportYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.reportField}>
          <span>Month</span>
          <select
            value={selectedMonth || 1}
            onChange={(event) => onMonthChange(Number(event.target.value))}
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        {showRegenerateButton && (
          <Button
            title={isRegenerating ? "Regenerating..." : "Regenerate month"}
            type="BLACK"
            onClick={onRegenerate}
            isLoading={isRegenerating}
            isDisabled={isRegenerateDisabled}
          />
        )}
      </div>
      <div className={styles.reportToolbarMeta}>{toolbarMeta ?? selectedMonthLabel}</div>
    </div>
  );
};

export default ReportMonthControls;
