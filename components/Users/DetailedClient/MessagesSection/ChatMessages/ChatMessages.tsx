import { ChatMessage } from "@/types/MockChats";
import styles from "./chatMessages.module.css";

type ChatMessagesProps = {
  messages: ChatMessage[];
};

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  return (
    <div className={styles.main}>
      {messages.map((m) => (
        <div
          key={m.id}
          className={`${styles.messageWrapper} ${
            m.isSent ? styles.alignRight : styles.alignLeft
          }`}
        >
          <div
            className={`${styles.chatBubble} ${
              m.isSent ? styles.sent : styles.received
            }`}
          >
            <span>{m.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
