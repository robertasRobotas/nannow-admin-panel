import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import AdminMessages from "@/components/AdminMessages/AdminMessages";

const MessagesPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <AdminMessages />
    </ModalPageTemplate>
  );
};

export default MessagesPage;
