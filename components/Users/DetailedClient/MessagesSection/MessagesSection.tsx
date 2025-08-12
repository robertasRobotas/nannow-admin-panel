import { useState } from "react";
import styles from "./messagesSection.module.css";
import Inbox from "./Inbox/Inbox";
import { mockChatData } from "@/mocks/chats";

//WIP

const MessagesSection = () => {
  const [selectedSection, setSelectedSection] = useState("inbox");
  const [selectedChatId, setSelectedChatId] = useState("");
  const renderSelectedSection = () => {
    switch (selectedSection) {
      case "inbox": {
        return (
          <Inbox chats={mockChatData} setSelectedSection={setSelectedSection} />
        );
      }
    }
  };
  return <div>{renderSelectedSection()}</div>;
};

export default MessagesSection;
