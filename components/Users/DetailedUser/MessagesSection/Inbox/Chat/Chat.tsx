import { getChatById } from "@/pages/api/fetch";
import { ChatMessageType } from "@/types/Chats";
import styles from "./chat.module.css";
import { useEffect, useState } from "react";

type ChatProps = {
  id: string;
  name: string;
  imgUrl: string;
  onClick: () => void;
};

const Chat = ({ id, name, imgUrl, onClick }: ChatProps) => {
  const [lastMessage, setLastMessage] = useState("");
  const [lastMessageReadAt, setLastMessageReadAt] = useState<string | null>(
    null,
  );

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const fetchLastMessage = async (chatId: string) => {
    try {
      const response = await getChatById(chatId);
      const messages = response.data.result.messages as
        | ChatMessageType[]
        | undefined;
      const message = Array.isArray(messages)
        ? messages[messages.length - 1]
        : null;
      setLastMessage(
        message?.content?.trim() ||
          (message?.imageUrl ? "Image" : "No messages yet"),
      );
      setLastMessageReadAt(message?.readAt ?? null);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchLastMessage(id);
  }, []);

  return (
    <div onClick={onClick} className={styles.main}>
      <img className={styles.profileImg} src={imgUrl} alt="Icon" />
      <div className={styles.chatDetails}>
        <div className={styles.name}>
          <span>{name}</span>
        </div>
        <div className={styles.lastMessage}>{lastMessage}</div>
        {lastMessageReadAt && (
          <div className={styles.readAt}>
            Read: {formatDateTime(lastMessageReadAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
