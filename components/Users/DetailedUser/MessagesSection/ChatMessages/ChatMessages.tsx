import { ChatMessageType } from "@/types/Chats";
import styles from "./chatMessages.module.css";
import avatarImg from "../../../../../assets/images/default-avatar.png";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
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

type ChatMessagesProps = {
  messages: ChatMessageType[];
  userId: string;
  userImgUrl: string;
  otherUserImgUrl: string;
};

const ChatMessages = ({
  messages,
  userId,
  userImgUrl,
  otherUserImgUrl,
}: ChatMessagesProps) => {
  return (
    <div className={styles.main}>
      {messages.map((m) => {
        const isFromUser = m.senderId === userId;
        return (
          <div
            key={m.id}
            className={`${styles.messageWrapper} ${
              isFromUser ? styles.alignRight : styles.alignLeft
            }`}
          >
            {!isFromUser && (
              <img
                className={styles.profileImg}
                src={
                  otherUserImgUrl.length > 0 ? otherUserImgUrl : avatarImg.src
                }
              />
            )}
            <div
              className={`${styles.chatBubble} ${
                isFromUser ? styles.sent : styles.received
              }`}
            >
              <span>{m.content}</span>
              <span className={styles.messageTimestamp}>
                {formatDateTime(m.createdAt)}
              </span>
            </div>
            {isFromUser && (
              <img
                className={styles.profileImg}
                src={userImgUrl.length > 0 ? userImgUrl : avatarImg.src}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages;
