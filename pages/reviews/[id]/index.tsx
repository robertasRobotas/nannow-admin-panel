import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { useRouter } from "next/router";
import React from "react";
import Reviews from "@/components/Reviews/Reviews";

const DetailedReportPage = () => {
  const router = useRouter();
  return (
    <ModalPageTemplate isScrollable={true}>
      {router.query.id && (
        <Reviews detailedPageId={router.query.id as string} />
      )}
    </ModalPageTemplate>
  );
};

export default DetailedReportPage;
