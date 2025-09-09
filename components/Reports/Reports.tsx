import { useState } from "react";
import styles from "./reports.module.css";
import { reports } from "@/mocks/reports";
import { useMediaQuery } from "react-responsive";
import ReportsList from "./ReportsList/ReportsList";
import DetailedReport from "./DetailedReport/DetailedReport";

const Reports = () => {
  const [selectedReportId, setSelectedReportId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const findSelectedReport = (id: string) =>
    reports.find((c) => c.id === id) ?? {};

  const renderMobile = () => {
    if (selectedReportId) {
      return (
        <DetailedReport
          report={findSelectedReport(selectedReportId)}
          onBackClick={() => setSelectedReportId("")}
        />
      );
    }

    return (
      <ReportsList
        reports={reports}
        selectedReportId={selectedReportId}
        setSelectedReportId={setSelectedReportId}
      />
    );
  };

  const renderDesktop = () => (
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
  );

  return (
    <div className={styles.main}>
      {isMobile ? renderMobile() : renderDesktop()}
    </div>
  );
};

export default Reports;
