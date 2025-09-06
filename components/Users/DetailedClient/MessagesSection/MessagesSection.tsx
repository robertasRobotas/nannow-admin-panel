import { useEffect, useState } from "react";
import styles from "./messagesSection.module.css";
import Inbox from "./Inbox/Inbox";
import ChatMessages from "./ChatMessages/ChatMessages";
import Button from "@/components/Button/Button";
import { ChatType } from "@/types/Chats";
import { getChatById } from "@/pages/api/fetch";

type MessagesSectionProps = {
  onBackClick: () => void;
  chats: ChatType[];
  userId: string;
};

const MessagesSection = ({
  onBackClick,
  chats,
  userId,
}: MessagesSectionProps) => {
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState([]);

  const fetchSelectedMessages = async () => {
    try {
      const response = await getChatById(selectedChatId);
      setMessages(response.data.result.messages);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setMessages([]);
    fetchSelectedMessages();
  }, [selectedChatId]);

  return (
    <div className={styles.wrapper}>
      {selectedChatId ? (
        <ChatMessages messages={messages} userId={userId} />
      ) : (
        <Inbox chats={chats} setSelectedChatId={setSelectedChatId} />
      )}
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
