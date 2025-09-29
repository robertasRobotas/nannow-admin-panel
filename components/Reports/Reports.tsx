import { useEffect, useState } from "react";
import styles from "./reports.module.css";
import { useMediaQuery } from "react-responsive";
import ReportsList from "./ReportsList/ReportsList";
import DetailedReport from "./DetailedReport/DetailedReport";
import { getAllReports, getReportById } from "@/pages/api/fetch";
import axios from "axios";
import { useRouter } from "next/router";

const Reports = () => {
  const [selectedReportId, setSelectedReportId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [reports, setReports] = useState([]);
  const [selectedReport, setReportById] = useState<ReportType>();
  const router = useRouter();

  const fetchReports = async () => {
    try {
      const response = await getAllReports();
      setReports(response.data.result.items);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/login");
        }
      }
    }
  };

  const fetchReportById = async (id: string) => {
    try {
      const response = await getReportById(id);
      setReportById(response.data.result);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedReportId) {
      fetchReportById(selectedReportId);
    }
  }, [selectedReportId]);

  const renderMobile = () => {
    if (selectedReportId && selectedReport) {
      return (
        <DetailedReport
          report={selectedReport}
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
      {selectedReportId && selectedReport && (
        <DetailedReport
          report={selectedReport}
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
