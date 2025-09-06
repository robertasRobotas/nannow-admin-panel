import { ChatMessageType } from "@/types/Chats";
import styles from "./chatMessages.module.css";

type ChatMessagesProps = {
  messages: ChatMessageType[];
  userId: string;
};

const ChatMessages = ({ messages, userId }: ChatMessagesProps) => {
  return (
    <div className={styles.main}>
      {messages.map((m) => {
        const isSender = m.senderId === userId;
        return (
          <div
            key={m.id}
            className={`${styles.messageWrapper} ${
              isSender ? styles.alignRight : styles.alignLeft
            }`}
          >
            <div
              className={`${styles.chatBubble} ${
                isSender ? styles.sent : styles.received
              }`}
            >
              <span>{m.content}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages;
