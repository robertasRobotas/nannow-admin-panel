import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import { useRouter } from "next/router";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import paginateStyles from "@/styles/paginate.module.css";
import styles from "./adminMessages.module.css";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import {
  getAdminMessages,
  getUnreadAdminMessagesCount,
  markAdminMessageRead,
  markAllAdminMessagesRead,
} from "@/pages/api/fetch";
import { AdminMessage, GetAdminMessagesResponse } from "@/types/AdminMessage";

const PAGE_SIZE = 20;

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

const dispatchUnreadCountUpdate = (count: number) => {
  window.dispatchEvent(
    new CustomEvent("admin-messages-count-update", {
      detail: { count: Math.max(count, 0) },
    }),
  );
};

const AdminMessages = () => {
  const router = useRouter();
  const { lastEvent } = useAdminSocket();
  const [items, setItems] = useState<AdminMessage[]>([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isReadAllLoading, setIsReadAllLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const fetchUnreadCount = useCallback(async () => {
    const response = await getUnreadAdminMessagesCount();
    const count = Number(response.data?.count ?? 0) || 0;
    setUnreadCount(count);
    dispatchUnreadCountUpdate(count);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminMessages({
        startIndex: itemOffset,
        pageSize: PAGE_SIZE,
      });
      const payload = response.data as
        | GetAdminMessagesResponse
        | { result?: GetAdminMessagesResponse };
      const data =
        (payload as { result?: GetAdminMessagesResponse }).result ??
        (payload as GetAdminMessagesResponse);

      const nextItems = Array.isArray(data?.items) ? data.items : [];
      const nextTotal = Number(data?.total ?? nextItems.length);
      const nextPageSize = Number(data?.pageSize ?? PAGE_SIZE) || PAGE_SIZE;

      setItems(nextItems);
      setTotal(nextTotal);
      setPageCount(Math.max(1, Math.ceil(nextTotal / nextPageSize)));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [itemOffset, router]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchUnreadCount().catch(() => {
      setUnreadCount(0);
    });
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "ADMIN_MESSAGE") return;

    const nextMessage: AdminMessage = {
      id: lastEvent.id,
      text: lastEvent.text,
      senderAdminId: lastEvent.senderAdminId,
      senderName: lastEvent.senderName,
      createdAt: lastEvent.createdAt,
      isRead: false,
      readAt: null,
    };

    setTotal((prev) => {
      const next = prev + 1;
      setPageCount(Math.max(1, Math.ceil(next / PAGE_SIZE)));
      return next;
    });

    if (itemOffset !== 0) {
      return;
    }

    setItems((prev) => {
      if (prev.some((item) => item.id === nextMessage.id)) {
        return prev;
      }
      return [nextMessage, ...prev].slice(0, PAGE_SIZE);
    });
  }, [itemOffset, lastEvent]);

  const handlePageClick = (event: { selected: number }) => {
    setItemOffset(event.selected * PAGE_SIZE);
  };

  const unreadInCurrentPage = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items],
  );

  const handleMarkRead = async (messageId: string) => {
    if (updatingId) return;
    try {
      setUpdatingId(messageId);
      await markAdminMessageRead(messageId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === messageId
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setUnreadCount((prev) => {
        const next = Math.max(prev - 1, 0);
        dispatchUnreadCountUpdate(next);
        return next;
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setError("Failed to update message status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleReadAll = async () => {
    if (isReadAllLoading || unreadCount === 0) return;
    try {
      setIsReadAllLoading(true);
      await markAllAdminMessagesRead();
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      dispatchUnreadCountUpdate(0);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setError("Failed to mark all messages as read.");
    } finally {
      setIsReadAllLoading(false);
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <h2 className={`${styles.title} ${nunito.className}`}>Messages</h2>
        <Button
          title={isReadAllLoading ? "Updating..." : "Read all"}
          type="OUTLINED"
          onClick={handleReadAll}
          isDisabled={isReadAllLoading || unreadCount === 0}
          isLoading={isReadAllLoading}
        />
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>Total: {total}</div>
        <div className={styles.summaryItem}>Unread: {unreadCount}</div>
        <div className={styles.summaryItem}>
          Unread on this page: {unreadInCurrentPage}
        </div>
      </div>

      <div className={styles.list}>
        {loading && <div className={styles.empty}>Loading...</div>}
        {!loading && error && <div className={styles.empty}>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className={styles.empty}>No messages found</div>
        )}

        {!loading &&
          !error &&
          items.map((message) => (
            <div
              key={message.id}
              className={`${styles.row} ${
                message.isRead ? "" : styles.rowUnread
              }`}
            >
              <div className={styles.left}>
                <div className={styles.messageText}>{message.text}</div>
                <div className={styles.meta}>
                  Sender: {message.senderName || "Unknown admin"}
                </div>
                <div className={styles.meta}>
                  Sent: {formatDateTime(message.createdAt)}
                </div>
              </div>

              <div className={styles.right}>
                <div
                  className={`${styles.status} ${
                    message.isRead ? styles.statusRead : styles.statusUnread
                  }`}
                >
                  {message.isRead ? "Read" : "Unread"}
                </div>
                <div className={styles.meta}>
                  Read at: {formatDateTime(message.readAt)}
                </div>
                {!message.isRead && (
                  <Button
                    title={updatingId === message.id ? "Updating..." : "Mark read"}
                    type="OUTLINED"
                    onClick={() => handleMarkRead(message.id)}
                    isDisabled={updatingId.length > 0}
                    isLoading={updatingId === message.id}
                  />
                )}
              </div>
            </div>
          ))}
      </div>

      <ReactPaginate
        breakLabel="..."
        nextLabel=""
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel=""
        renderOnZeroPageCount={null}
        forcePage={Math.floor(itemOffset / PAGE_SIZE)}
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

export default AdminMessages;
