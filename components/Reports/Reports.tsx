import { useState } from "react";
import styles from "./reports.module.css";
import { reports } from "@/mocks/reports";
import { useMediaQuery } from "react-responsive";
import ReportsList from "./ReportsList/ReportsList";
import DetailedReport from "./DetailedReport/DetailedReport";

const Reports = () => {
  const [selectedReportId, setSelectedReportId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const findSelectedReport = (id: string) => {
    const report = reports.find((c) => c.id === id) ?? {};
    return report;
  };

  return (
    <div className={styles.main}>
      {isMobile ? (
        selectedReportId ? (
          <DetailedReport
            report={findSelectedReport(selectedReportId)}
            onBackClick={() => setSelectedReportId("")}
          />
        ) : (
          <ReportsList
            reports={reports}
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
          />
        )
      ) : (
        <>
          <ReportsList
            reports={reports}
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
          />
          {selectedReportId && (
            <DetailedReport
              report={findSelectedReport(selectedReportId)}
              onBackClick={() => setSelectedReportId("")}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
