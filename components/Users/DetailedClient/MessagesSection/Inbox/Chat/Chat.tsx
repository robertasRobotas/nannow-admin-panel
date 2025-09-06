import { getChatById } from "@/pages/api/fetch";
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

  const fetchLastMessage = async (chatId: string) => {
    try {
      const response = await getChatById(chatId);
      console.log(response.data.result.messages);
      setLastMessage(
        response.data.result.messages[response.data.result.messages.length - 1]
          .content
      );
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
      </div>
    </div>
  );
};

export default Chat;
