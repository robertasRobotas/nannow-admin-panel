import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import Campaigns from "@/components/Campaigns/Campaigns";

const CampaignsPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <Campaigns />
    </ModalPageTemplate>
  );
};

export default CampaignsPage;
