import { ChatType } from "@/types/Chats";
import Chat from "./Chat/Chat";
import styles from "./inbox.module.css";
import { nunito } from "@/helpers/fonts";
import { Dispatch, SetStateAction } from "react";
import { getChatById } from "@/pages/api/fetch";

type InboxProps = {
  chats: ChatType[];
  setSelectedChatId: Dispatch<SetStateAction<string>>;
};

const Inbox = ({ chats, setSelectedChatId }: InboxProps) => {
  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>Inbox</div>
      {chats.length > 0 &&
        chats.map((c) => (
          <Chat
            key={c.id}
            id={c.id}
            imgUrl={c?.otherUser?.imgUrl}
            name={`${c?.otherUser?.firstName} ${c?.otherUser?.lastName} `}
            onClick={() => {
              setSelectedChatId(c.id);
            }}
          />
        ))}
    </div>
  );
};

export default Inbox;
