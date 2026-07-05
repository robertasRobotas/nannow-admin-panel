import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import GiftCardsCredits from "@/components/GiftCardsCredits/GiftCardsCredits";

const GiftCardsCreditsPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <GiftCardsCredits title="Gift Cards & Credits" />
    </ModalPageTemplate>
  );
};

export default GiftCardsCreditsPage;
