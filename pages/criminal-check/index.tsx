import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import styles from "./criminalCheckPage.module.css";
import CriminalCheck from "@/components/CriminalCheck/CriminalCheck";

const CriminalCheckPage = () => {
  return (
    <ModalPageTemplate>
      <CriminalCheck />
    </ModalPageTemplate>
  );
};

export default CriminalCheckPage;
