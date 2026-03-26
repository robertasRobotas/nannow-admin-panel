import { ChatMessageType, ChatType } from "@/types/Chats";
import Chat from "./Chat/Chat";
import styles from "./inbox.module.css";
import { nunito } from "@/helpers/fonts";
import { Dispatch, SetStateAction } from "react";
import { getChatById } from "@/pages/api/fetch";
import avatarImg from "../../../../../assets/images/default-avatar.png";

type InboxProps = {
  chats: ChatType[];
  setSelectedChatId: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<ChatMessageType[] | null>>;
  setUserImgUrl: Dispatch<SetStateAction<string>>;
  setOtherUserImgUrl: Dispatch<SetStateAction<string>>;
};

const Inbox = ({
  chats,
  setSelectedChatId,
  setMessages,
  setUserImgUrl,
  setOtherUserImgUrl,
}: InboxProps) => {
  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>Inbox</div>
      {chats.length > 0 &&
        chats.map((c) => (
          <Chat
            key={c.id}
            id={c.id}
            imgUrl={c?.user2?.imgUrl ?? avatarImg.src}
            name={`${c?.user2?.firstName ?? "Deleted"} ${
              c?.user2?.lastName ?? "User"
            } `}
            onClick={() => {
              setMessages(null);
              setSelectedChatId(c.id);
              setOtherUserImgUrl("");
              setUserImgUrl("");
            }}
          />
        ))}
    </div>
  );
};

export default Inbox;
