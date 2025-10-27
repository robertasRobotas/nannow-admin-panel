import { useEffect, useState } from "react";
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

  const fetchFeedback = async () => {
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
  };

  const fetchFeedbackById = async (id: string) => {
    try {
      const response = await getFeedbackById(id);
      setFeedbackById(response.data.result);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchFeedback();
    if (detailedPageId) {
      fetchFeedbackById(detailedPageId);
    }
  }, []);

  useEffect(() => {
    if (selectedFeedbackId) {
      fetchFeedbackById(selectedFeedbackId);
    }
  }, [selectedFeedbackId]);

  const renderMobile = () => {
    if (selectedFeedbackId !== "" && selectedFeedback) {
      return (
        <DetailedFeedback
          feedback={selectedFeedback}
          onBackClick={() => setSelectedFeedbackId("")}
          setFeedbacks={setFeedbacks}
          feedbacks={feedbacks}
        />
      );
    }

    return (
      <FeedbacksList
        feedbacks={feedbacks}
        selectedFeedbackId={selectedFeedbackId}
        setSelectedFeedbackId={setSelectedFeedbackId}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalFeedbacks={totalFeedback ?? 0}
        setItemOffset={setItemOffset}
        setFeedbackById={setFeedbackById}
      />
    );
  };

  const renderDesktop = () => (
    <>
      <FeedbacksList
        feedbacks={feedbacks}
        selectedFeedbackId={selectedFeedbackId}
        setSelectedFeedbackId={setSelectedFeedbackId}
        itemsPerPage={itemsPerPage ?? 0}
        pageCount={pageCount ?? 0}
        totalFeedbacks={totalFeedback ?? 0}
        setItemOffset={setItemOffset}
        setFeedbackById={setFeedbackById}
      />
      {selectedFeedback && (
        <DetailedFeedback
          feedback={selectedFeedback}
          onBackClick={() => setSelectedFeedbackId("")}
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
