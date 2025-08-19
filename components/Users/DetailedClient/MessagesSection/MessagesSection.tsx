import { useState } from "react";
import styles from "./messagesSection.module.css";
import Inbox from "./Inbox/Inbox";
import { mockChatData } from "@/mocks/chats";
import ChatMessages from "./ChatMessages/ChatMessages";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";

type MessagesSectionProps = {
  onBackClick: () => void;
};

const MessagesSection = ({ onBackClick }: MessagesSectionProps) => {
  const [selectedChatId, setSelectedChatId] = useState("");
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const findSelectedMessages = (id: string) => {
    const messages = mockChatData.find((c) => c.id === id)?.messages ?? [];
    return messages;
  };

  return (
    <div className={styles.wrapper}>
      {selectedChatId ? (
        <ChatMessages messages={findSelectedMessages(selectedChatId)} />
      ) : (
        <Inbox chats={mockChatData} setSelectedChatId={setSelectedChatId} />
      )}{" "}
      <div className={styles.backBtnWrapper}>
        <Button
          title="Back"
          onClick={
            selectedChatId ? () => setSelectedChatId("") : () => onBackClick()
          }
          type="OUTLINED"
        />
      </div>
    </div>
  );
};

export default MessagesSection;
