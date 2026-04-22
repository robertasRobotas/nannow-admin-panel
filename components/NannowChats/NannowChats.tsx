import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import { useRouter } from "next/router";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import SearchBar from "@/components/SearchBar/SearchBar";
import Button from "@/components/Button/Button";
import {
  getChatById,
  getCurrentAdminRolesFromJwt,
  getSystemNannowChats,
  markSystemNannowChatRead,
  replySystemNannowChat,
} from "@/pages/api/fetch";
import { ChatMessageType, ChatType, GetAdminChatsResponse } from "@/types/Chats";
import ChatMessages from "@/components/Users/DetailedUser/MessagesSection/ChatMessages/ChatMessages";
import paginateStyles from "@/styles/paginate.module.css";
import listStyles from "@/components/AdminChats/adminChats.module.css";
import styles from "./nannowChats.module.css";
import defaultAvatarImg from "@/assets/images/default-avatar.png";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";

const SORT_OPTIONS = [
  { title: "Latest", value: "latest" },
  { title: "Name", value: "name" },
] as const;

type ChatDetailsResponse = {
  id: string;
  user1?: ChatType["user1"];
  user2?: ChatType["user2"];
  messages?: ChatMessageType[];
};

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const isChatUnread = (chat: ChatType) => {
  if (Number(chat.unreadMessagesCount ?? 0) > 0) return true;
  if (!Array.isArray(chat.messages)) return false;
  return chat.messages.some((message) => !message.isRead);
};

