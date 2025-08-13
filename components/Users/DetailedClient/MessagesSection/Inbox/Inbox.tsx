import { ChatUser } from "@/types/MockChats";
import Chat from "./Chat/Chat";
import styles from "./inbox.module.css";
import { nunito } from "@/helpers/fonts";
import { Dispatch, SetStateAction } from "react";
import Button from "@/components/Button/Button";

type InboxProps = {
  chats: ChatUser[];
  setSelectedChatId: Dispatch<SetStateAction<string>>;
};

const Inbox = ({ chats, setSelectedChatId }: InboxProps) => {
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
          message={c.messages[c.messages.length - 1].text}
          onClick={() => {
            setSelectedChatId(c.id);
          }}
        />
      ))}
    </div>
  );
};

export default Inbox;
