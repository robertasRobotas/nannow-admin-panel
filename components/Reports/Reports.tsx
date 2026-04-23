import { useCallback, useEffect, useState } from "react";
import styles from "./reports.module.css";
import { useMediaQuery } from "react-responsive";
import ReportsList from "./ReportsList/ReportsList";
import DetailedReport from "./DetailedReport/DetailedReport";
import { getAllReports, getReportById } from "@/pages/api/fetch";
import axios from "axios";
import { useRouter } from "next/router";

type ReportsProps = {
  detailedPageId?: string;
};

const Reports = ({ detailedPageId }: ReportsProps) => {
  const [selectedReportId, setSelectedReportId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [reports, setReports] = useState<ReportType[]>([]);
  const [selectedReport, setReportById] = useState<ReportType | null>();
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const pageSizeForOffset = itemsPerPage ?? 20;

  const updateReportsQuery = useCallback(
    (
      params: { page?: number; id?: string },
      method: "push" | "replace" = "push",
    ) => {
      if (!router.isReady || detailedPageId) return;
      const nextQuery = { ...router.query };
      if (typeof params.page === "number" && params.page > 0) {
        nextQuery.page = String(Math.max(1, params.page));
      }
      if (typeof params.id === "string" && params.id.length > 0) {
        nextQuery.id = params.id;
      } else if (params.id !== undefined) {
        delete nextQuery.id;
      }
      router[method](
        {
          pathname: router.pathname,
          query: nextQuery,
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [detailedPageId, router],
  );

  const fetchReports = useCallback(async () => {
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
  }, [itemOffset, router]);

  const fetchReportById = async (id: string) => {
    try {
      const response = await getReportById(id);
      setReportById(response.data.result);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchReports();
  }, [fetchReports, router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    const pageFromQuery =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const safePage =
      Number.isFinite(pageFromQuery) && pageFromQuery > 0
        ? Math.floor(pageFromQuery)
        : 1;
    setItemOffset((safePage - 1) * pageSizeForOffset);
  }, [pageSizeForOffset, router.isReady, router.query.page]);

  useEffect(() => {
    if (!router.isReady || detailedPageId) return;
    const idFromQuery = typeof router.query.id === "string" ? router.query.id : "";
    setSelectedReportId(idFromQuery);
  }, [detailedPageId, router.isReady, router.query.id]);

  useEffect(() => {
    if (detailedPageId) {
      fetchReportById(detailedPageId);
    }
  }, [detailedPageId]);

  useEffect(() => {
    if (selectedReportId) {
      fetchReportById(selectedReportId);
    }
  }, [selectedReportId]);

  const selectReport = (nextReportId: string) => {
    setSelectedReportId(nextReportId);
    const currentPage = Math.floor(itemOffset / pageSizeForOffset) + 1;
    updateReportsQuery({ page: currentPage, id: nextReportId }, "push");
  };

  const clearSelectedReport = () => {
    setSelectedReportId("");
    const currentPage = Math.floor(itemOffset / pageSizeForOffset) + 1;
    updateReportsQuery({ page: currentPage, id: "" }, "push");
  };

  const renderMobile = () => {
    if (selectedReportId !== "" && selectedReport) {
      return (
        <DetailedReport
          report={selectedReport}
          onBackClick={clearSelectedReport}
          setReports={setReports}
          reports={reports}
        />
      );
    }

    return (
      <ReportsList
        reports={reports}
        selectedReportId={selectedReportId}
        setSelectedReportId={(nextValue) => {
          const nextId =
            typeof nextValue === "function"
              ? nextValue(selectedReportId)
              : nextValue;
          selectReport(nextId);
        }}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReports={totalReports ?? 0}
        setItemOffset={(nextOffset) => {
          const offset =
            typeof nextOffset === "function" ? nextOffset(itemOffset) : nextOffset;
          const page = Math.floor(offset / pageSizeForOffset) + 1;
          updateReportsQuery({ page, id: selectedReportId });
        }}
        setReportById={setReportById}
      />
    );
  };

  const renderDesktop = () => (
    <>
      <ReportsList
        reports={reports}
        selectedReportId={selectedReportId}
        setSelectedReportId={(nextValue) => {
          const nextId =
            typeof nextValue === "function"
              ? nextValue(selectedReportId)
              : nextValue;
          selectReport(nextId);
        }}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalReports={totalReports ?? 0}
        setItemOffset={(nextOffset) => {
          const offset =
            typeof nextOffset === "function" ? nextOffset(itemOffset) : nextOffset;
          const page = Math.floor(offset / pageSizeForOffset) + 1;
          updateReportsQuery({ page, id: selectedReportId });
        }}
        setReportById={setReportById}
      />
      {selectedReport && (
        <DetailedReport
          report={selectedReport}
          onBackClick={clearSelectedReport}
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
