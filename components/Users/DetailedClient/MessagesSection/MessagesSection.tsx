import { useEffect, useState } from "react";
import styles from "./messagesSection.module.css";
import Inbox from "./Inbox/Inbox";
import ChatMessages from "./ChatMessages/ChatMessages";
import Button from "@/components/Button/Button";
import { ChatMessageType, ChatType } from "@/types/Chats";
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
  const [messages, setMessages] = useState<ChatMessageType[] | null>([]);
  const [userImgUrl, setUserImgUrl] = useState("");
  const [otherUserImgUrl, setOtherUserImgUrl] = useState("");

  const fetchSelectedMessages = async () => {
    try {
      const response = await getChatById(selectedChatId);
      setMessages(response.data.result.messages);
      setUserImgUrl(
        response.data.result.user1.id === userId
          ? response.data.result.user1.imgUrl
          : response.data.result.user2.imgUrl
      );
      setOtherUserImgUrl(
        response.data.result.user1.id !== userId
          ? response.data.result.user1.imgUrl
          : response.data.result.user2.imgUrl
      );
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      setMessages([]);
      fetchSelectedMessages();
    }
  }, [selectedChatId]);

  return (
    <div className={styles.wrapper}>
      {selectedChatId !== "" && messages ? (
        <ChatMessages
          messages={messages}
          userId={userId}
          userImgUrl={userImgUrl}
          otherUserImgUrl={otherUserImgUrl}
        />
      ) : (
        <Inbox
          chats={chats}
          setSelectedChatId={setSelectedChatId}
          setMessages={setMessages}
          setUserImgUrl={setUserImgUrl}
          setOtherUserImgUrl={setOtherUserImgUrl}
        />
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
