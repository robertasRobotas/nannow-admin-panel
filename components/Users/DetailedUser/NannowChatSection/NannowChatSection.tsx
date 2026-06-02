import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Button from "@/components/Button/Button";
import ChatMessages from "@/components/Users/DetailedUser/MessagesSection/ChatMessages/ChatMessages";
import {
  getAdminChats,
  getChatById,
  getCurrentAdminRolesFromJwt,
  markSystemNannowChatRead,
  replySystemNannowChat,
} from "@/pages/api/fetch";
import { ChatMessageType, ChatType } from "@/types/Chats";
import { UserDetails } from "@/types/Client";
import avatarImg from "@/assets/images/default-avatar.png";
import messageStyles from "@/components/Users/DetailedUser/MessagesSection/messagesSection.module.css";
import styles from "./nannowChatSection.module.css";

const SYSTEM_NANNOW_ID = "SYSTEM_NANNOW";

type NannowChatSectionProps = {
  user: UserDetails;
  onBackClick: () => void;
};

type ChatDetails = {
  id: string;
  chatId?: string;
  user1?: ChatType["user1"];
  user2?: ChatType["user2"];
  messages?: ChatMessageType[];
};

const getChatFromResponse = (data: unknown): ChatDetails | null => {
  if (typeof data !== "object" || data === null) return null;
  const record = data as Record<string, unknown>;
  const result = record.result;

  if (typeof result === "object" && result !== null) {
    const resultRecord = result as Record<string, unknown>;
    if (typeof resultRecord.chat === "object" && resultRecord.chat !== null) {
      return resultRecord.chat as ChatDetails;
    }
    return result as ChatDetails;
  }

  if (typeof record.chat === "object" && record.chat !== null) {
    return record.chat as ChatDetails;
  }

  return record as ChatDetails;
};

const getSystemUser = (chat: ChatDetails | null, userId: string) => {
  if (!chat) return null;
  if (chat.user1?.id && chat.user1.id !== userId) return chat.user1;
  if (chat.user2?.id && chat.user2.id !== userId) return chat.user2;
  return null;
};

const getChatId = (chat: ChatDetails | null) => chat?.chatId ?? chat?.id ?? "";

const getChatParticipantId = (chat: ChatType, key: "user1" | "user2") =>
  chat[key]?.id ?? (key === "user1" ? chat.user1Id : chat.user2Id) ?? "";

const isSystemChatForUser = (chat: ChatType, userId: string) => {
  const user1Id = getChatParticipantId(chat, "user1");
  const user2Id = getChatParticipantId(chat, "user2");

  return (
    (user1Id === userId && user2Id === SYSTEM_NANNOW_ID) ||
    (user2Id === userId && user1Id === SYSTEM_NANNOW_ID)
  );
};

const NannowChatSection = ({ user, onBackClick }: NannowChatSectionProps) => {
  const userId = user.user.id;
  const [chat, setChat] = useState<ChatDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [error, setError] = useState("");

  const adminRoles = useMemo(() => getCurrentAdminRolesFromJwt(), []);
  const canModerate =
    adminRoles.includes("SUPER_ADMIN") || adminRoles.includes("CHAT_MODERATOR");
  const useSuperHistoryRoute = adminRoles.includes("SUPER_ADMIN");

  const chatId = getChatId(chat);
  const systemUser = getSystemUser(chat, userId);

  const loadChatById = useCallback(async (nextChatId: string) => {
    const response = await getChatById(nextChatId);
    const nextChat = getChatFromResponse(response.data);
    setChat(nextChat);
    setMessages(Array.isArray(nextChat?.messages) ? nextChat.messages : []);
  }, []);

  const loadUserSystemChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getAdminChats({
        startIndex: 0,
        pageSize: 200,
        sort: "latest",
        search: userId,
      });
      const items = response.data?.result?.items ?? response.data?.items ?? [];
      const nextChat = Array.isArray(items)
        ? items.find((item) => isSystemChatForUser(item, userId)) ?? null
        : null;

      const nextChatId = nextChat?.chatId ?? nextChat?.id ?? "";

      if (nextChatId) {
        await loadChatById(nextChatId);
        return;
      }

      setChat(null);
      setMessages([]);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setChat(null);
        setMessages([]);
        return;
      }
      console.log(err);
      setError("Failed to load Nannow chat.");
      setChat(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadChatById, userId]);

  useEffect(() => {
    void loadUserSystemChat();
  }, [loadUserSystemChat]);

  const handleMarkRead = async () => {
    if (!chatId || isMarkingRead) return;
    try {
      setIsMarkingRead(true);
      await markSystemNannowChatRead(chatId);
      setMessages((current) =>
        current.map((message) => ({ ...message, isRead: true })),
      );
    } catch (err) {
      console.log(err);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    try {
      setIsSending(true);
      setError("");
      const response = await replySystemNannowChat(chatId || userId, content);
      setInputValue("");

      const nextChat = getChatFromResponse(response.data);
      const nextChatId = getChatId(nextChat) || chatId;
      if (nextChatId) {
        await loadChatById(nextChatId);
      } else {
        await loadUserSystemChat();
      }
    } catch (err) {
      console.log(err);
      setError(chatId ? "Failed to send message." : "Failed to create Nannow chat.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={messageStyles.wrapper}>
      <div className={styles.header}>
        <div>
          <div className={messageStyles.title}>Nannow chat</div>
          <div className={styles.subtitle}>
            {user.user.firstName} {user.user.lastName}
          </div>
        </div>
      </div>

      <div className={styles.chatPanel}>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.composer}>
          <textarea
            className={styles.replyInput}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={chatId ? "Reply as SYSTEM_NANNOW" : "Create Nannow chat"}
            disabled={isSending}
          />
          <div className={styles.composerActions}>
            {chatId && (
              <Button
                title={isMarkingRead ? "Marking..." : "Mark read"}
                type="OUTLINED"
                onClick={handleMarkRead}
                isDisabled={isSending || isMarkingRead}
                isLoading={isMarkingRead}
              />
            )}
            <Button
              title={isSending ? "Sending..." : chatId ? "Reply" : "Create chat"}
              type="BLACK"
              onClick={handleSend}
              isDisabled={inputValue.trim().length === 0 || isSending || isLoading}
              isLoading={isSending}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={messageStyles.emptyState}>Loading Nannow chat...</div>
        ) : messages.length > 0 ? (
          <ChatMessages
            messages={messages}
            userId={userId}
            userImgUrl={user.user.imgUrl || avatarImg.src}
            otherUserImgUrl={systemUser?.imgUrl || avatarImg.src}
            canModerate={canModerate}
            useSuperHistoryRoute={useSuperHistoryRoute}
          />
        ) : (
          <div className={messageStyles.emptyState}>
            No Nannow chat yet. Send a message to create one.
          </div>
        )}
      </div>

      <div className={messageStyles.backBtnWrapper}>
        <Button title="Back" onClick={onBackClick} type="OUTLINED" />
      </div>
    </div>
  );
};

export default NannowChatSection;
