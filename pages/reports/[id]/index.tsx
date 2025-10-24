import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Reports from "@/components/Reports/Reports";

const DetailedReportPage = () => {
  const router = useRouter();
  return (
    <ModalPageTemplate isScrollable={false}>
      {router.query.id && (
        <Reports detailedPageId={router.query.id as string} />
      )}
    </ModalPageTemplate>
  );
};

export default DetailedReportPage;
