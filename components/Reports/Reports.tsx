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
  const [reports, setReports] = useState<ReportType[]>([]);
  const [selectedReport, setReportById] = useState<ReportType | null>();
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalReports, setTotalReports] = useState(0);

  const fetchReports = async () => {
    try {
      const response = await getAllReports(itemOffset);
      setReports(response.data.result.items);
      setItemsPerPage(response.data.result.pageSize);
      setPageCount(
        Math.ceil(response.data.result.total / response.data.result.pageSize)
      );
      setTotalReports(response.data.result.total);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
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
          setReports={setReports}
          reports={reports}
        />
      );
    }

    return (
      <ReportsList
        reports={reports}
        selectedReportId={selectedReportId}
        setSelectedReportId={setSelectedReportId}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReports={totalReports ?? 0}
        setItemOffset={setItemOffset}
        setReportById={setReportById}
      />
    );
  };

  const renderDesktop = () => (
    <>
      <ReportsList
        reports={reports}
        selectedReportId={selectedReportId}
        setSelectedReportId={setSelectedReportId}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReports={totalReports ?? 0}
        setItemOffset={setItemOffset}
        setReportById={setReportById}
      />
      {selectedReportId && selectedReport && (
        <DetailedReport
          report={selectedReport}
          onBackClick={() => setSelectedReportId("")}
          setReports={setReports}
          reports={reports}
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
