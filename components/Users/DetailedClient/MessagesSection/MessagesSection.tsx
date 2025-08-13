import { useState } from "react";
import styles from "./messagesSection.module.css";
import Inbox from "./Inbox/Inbox";
import { mockChatData } from "@/mocks/chats";
import ChatMessages from "./ChatMessages/ChatMessages";

//WIP

const MessagesSection = () => {
  const [selectedChatId, setSelectedChatId] = useState("");

  const findSelectedMessages = (id: string) => {
    const messages = mockChatData.find((c) => c.id === id)?.messages ?? [];
    return messages;
  };

  return (
    <div>
      {selectedChatId ? (
        <ChatMessages messages={findSelectedMessages(selectedChatId)} />
      ) : (
        <Inbox chats={mockChatData} setSelectedChatId={setSelectedChatId} />
      )}
    </div>
  );
};

export default MessagesSection;
