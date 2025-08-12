import { ChatMessage, ChatUser } from "@/types/MockChats";
import Chat from "./Chat/Chat";
import styles from "./inbox.module.css";
import { nunito } from "@/helpers/fonts";
import { Dispatch, SetStateAction } from "react";

type InboxProps = {
  chats: ChatUser[];
  setSelectedSection: Dispatch<SetStateAction<string>>;
};

const Inbox = ({ chats, setSelectedSection }: InboxProps) => {
  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>Inbox</div>
      {chats.map((c) => (
        <Chat
          key={c.id}
          id={c.id}
          imgUrl={c.imgUrl}
          name={c.name}
          isVerified={c.isVerified}
          isCrown={c.isCrown}
          isVoicechat={c.isVoicechat}
          message={c.messages[0].text}
          onClick={() => {
            setSelectedSection("chat-messages");
          }}
        />
      ))}
    </div>
  );
};

export default Inbox;