const NannowChats = () => {
  const router = useRouter();
  const { lastEvent } = useAdminSocket();
  const [items, setItems] = useState<ChatType[]>([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [selectedChat, setSelectedChat] = useState<ChatDetailsResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedSortOption, setSelectedSortOption] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const adminRoles = useMemo(() => getCurrentAdminRolesFromJwt(), []);
  const canModerate =
    adminRoles.includes("SUPER_ADMIN") || adminRoles.includes("CHAT_MODERATOR");
  const useSuperHistoryRoute = adminRoles.includes("SUPER_ADMIN");

  const selectedSort = SORT_OPTIONS[selectedSortOption]?.value ?? "latest";

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getSystemNannowChats({
        startIndex: itemOffset,
        pageSize,
        sort: selectedSort,
        search: appliedSearch,
      });
      const payload = response.data as
        | GetAdminChatsResponse
        | { result?: GetAdminChatsResponse };
      const data =
        (payload as { result?: GetAdminChatsResponse }).result ??
        (payload as GetAdminChatsResponse);

      const nextItems = Array.isArray(data?.items) ? data.items : [];
      const nextTotal = Number(data?.total ?? nextItems.length);
      const nextPageSize = Number(data?.pageSize ?? pageSize) || pageSize;

      setItems(nextItems);
      setPageSize(nextPageSize);
      setPageCount(Math.max(1, Math.ceil(nextTotal / nextPageSize)));
      setSelectedChatId((prev) => {
        if (prev && nextItems.some((item) => (item.chatId ?? item.id) === prev)) {
          return prev;
        }
        return nextItems[0]?.chatId ?? nextItems[0]?.id ?? "";
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setError("Failed to load Nannow chats.");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, itemOffset, pageSize, router, selectedSort]);

  const fetchSelectedChat = useCallback(async (chatId: string) => {
    const response = await getChatById(chatId);
    const result = (response.data?.result ?? {}) as ChatDetailsResponse;
    setSelectedChat(result);
    setMessages(Array.isArray(result.messages) ? result.messages : []);
  }, []);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!selectedChatId) {
      setSelectedChat(null);
      setMessages([]);
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        setLoadingChat(true);
        const response = await getChatById(selectedChatId);
        const result = (response.data?.result ?? {}) as ChatDetailsResponse;
        if (isCancelled) return;
        setSelectedChat(result);
        setMessages(Array.isArray(result.messages) ? result.messages : []);
      } catch (err) {
        if (!isCancelled) {
          console.log(err);
          setSelectedChat(null);
          setMessages([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingChat(false);
        }
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [selectedChatId]);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "SYSTEM_CHAT_UNREAD_CHANGED") return;

    const { chatId, unreadCount } = lastEvent;
    let found = false;
    setItems((currentItems) =>
      currentItems.map((item) => {
        if ((item.chatId ?? item.id) !== chatId) return item;
        found = true;
        return { ...item, unreadMessagesCount: unreadCount };
      }),
    );

    if (!found) {
      void fetchChats();
    }
  }, [fetchChats, lastEvent]);

  const handlePageClick = (event: { selected: number }) => {
    setItemOffset(event.selected * pageSize);
  };

  const selectedTitle = useMemo(() => {
    if (!selectedChat?.user1 || !selectedChat?.user2) return "Select a chat";
    return `${selectedChat.user1.firstName} ${selectedChat.user1.lastName ?? ""} / ${
      selectedChat.user2.firstName
    } ${selectedChat.user2.lastName ?? ""}`.trim();
  }, [selectedChat]);

  const handleMarkRead = async () => {
    if (!selectedChatId || isMarkingRead) return;
    try {
      setIsMarkingRead(true);
      await markSystemNannowChatRead(selectedChatId);
      setItems((currentItems) =>
        currentItems.map((item) =>
          (item.chatId ?? item.id) === selectedChatId
            ? { ...item, unreadMessagesCount: 0 }
            : item,
        ),
      );
      setMessages((current) =>
        current.map((message) => ({ ...message, isRead: true })),
      );
    } catch (err) {
      console.log(err);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleReply = async () => {
    if (!selectedChatId || isReplying) return;
    const content = replyText.trim();
    if (!content) return;
    try {
      setIsReplying(true);
      await replySystemNannowChat(selectedChatId, content);
      setReplyText("");
      await fetchSelectedChat(selectedChatId);
      setItems((currentItems) =>
        currentItems.map((item) =>
          (item.chatId ?? item.id) === selectedChatId
            ? { ...item, unreadMessagesCount: 0 }
            : item,
        ),
      );
      void fetchChats();
    } catch (err) {
      console.log(err);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className={listStyles.main}>
      <div className={listStyles.headerRow}>
        <div className={listStyles.titleWrap}>
          <h2 className={listStyles.title}>Nannow chats</h2>
          <span className={listStyles.subtitle}>
            {`${items.length} on page, page ${
              pageCount === 0 ? 0 : Math.floor(itemOffset / pageSize) + 1
            }/${pageCount || 1}`}
          </span>
        </div>
        <div className={listStyles.headerActions}>
          <DropDownButton
            options={SORT_OPTIONS.map((option) => ({
              title: option.title,
              value: option.value,
            }))}
            selectedOption={selectedSortOption}
            setSelectedOption={(nextSelectedOption) => {
              setSelectedSortOption(nextSelectedOption as number);
            }}
            onClickOption={() => {
              setItemOffset(0);
            }}
          />
          <SearchBar
            placeholder="Search participant name"
            searchText={searchText}
            setSearchText={setSearchText}
            onButtonClick={() => {
              setItemOffset(0);
              setAppliedSearch(searchText);
            }}
          />
        </div>
      </div>

      {error && <div className={listStyles.error}>{error}</div>}

      <div className={listStyles.layout}>
        <div className={listStyles.chatListPane}>
          <div className={listStyles.paneTitle}>Chat list</div>
          <div className={listStyles.chatList}>
            {loading ? (
              <div className={listStyles.emptyState}>Loading chats...</div>
            ) : items.length > 0 ? (
              items.map((chat) => {
                const chatId = chat.chatId ?? chat.id;
                const lastMessage = Array.isArray(chat.messages)
                  ? chat.messages[chat.messages.length - 1]
                  : null;
                const user1Name = `${chat.user1?.firstName ?? "Deleted"} ${
                  chat.user1?.lastName ?? "User"
                }`.trim();
                const user2Name = `${chat.user2?.firstName ?? "Deleted"} ${
                  chat.user2?.lastName ?? "User"
                }`.trim();
                const unread = isChatUnread(chat);

                return (
                  <button
                    key={chatId}
                    type="button"
                    className={`${listStyles.chatRow} ${
                      selectedChatId === chatId ? listStyles.chatRowActive : ""
                    } ${unread ? listStyles.chatRowUnread : ""}`}
                    onClick={() => setSelectedChatId(chatId)}
                  >
                    {unread && <span className={listStyles.unreadDot} />}
                    <div className={listStyles.chatAvatars}>
                      <img
                        className={listStyles.chatAvatarPrimary}
                        src={chat.user1?.imgUrl || defaultAvatarImg.src}
                        alt={user1Name}
                      />
                      <img
                        className={listStyles.chatAvatarSecondary}
                        src={chat.user2?.imgUrl || defaultAvatarImg.src}
                        alt={user2Name}
                      />
                    </div>
                    <div className={listStyles.chatMeta}>
                      <div className={listStyles.chatNames}>
                        <span>{user1Name}</span>
                        <span className={listStyles.chatDivider}>/</span>
                        <span>{user2Name}</span>
                      </div>
                      <div className={listStyles.chatPreview}>
                        {lastMessage?.content?.trim() ||
                          (lastMessage?.imageUrl ? "Image" : "No messages yet")}
                      </div>
                    </div>
                    <div className={listStyles.chatDate}>
                      {formatDateTime(chat.lastMessageCreatedAt)}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className={listStyles.emptyState}>No chats found</div>
            )}
          </div>
        </div>

        <div className={listStyles.messagesPane}>
          <div className={listStyles.paneTitle}>{selectedTitle}</div>
          {selectedChatId && (
            <div className={styles.controls}>
              <textarea
                className={styles.replyInput}
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Reply as SYSTEM_NANNOW"
              />
              <div className={styles.controlsActions}>
                <Button
                  title={isMarkingRead ? "Marking..." : "Mark read"}
                  type="OUTLINED"
                  onClick={handleMarkRead}
                  isDisabled={isMarkingRead || isReplying}
                  isLoading={isMarkingRead}
                />
                <Button
                  title={isReplying ? "Sending..." : "Reply"}
                  type="BLACK"
                  onClick={handleReply}
                  isDisabled={isReplying || isMarkingRead || replyText.trim().length === 0}
                  isLoading={isReplying}
                />
              </div>
            </div>
          )}
          {loadingChat ? (
            <div className={listStyles.emptyState}>Loading messages...</div>
          ) : messages.length > 0 && selectedChat?.user1 && selectedChat?.user2 ? (
            <ChatMessages
              messages={messages}
              userId={selectedChat.user1.id}
              userImgUrl={selectedChat.user1.imgUrl ?? ""}
              otherUserImgUrl={selectedChat.user2.imgUrl ?? ""}
              canModerate={canModerate}
              useSuperHistoryRoute={useSuperHistoryRoute}
            />
          ) : (
            <div className={listStyles.emptyState}>
              {selectedChatId ? "No messages yet" : "Select a chat"}
            </div>
          )}
        </div>
      </div>

      <ReactPaginate
        breakLabel="..."
        nextLabel=""
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel=""
        renderOnZeroPageCount={null}
        containerClassName={paginateStyles.paginateWrapper}
        pageClassName={paginateStyles.pageBtn}
        pageLinkClassName={paginateStyles.pageLink}
        activeClassName={paginateStyles.activePage}
        nextClassName={paginateStyles.nextPageBtn}
        nextLinkClassName={paginateStyles.nextLink}
        previousClassName={paginateStyles.prevPageBtn}
        previousLinkClassName={paginateStyles.prevLink}
        breakClassName={paginateStyles.break}
      />
    </div>
  );
};

export default NannowChats;
