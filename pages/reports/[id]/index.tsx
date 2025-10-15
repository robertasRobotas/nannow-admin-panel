import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import DetailedReport from "@/components/Reports/DetailedReport/DetailedReport";
import { getReportById } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import styles from "./detailedReportPage.module.css";

const DetailedReportPage = () => {
  const [report, setReport] = useState();
  const router = useRouter();

  const fetchReport = async (id: string) => {
    const response = await getReportById(id);
    setReport(response.data.result);
  };

  useEffect(() => {
    router.query.id && fetchReport(router.query.id as string);
  }, [router.query.id]);

  return (
    <ModalPageTemplate isScrollable={false}>
      <div className={styles.main}>
        {report && <DetailedReport report={report} />}
      </div>
    </ModalPageTemplate>
  );
};

export default DetailedReportPage;
