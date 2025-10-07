import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import CriminalCheck from "@/components/CriminalCheck/CriminalCheck";

const CriminalCheckPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <CriminalCheck />
    </ModalPageTemplate>
  );
};

export default CriminalCheckPage;
