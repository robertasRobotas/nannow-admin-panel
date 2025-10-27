import Feedbacks from "@/components/Feedbacks/Feedbacks";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";

const ReportsPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <Feedbacks />
    </ModalPageTemplate>
  );
};

export default ReportsPage;
