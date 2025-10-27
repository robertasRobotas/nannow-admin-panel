import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { useRouter } from "next/router";
import React from "react";
import Feedbacks from "@/components/Feedbacks/Feedbacks";

const DetailedFeedbackPage = () => {
  const router = useRouter();
  return (
    <ModalPageTemplate isScrollable={true}>
      {router.query.id && (
        <Feedbacks detailedPageId={router.query.id as string} />
      )}
    </ModalPageTemplate>
  );
};

export default DetailedFeedbackPage;
