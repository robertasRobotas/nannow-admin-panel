import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import Credits from "@/components/Credits/Credits";

const CreditsPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <Credits title="Credits" />
    </ModalPageTemplate>
  );
};

export default CreditsPage;
