import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import FinancialLedger from "@/components/FinancialLedger/FinancialLedger";

const FinancialLedgerPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <FinancialLedger />
    </ModalPageTemplate>
  );
};

export default FinancialLedgerPage;
