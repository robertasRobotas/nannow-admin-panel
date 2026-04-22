import { useEffect, useMemo, useState } from "react";
import styles from "./messagesSection.module.css";
import ChatMessages from "./ChatMessages/ChatMessages";
import Button from "@/components/Button/Button";
import { ChatMessageType, ChatType } from "@/types/Chats";
import { getChatById, getCurrentAdminRolesFromJwt } from "@/pages/api/fetch";
import avatarImg from "../../../../assets/images/default-avatar.png";

type MessagesSectionProps = {
  onBackClick: () => void;
  chats: ChatType[];
  userId: string;
};

type ChatDetails = {
  id: string;
  user1?: ChatType["user1"];
  user2?: ChatType["user2"];
  messages?: ChatMessageType[];
};

const isChatUnread = (chat: ChatType) => {
  if (Number(chat.unreadMessagesCount ?? 0) > 0) return true;
  if (!Array.isArray(chat.messages)) return false;
  return chat.messages.some((message) => !message.isRead);
};

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

const MessagesSection = ({
  onBackClick,
  chats,
  userId,
}: MessagesSectionProps) => {
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [userImgUrl, setUserImgUrl] = useState("");
  const [otherUserImgUrl, setOtherUserImgUrl] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const adminRoles = useMemo(() => getCurrentAdminRolesFromJwt(), []);
  const canModerate =
    adminRoles.includes("SUPER_ADMIN") || adminRoles.includes("CHAT_MODERATOR");
  const useSuperHistoryRoute = adminRoles.includes("SUPER_ADMIN");

  useEffect(() => {
    if (selectedChatId || chats.length === 0) return;
    setSelectedChatId(chats[0].chatId ?? chats[0].id);
  }, [chats, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) return;

    let isCancelled = false;

    const fetchSelectedMessages = async () => {
      try {
        setIsLoadingChat(true);
        const response = await getChatById(selectedChatId);
        const result = (response.data?.result ?? {}) as ChatDetails;
        if (isCancelled) return;

        setMessages(Array.isArray(result.messages) ? result.messages : []);
        setUserImgUrl(
          result.user1?.id === userId
            ? result.user1?.imgUrl ?? ""
            : result.user2?.imgUrl ?? "",
        );
        setOtherUserImgUrl(
          result.user1?.id !== userId
            ? result.user1?.imgUrl ?? ""
            : result.user2?.imgUrl ?? "",
        );
      } catch (err) {
        if (!isCancelled) {
          console.log(err);
          setMessages([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingChat(false);
        }
      }
    };

    fetchSelectedMessages();

    return () => {
      isCancelled = true;
    };
  }, [selectedChatId, userId]);

  const selectedChat = useMemo(
    () =>
      chats.find((chat) => (chat.chatId ?? chat.id) === selectedChatId) ?? null,
    [chats, selectedChatId],
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.layout}>
        <div className={styles.chatListPane}>
          <div className={styles.title}>Chats</div>
          <div className={styles.chatList}>
            {chats.length > 0 ? (
              chats.map((chat) => {
                const chatId = chat.chatId ?? chat.id;
                const counterpart = chat.user2?.id === userId ? chat.user1 : chat.user2;
                const lastMessage = Array.isArray(chat.messages)
                  ? chat.messages[chat.messages.length - 1]
                  : null;
                const unread = isChatUnread(chat);

                return (
                  <button
                    key={chatId}
                    type="button"
                    className={`${styles.chatRow} ${
                      selectedChatId === chatId ? styles.chatRowActive : ""
                    } ${unread ? styles.chatRowUnread : ""}`}
                    onClick={() => setSelectedChatId(chatId)}
                  >
                    {unread && <span className={styles.unreadDot} />}
                    <img
                      className={styles.chatAvatar}
                      src={counterpart?.imgUrl || avatarImg.src}
                      alt={counterpart?.firstName ?? "User"}
                    />
                    <div className={styles.chatMeta}>
                      <div className={styles.chatName}>
                        {`${counterpart?.firstName ?? "Deleted"} ${
                          counterpart?.lastName ?? "User"
                        }`.trim()}
                      </div>
                      <div className={styles.chatPreview}>
                        {lastMessage?.content?.trim() ||
                          (lastMessage?.imageUrl ? "Image" : "No messages yet")}
                      </div>
                    </div>
                    <div className={styles.chatDate}>
                      {formatDateTime(chat.lastMessageCreatedAt)}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className={styles.emptyState}>No chats yet</div>
            )}
          </div>
        </div>

        <div className={styles.messagesPane}>
          {selectedChat ? (
            <>
              <div className={styles.title}>
                {`${(selectedChat.user2?.id === userId
                  ? selectedChat.user1?.firstName
                  : selectedChat.user2?.firstName) ?? "Chat"}`}
              </div>
              {isLoadingChat ? (
                <div className={styles.emptyState}>Loading messages...</div>
              ) : messages.length > 0 ? (
                <ChatMessages
                  messages={messages}
                  userId={userId}
                  userImgUrl={userImgUrl}
                  otherUserImgUrl={otherUserImgUrl}
                  canModerate={canModerate}
                  useSuperHistoryRoute={useSuperHistoryRoute}
                />
              ) : (
                <div className={styles.emptyState}>No messages yet</div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>Select a chat</div>
          )}
        </div>
      </div>
      <div className={styles.backBtnWrapper}>
        <Button title="Back" onClick={onBackClick} type="OUTLINED" />
      </div>
    </div>
  );
};

export default MessagesSection;
