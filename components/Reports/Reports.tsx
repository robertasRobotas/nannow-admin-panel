import { useState } from "react";
import styles from "./reports.module.css";
import { reports } from "@/mocks/reports";
import { useMediaQuery } from "react-responsive";
import ReportsList from "./ReportsList/ReportsList";

const Reports = () => {
  const [selectedReportId, setSelectedReportId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [isSelectedMenu, setIsSelectedMenu] = useState(false);

  return (
    <div className={styles.main}>
      <ReportsList reports={reports} />
    </div>
  );
};

export default Reports;
