import { ChatMessageType } from "@/types/Chats";
import styles from "./chatMessages.module.css";

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
              <img className={styles.profileImg} src={otherUserImgUrl} />
            )}
            <div
              className={`${styles.chatBubble} ${
                isFromUser ? styles.sent : styles.received
              }`}
            >
              <span>{m.content}</span>
            </div>
            {isFromUser && (
              <img className={styles.profileImg} src={userImgUrl} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages;
