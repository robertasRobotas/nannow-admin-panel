import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import Invoices from "@/components/Invoices/Invoices";

const InvoicesPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <Invoices />
    </ModalPageTemplate>
  );
};

export default InvoicesPage;

