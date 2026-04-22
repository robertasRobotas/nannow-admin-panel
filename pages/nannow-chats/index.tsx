import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import NannowChats from "@/components/NannowChats/NannowChats";

const NannowChatsPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <NannowChats />
    </ModalPageTemplate>
  );
};

export default NannowChatsPage;
