import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  getSystemNannowChatsUnreadCount,
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

const SYSTEM_NANNOW_ID = "SYSTEM_NANNOW";

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
  if (!Array.isArray(chat.messages)) {
    return Number(chat.unreadMessagesCount ?? 0) > 0;
  }
  return chat.messages.some(
    (message) =>
      message.senderId !== SYSTEM_NANNOW_ID &&
      message.receiverId === SYSTEM_NANNOW_ID &&
      !message.isRead,
  );
};

const getChatReadAt = (
  chat: ChatType,
  lastMessage?: ChatMessageType | null,
) => lastMessage?.readAt ?? chat.lastMessageReadAt ?? null;

const parseChatsResponse = (
  response: unknown,
): { items: ChatType[]; total: number; pageSize: number } => {
  const payload = response as
    | GetAdminChatsResponse
    | { result?: GetAdminChatsResponse };
  const data =
    (payload as { result?: GetAdminChatsResponse }).result ?? (payload as GetAdminChatsResponse);
  const items = Array.isArray(data?.items) ? data.items : [];
  const total = Number(data?.total ?? items.length);
  const pageSize = Number(data?.pageSize ?? items.length ?? 20) || 20;

  return { items, total, pageSize };
};

const NannowChats = () => {
  const router = useRouter();
  const routerRef = useRef(router);
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
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const unreadChatsCountRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const currentSort = SORT_OPTIONS[selectedSortOption]?.value ?? "latest";

  const updateNannowChatsQuery = useCallback(
    (
      params: {
        page?: number;
        sort?: string;
        q?: string;
        id?: string;
        unread?: boolean;
      },
      method: "push" | "replace" = "push",
    ) => {
      if (!router.isReady) return;
      const nextQuery = { ...router.query };
      if (typeof params.page === "number" && params.page > 0) {
        nextQuery.page = String(params.page);
      }
      if (params.sort && params.sort !== "latest") {
        nextQuery.sort = params.sort;
      } else if (params.sort !== undefined) {
        delete nextQuery.sort;
      }
      if (typeof params.q === "string" && params.q.trim().length > 0) {
        nextQuery.q = params.q.trim();
      } else if (params.q !== undefined) {
        delete nextQuery.q;
      }
      if (typeof params.id === "string" && params.id.length > 0) {
        nextQuery.id = params.id;
      } else if (params.id !== undefined) {
        delete nextQuery.id;
      }
      if (typeof params.unread === "boolean") {
        if (params.unread) {
          nextQuery.unread = "1";
        } else {
          delete nextQuery.unread;
        }
      } else if (params.unread !== undefined) {
        delete nextQuery.unread;
      }
      router[method](
        { pathname: router.pathname, query: nextQuery },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  const adminRoles = useMemo(() => getCurrentAdminRolesFromJwt(), []);
  const canModerate =
    adminRoles.includes("SUPER_ADMIN") || adminRoles.includes("CHAT_MODERATOR");
  const useSuperHistoryRoute = adminRoles.includes("SUPER_ADMIN");

  const selectedSort = currentSort;

  const refreshUnreadChatsCount = useCallback(async () => {
    try {
      const response = await getSystemNannowChatsUnreadCount();
      const count =
        response.data?.count ??
        response.data?.result?.count ??
        response.data?.unreadCount ??
        0;
      const nextCount = Number(count) || 0;
      unreadChatsCountRef.current = nextCount;
      setUnreadChatsCount(nextCount);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const loadUnreadChatsFallback = useCallback(async () => {
    const collected: ChatType[] = [];
    let startIndex = 0;
    let total = Number.MAX_SAFE_INTEGER;
    const requestedPageSize = 200;
    let resolvedPageSize = pageSize;
    const unreadTotal = unreadChatsCountRef.current;
    const targetCount =
      unreadTotal > 0
        ? Math.min(itemOffset + pageSize, unreadTotal)
        : itemOffset + pageSize;

    while (startIndex < total) {
      const response = await getSystemNannowChats({
        startIndex,
        pageSize: requestedPageSize,
        sort: selectedSort,
        search: appliedSearch,
      });
      const { items: nextItems, total: nextTotal, pageSize: nextPageSize } =
        parseChatsResponse(response.data);
      resolvedPageSize = nextPageSize;
      total =
        Number.isFinite(nextTotal) && nextTotal > 0
          ? nextTotal
          : collected.length + nextItems.length;
      collected.push(...nextItems.filter(isChatUnread));
      if (collected.length >= targetCount) break;
      if (nextItems.length === 0 || nextPageSize <= 0) break;
      startIndex += nextPageSize;
    }

    const nextItems = collected.slice(itemOffset, itemOffset + resolvedPageSize);
    setItems(nextItems);
    setPageSize(resolvedPageSize);
    setPageCount(
      Math.max(
        1,
        Math.ceil(
          ((unreadChatsCountRef.current || collected.length) as number) /
            resolvedPageSize,
        ),
      ),
    );
    setSelectedChatId((prev) => {
      if (prev && nextItems.some((item) => (item.chatId ?? item.id) === prev)) {
        return prev;
      }
      return nextItems[0]?.chatId ?? nextItems[0]?.id ?? "";
    });
  }, [appliedSearch, itemOffset, pageSize, selectedSort]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (showUnreadOnly) {
        await loadUnreadChatsFallback();
        return;
      }

      const response = await getSystemNannowChats({
        startIndex: itemOffset,
        pageSize,
        sort: selectedSort,
        search: appliedSearch,
      });
      const { items: nextItems, total: nextTotal, pageSize: nextPageSize } =
        parseChatsResponse(response.data);

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
        routerRef.current.push("/");
        return;
      }
      setError("Failed to load Nannow chats.");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, itemOffset, loadUnreadChatsFallback, pageSize, selectedSort, showUnreadOnly]);

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
    void refreshUnreadChatsCount();
  }, [refreshUnreadChatsCount]);

  useEffect(() => {
    if (!router.isReady) return;
    const sortFromQuery =
      typeof router.query.sort === "string" ? router.query.sort : "latest";
    const sortIndex = SORT_OPTIONS.findIndex((option) => option.value === sortFromQuery);
    setSelectedSortOption(sortIndex >= 0 ? sortIndex : 0);

    const qFromQuery = typeof router.query.q === "string" ? router.query.q : "";
    setSearchText(qFromQuery);
    setAppliedSearch(qFromQuery);
    const idFromQuery = typeof router.query.id === "string" ? router.query.id : "";
    if (idFromQuery) {
      setSelectedChatId(idFromQuery);
    }
    const unreadFromQuery =
      typeof router.query.unread === "string" ? router.query.unread : "";
    setShowUnreadOnly(unreadFromQuery === "1" || unreadFromQuery === "true");

    const pageFromQuery =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const safePage =
      Number.isFinite(pageFromQuery) && pageFromQuery > 0
        ? Math.floor(pageFromQuery)
        : 1;
    setItemOffset((safePage - 1) * pageSize);
  }, [
    pageSize,
    router.isReady,
    router.query.page,
    router.query.q,
    router.query.sort,
    router.query.id,
    router.query.unread,
  ]);

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

    void refreshUnreadChatsCount();
    void fetchChats();
  }, [fetchChats, lastEvent, refreshUnreadChatsCount, showUnreadOnly]);

  const handlePageClick = (event: { selected: number }) => {
    updateNannowChatsQuery({
      page: event.selected + 1,
      sort: selectedSort,
      q: appliedSearch,
      id: selectedChatId,
      unread: showUnreadOnly,
    });
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
      void refreshUnreadChatsCount();
      if (showUnreadOnly) {
        await fetchChats();
      }
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
      void refreshUnreadChatsCount();
      if (showUnreadOnly) {
        await fetchChats();
        return;
      }
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
              const nextIndex = nextSelectedOption as number;
              setSelectedSortOption(nextIndex);
              const nextSort = SORT_OPTIONS[nextIndex]?.value ?? "latest";
              updateNannowChatsQuery({
                page: 1,
                sort: nextSort,
                q: appliedSearch,
                id: selectedChatId,
                unread: showUnreadOnly,
              });
            }}
            onClickOption={() => {
              updateNannowChatsQuery({
                page: 1,
                sort: selectedSort,
                q: appliedSearch,
                id: selectedChatId,
                unread: showUnreadOnly,
              });
            }}
          />
          <Button
            title="Unread only"
            type="OUTLINED"
            className={
              showUnreadOnly
                ? "!border-neutral-900 !bg-neutral-900 !text-white hover:!bg-neutral-800"
                : "!border-neutral-200 !bg-white !text-neutral-900 hover:!bg-neutral-50"
            }
            attentionNumber={unreadChatsCount}
            onClick={() => {
              const nextUnreadOnly = !showUnreadOnly;
              setShowUnreadOnly(nextUnreadOnly);
              updateNannowChatsQuery({
                page: 1,
                sort: selectedSort,
                q: appliedSearch,
                id: selectedChatId,
                unread: nextUnreadOnly,
              });
            }}
          />
          <SearchBar
            placeholder="Search participant name"
            searchText={searchText}
            setSearchText={setSearchText}
            onButtonClick={() => {
              setAppliedSearch(searchText);
              updateNannowChatsQuery({
                page: 1,
                sort: selectedSort,
                q: searchText,
                id: selectedChatId,
                unread: showUnreadOnly,
              });
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
                const readAt = getChatReadAt(chat, lastMessage);

                return (
                  <button
                    key={chatId}
                    type="button"
                    className={`${listStyles.chatRow} ${
                      selectedChatId === chatId ? listStyles.chatRowActive : ""
                    } ${unread ? listStyles.chatRowUnread : ""}`}
                    onClick={() => {
                      setSelectedChatId(chatId);
                        updateNannowChatsQuery({
                          page:
                            pageCount === 0 ? 1 : Math.floor(itemOffset / pageSize) + 1,
                          sort: selectedSort,
                          q: appliedSearch,
                          id: chatId,
                          unread: showUnreadOnly,
                        });
                      }}
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
                      <span>{formatDateTime(chat.lastMessageCreatedAt)}</span>
                      {readAt && (
                        <span className={listStyles.chatReadAt}>
                          Read: {formatDateTime(readAt)}
                        </span>
                      )}
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
              userId={selectedChat.user2.id}
              userImgUrl={selectedChat.user2.imgUrl ?? ""}
              otherUserImgUrl={selectedChat.user1.imgUrl ?? ""}
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
        forcePage={pageCount === 0 ? 0 : Math.floor(itemOffset / pageSize)}
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
