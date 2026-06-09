import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Button from "@/components/Button/Button";
import {
  downloadPlatformFeeInvoiceReport,
  getPlatformFeeInvoiceReports,
  regeneratePlatformFeeInvoiceReport,
} from "@/pages/api/fetch";
import type {
  GetPlatformFeeInvoiceReportsResponse,
  PlatformFeeInvoiceReport,
} from "@/types/PlatformFeeInvoiceReport";
import ReportMonthControls from "./ReportMonthControls";
import styles from "./earnedProfit.module.css";

const formatLedgerReportMonth = (year: number, month: number) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

const formatLedgerReportDate = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date(value));

const formatLedgerReportDateTime = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(value));

const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const MonthlyReports = () => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const reportYearOptions = Array.from({ length: 10 }, (_, index) => currentYear - index);
  const [reports, setReports] = useState<PlatformFeeInvoiceReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [regeneratingReportKey, setRegeneratingReportKey] = useState("");
  const [downloadingReportKey, setDownloadingReportKey] = useState("");
  const [reportRegenerationTarget, setReportRegenerationTarget] =
    useState<{ year: number; month: number; label: string } | null>(null);
  const [selectedReportMonth, setSelectedReportMonth] = useState(() =>
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  );

  const [selectedReportYear, selectedReportMonthValue] = selectedReportMonth.split("-");
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

  const fetchPlatformFeeInvoiceReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      setReportsError("");
      const response = await getPlatformFeeInvoiceReports();
      const payload = response.data as
        | GetPlatformFeeInvoiceReportsResponse
        | { result?: GetPlatformFeeInvoiceReportsResponse };
      const data =
        (payload as { result?: GetPlatformFeeInvoiceReportsResponse }).result ??
        (payload as GetPlatformFeeInvoiceReportsResponse);

      const nextReports = Array.isArray(data?.reports) ? [...data.reports] : [];
      nextReports.sort((left, right) => {
        if (left.periodYear !== right.periodYear) {
          return right.periodYear - left.periodYear;
        }
        return right.periodMonth - left.periodMonth;
      });
      setReports(nextReports);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setReports([]);
      setReportsError("Failed to load monthly reports.");
    } finally {
      setReportsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPlatformFeeInvoiceReports();
  }, [fetchPlatformFeeInvoiceReports]);

  const handleDownloadReport = async (report: PlatformFeeInvoiceReport) => {
    const downloadKey = `${report.periodYear}-${report.periodMonth}`;
    if (downloadingReportKey) return;

    try {
      setDownloadingReportKey(downloadKey);
      const response = await downloadPlatformFeeInvoiceReport(
        report.periodYear,
        report.periodMonth,
      );
      triggerBlobDownload(
        response.data as Blob,
        report.fileName || `platform-fee-invoices-${report.periodKey}.csv`,
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setReportsError("Failed to download the report.");
    } finally {
      setDownloadingReportKey("");
    }
  };

  const handleRegenerateReport = async (report: PlatformFeeInvoiceReport) => {
    setReportRegenerationTarget({
      year: report.periodYear,
      month: report.periodMonth,
      label: formatLedgerReportMonth(report.periodYear, report.periodMonth),
    });
  };

  const regenerateSelectedReportMonth = async () => {
    if (!selectedReportYearNumber || !selectedReportMonthNumber) return;
    setReportRegenerationTarget({
      year: selectedReportYearNumber,
      month: selectedReportMonthNumber,
      label: formatLedgerReportMonth(
        selectedReportYearNumber,
        selectedReportMonthNumber,
      ),
    });
  };

  const closeReportRegenerationModal = () => {
    if (regeneratingReportKey) return;
    setReportRegenerationTarget(null);
  };

  const confirmReportRegeneration = async () => {
    if (!reportRegenerationTarget || regeneratingReportKey) return;

    const { year, month } = reportRegenerationTarget;
    const downloadKey = `${year}-${month}`;

    try {
      setRegeneratingReportKey(downloadKey);
      setReportsError("");
      await regeneratePlatformFeeInvoiceReport(year, month);
      await fetchPlatformFeeInvoiceReports();
      setReportRegenerationTarget(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      console.log(err);
      setReportsError("Failed to regenerate the report.");
    } finally {
      setRegeneratingReportKey("");
    }
  };

  return (
    <section className={styles.reportsSection}>
      <ReportMonthControls
        currentYear={currentYear}
        reportYearOptions={reportYearOptions}
        selectedYear={selectedReportYearNumber}
        selectedMonth={selectedReportMonthNumber}
        onYearChange={(year) =>
          setSelectedReportMonth(
            `${year}-${String(selectedReportMonthNumber || 1).padStart(2, "0")}`,
          )
        }
        onMonthChange={(month) =>
          setSelectedReportMonth(
            `${selectedReportYearNumber || currentYear}-${String(month).padStart(2, "0")}`,
          )
        }
        onRegenerate={regenerateSelectedReportMonth}
        isRegenerating={regeneratingReportKey === selectedReportMonthKey}
        isRegenerateDisabled={reportsLoading}
        toolbarMeta={selectedReportMonthLabel}
      />

      <div className={styles.reportsTableWrap}>
        <div className={styles.reportsTableHeader}>
          <div>Period</div>
          <div>Range</div>
          <div>Rows</div>
          <div>Generated</div>
          <div>File</div>
          <div>Actions</div>
        </div>

        <div className={styles.reportsTableBody}>
          {reportsLoading && (
            <div className={styles.emptyState}>Loading reports...</div>
          )}
          {!reportsLoading && reportsError && (
            <div className={styles.emptyState}>{reportsError}</div>
          )}
          {!reportsLoading && !reportsError && reports.length === 0 && (
            <div className={styles.emptyState}>
              No monthly reports have been generated yet.
            </div>
          )}

          {!reportsLoading &&
            !reportsError &&
            reports.map((report) => {
              const reportKey = `${report.periodYear}-${report.periodMonth}`;
              const inclusiveEnd = new Date(
                new Date(report.periodEnd).getTime() - 1,
              ).toISOString();
              return (
                <div key={report.id} className={styles.reportRow}>
                  <div className={styles.reportCell} data-label="Period">
                    <div className={styles.reportPrimary}>
                      {formatLedgerReportMonth(report.periodYear, report.periodMonth)}
                    </div>
                    <div className={styles.reportSecondary}>{report.timezone}</div>
                  </div>
                  <div className={styles.reportCell} data-label="Range">
                    <div className={styles.reportPrimary}>
                      {`${formatLedgerReportDate(report.periodStart, report.timezone)} - ${formatLedgerReportDate(inclusiveEnd, report.timezone)}`}
                    </div>
                    <div className={styles.reportSecondary}>{report.periodKey}</div>
                  </div>
                  <div className={styles.reportCell} data-label="Rows">
                    <div className={styles.reportPrimary}>{report.rowCount}</div>
                    <div className={styles.reportSecondary}>Ledger entries</div>
                  </div>
                  <div className={styles.reportCell} data-label="Generated">
                    <div className={styles.reportPrimary}>
                      {formatLedgerReportDateTime(report.generatedAt, report.timezone)}
                    </div>
                    <div className={styles.reportSecondary}>{report.timezone}</div>
                  </div>
                  <div className={styles.reportCell} data-label="File">
                    <div className={styles.reportPrimary}>{report.fileName}</div>
                    <div className={styles.reportSecondary}>{report.downloadPath}</div>
                  </div>
                  <div className={styles.reportActions} data-label="Actions">
                    <Button
                      title="Download CSV"
                      type="OUTLINED"
                      onClick={() => handleDownloadReport(report)}
                      isLoading={downloadingReportKey === reportKey}
                      isDisabled={
                        Boolean(downloadingReportKey) ||
                        Boolean(regeneratingReportKey)
                      }
                    />
                    <Button
                      title="Regenerate"
                      type="BLACK"
                      onClick={() => handleRegenerateReport(report)}
                      isLoading={regeneratingReportKey === reportKey}
                      isDisabled={
                        Boolean(regeneratingReportKey) ||
                        Boolean(downloadingReportKey)
                      }
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {reportRegenerationTarget && (
        <div className={styles.confirmationBackdrop}>
          <div className={styles.confirmationModal}>
            <h2 className={styles.confirmationTitle}>Regenerate report?</h2>
            <p className={styles.confirmationBody}>
              {`This will regenerate the ${reportRegenerationTarget.label} platform fee invoice CSV.`}
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
    </section>
  );
};

export default MonthlyReports;
