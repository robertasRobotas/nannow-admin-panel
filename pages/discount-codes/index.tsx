import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import DiscountCodes from "@/components/DiscountCodes/DiscountCodes";

const DiscountCodesPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <DiscountCodes title="Discount codes" />
    </ModalPageTemplate>
  );
};

export default DiscountCodesPage;
