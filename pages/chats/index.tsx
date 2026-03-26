import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import AdminChats from "@/components/AdminChats/AdminChats";

const ChatsPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <AdminChats />
    </ModalPageTemplate>
  );
};

export default ChatsPage;
