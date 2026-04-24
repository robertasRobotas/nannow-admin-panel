import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import { useRouter } from "next/router";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import SearchBar from "@/components/SearchBar/SearchBar";
import { getAdminChats, getChatById, getCurrentAdminRolesFromJwt } from "@/pages/api/fetch";
import { ChatMessageType, ChatType, GetAdminChatsResponse } from "@/types/Chats";
import ChatMessages from "@/components/Users/DetailedUser/MessagesSection/ChatMessages/ChatMessages";
import paginateStyles from "@/styles/paginate.module.css";
import styles from "./adminChats.module.css";
import defaultAvatarImg from "@/assets/images/default-avatar.png";

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

const AdminChats = () => {
  const router = useRouter();
  const routerRef = useRef(router);
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
  const currentSort = SORT_OPTIONS[selectedSortOption]?.value ?? "latest";

  const updateChatsQuery = useCallback(
    (
      params: { page?: number; sort?: string; q?: string; id?: string },
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

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminChats({
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
        routerRef.current.push("/");
        return;
      }
      setError("Failed to load chats.");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, itemOffset, pageSize, selectedSort]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

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
  ]);

  useEffect(() => {
    if (!selectedChatId) {
      setSelectedChat(null);
      setMessages([]);
      return;
    }

    let isCancelled = false;

    const fetchSelectedChat = async () => {
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

    fetchSelectedChat();

    return () => {
      isCancelled = true;
    };
  }, [selectedChatId]);

  const handlePageClick = (event: { selected: number }) => {
    updateChatsQuery({
      page: event.selected + 1,
      sort: selectedSort,
      q: appliedSearch,
      id: selectedChatId,
    });
  };

  const selectedTitle = useMemo(() => {
    if (!selectedChat?.user1 || !selectedChat?.user2) return "Select a chat";
    return `${selectedChat.user1.firstName} ${selectedChat.user1.lastName ?? ""} / ${
      selectedChat.user2.firstName
    } ${selectedChat.user2.lastName ?? ""}`.trim();
  }, [selectedChat]);

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h2 className={styles.title}>Chats</h2>
          <span className={styles.subtitle}>
            {`${items.length} on page, page ${
              pageCount === 0 ? 0 : Math.floor(itemOffset / pageSize) + 1
            }/${pageCount || 1}`}
          </span>
        </div>
        <div className={styles.headerActions}>
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
              updateChatsQuery({
                page: 1,
                sort: nextSort,
                q: appliedSearch,
                id: selectedChatId,
              });
            }}
            onClickOption={() => {
              updateChatsQuery({
                page: 1,
                sort: selectedSort,
                q: appliedSearch,
                id: selectedChatId,
              });
            }}
          />
          <SearchBar
            placeholder="Search participant name"
            searchText={searchText}
            setSearchText={setSearchText}
            onButtonClick={() => {
              setAppliedSearch(searchText);
              updateChatsQuery({
                page: 1,
                sort: selectedSort,
                q: searchText,
                id: selectedChatId,
              });
            }}
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.layout}>
        <div className={styles.chatListPane}>
          <div className={styles.paneTitle}>Chat list</div>
          <div className={styles.chatList}>
            {loading ? (
              <div className={styles.emptyState}>Loading chats...</div>
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
                    className={`${styles.chatRow} ${
                      selectedChatId === chatId ? styles.chatRowActive : ""
                    } ${unread ? styles.chatRowUnread : ""}`}
                    onClick={() => {
                      setSelectedChatId(chatId);
                      updateChatsQuery({
                        page:
                          pageCount === 0 ? 1 : Math.floor(itemOffset / pageSize) + 1,
                        sort: selectedSort,
                        q: appliedSearch,
                        id: chatId,
                      });
                    }}
                  >
                    {unread && <span className={styles.unreadDot} />}
                    <div className={styles.chatAvatars}>
                      <img
                        className={styles.chatAvatarPrimary}
                        src={chat.user1?.imgUrl || defaultAvatarImg.src}
                        alt={user1Name}
                      />
                      <img
                        className={styles.chatAvatarSecondary}
                        src={chat.user2?.imgUrl || defaultAvatarImg.src}
                        alt={user2Name}
                      />
                    </div>
                    <div className={styles.chatMeta}>
                      <div className={styles.chatNames}>
                        <span>{user1Name}</span>
                        <span className={styles.chatDivider}>/</span>
                        <span>{user2Name}</span>
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
              <div className={styles.emptyState}>No chats found</div>
            )}
          </div>
        </div>

        <div className={styles.messagesPane}>
          <div className={styles.paneTitle}>{selectedTitle}</div>
          {loadingChat ? (
            <div className={styles.emptyState}>Loading messages...</div>
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
            <div className={styles.emptyState}>
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

export default AdminChats;
