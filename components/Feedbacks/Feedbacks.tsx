import { useCallback, useEffect, useState } from "react";
import styles from "./feedbacks.module.css";
import { useMediaQuery } from "react-responsive";
import { FeedbackType } from "@/types/Feedback";
import axios from "axios";
import { useRouter } from "next/router";
import { getAllFeedback, getFeedbackById } from "@/pages/api/fetch";
import FeedbacksList from "./FeedbacksList/FeedbacksList";
import DetailedFeedback from "./DetailedFeedback/DetailedFeedback";

type FeedbackProps = {
  detailedPageId?: string;
};

const Feedbacks = ({ detailedPageId }: FeedbackProps) => {
  const [selectedFeedbackId, setSelectedFeedbackId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [selectedFeedback, setFeedbackById] = useState<FeedbackType | null>();
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const pageSizeForOffset = itemsPerPage ?? 20;

  const updateFeedbackQuery = useCallback(
    (
      params: { page?: number; id?: string },
      method: "push" | "replace" = "push",
    ) => {
      if (!router.isReady || detailedPageId) return;
      const nextQuery = { ...router.query };
      if (typeof params.page === "number" && params.page > 0) {
        nextQuery.page = String(params.page);
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

  const fetchFeedback = useCallback(async () => {
    try {
      const response = await getAllFeedback(itemOffset);
      setFeedbacks(response.data.result.items);
      setItemsPerPage(response.data.result.pageSize);
      setPageCount(
        Math.ceil(response.data.result.total / response.data.result.pageSize)
      );
      setTotalFeedback(response.data.result.total);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [itemOffset, router]);

  const fetchFeedbackById = async (id: string) => {
    try {
      const response = await getFeedbackById(id);
      setFeedbackById(response.data.result);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchFeedback();
  }, [fetchFeedback, router.isReady]);

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
    setSelectedFeedbackId(idFromQuery);
  }, [detailedPageId, router.isReady, router.query.id]);

  useEffect(() => {
    if (detailedPageId) {
      fetchFeedbackById(detailedPageId);
    }
  }, [detailedPageId]);

  useEffect(() => {
    if (selectedFeedbackId) {
      fetchFeedbackById(selectedFeedbackId);
    }
  }, [selectedFeedbackId]);

  const selectFeedback = (nextFeedbackId: string) => {
    setSelectedFeedbackId(nextFeedbackId);
    const currentPage = Math.floor(itemOffset / pageSizeForOffset) + 1;
    updateFeedbackQuery({ page: currentPage, id: nextFeedbackId }, "push");
  };

  const clearSelectedFeedback = () => {
    setSelectedFeedbackId("");
    const currentPage = Math.floor(itemOffset / pageSizeForOffset) + 1;
    updateFeedbackQuery({ page: currentPage, id: "" }, "push");
  };

  const renderMobile = () => {
    if (selectedFeedbackId !== "" && selectedFeedback) {
      return (
        <DetailedFeedback
          feedback={selectedFeedback}
          onBackClick={clearSelectedFeedback}
          setFeedbacks={setFeedbacks}
          feedbacks={feedbacks}
        />
      );
    }

    return (
      <FeedbacksList
        feedbacks={feedbacks}
        selectedFeedbackId={selectedFeedbackId}
        setSelectedFeedbackId={(nextValue) => {
          const nextId =
            typeof nextValue === "function"
              ? nextValue(selectedFeedbackId)
              : nextValue;
          selectFeedback(nextId);
        }}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalFeedbacks={totalFeedback ?? 0}
        setItemOffset={(nextOffset) => {
          const offset =
            typeof nextOffset === "function" ? nextOffset(itemOffset) : nextOffset;
          const page = Math.floor(offset / pageSizeForOffset) + 1;
          updateFeedbackQuery({ page, id: selectedFeedbackId });
        }}
        setFeedbackById={setFeedbackById}
      />
    );
  };

  const renderDesktop = () => (
    <>
      <FeedbacksList
        feedbacks={feedbacks}
        selectedFeedbackId={selectedFeedbackId}
        setSelectedFeedbackId={(nextValue) => {
          const nextId =
            typeof nextValue === "function"
              ? nextValue(selectedFeedbackId)
              : nextValue;
          selectFeedback(nextId);
        }}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalFeedbacks={totalFeedback ?? 0}
        setItemOffset={(nextOffset) => {
          const offset =
            typeof nextOffset === "function" ? nextOffset(itemOffset) : nextOffset;
          const page = Math.floor(offset / pageSizeForOffset) + 1;
          updateFeedbackQuery({ page, id: selectedFeedbackId });
        }}
        setFeedbackById={setFeedbackById}
      />
      {selectedFeedback && (
        <DetailedFeedback
          feedback={selectedFeedback}
          onBackClick={clearSelectedFeedback}
          setFeedbacks={setFeedbacks}
          feedbacks={feedbacks}
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

export default Feedbacks;
