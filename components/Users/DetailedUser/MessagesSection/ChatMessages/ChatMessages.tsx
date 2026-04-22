import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import {
  deleteChatMessageByAdmin,
  deleteChatMessageImageByAdmin,
  getChatMessageHistoryByAdmin,
  updateChatMessageByAdmin,
} from "@/pages/api/fetch";
import {
  ChatMessageHistoryEntry,
  ChatMessageHistorySnapshot,
  ChatMessageType,
} from "@/types/Chats";
import profileInfoStyles from "@/components/Users/ProfileInfo/profileInfo.module.css";
import styles from "./chatMessages.module.css";
import avatarImg from "../../../../../assets/images/default-avatar.png";

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

type ChatMessagesProps = {
  messages: ChatMessageType[];
  userId: string;
  userImgUrl: string;
  otherUserImgUrl: string;
  canModerate?: boolean;
  useSuperHistoryRoute?: boolean;
};

type ChatMessageHistoryResponse = {
  message: ChatMessageType | null;
  history: ChatMessageHistoryEntry[];
};

const getMessageFlag = (message: ChatMessageType) => {
  if (message.isDeleted) return "Deleted by admin";
  if (message.isModerated && message.lastEditedByAdminName) {
    return `Edited by ${message.lastEditedByAdminName}`;
  }
  if (message.isModerated) return "Edited by admin";
  if (message.isEdited) return "Edited";
  return "";
};

const getSnapshotText = (snapshot?: ChatMessageHistorySnapshot | null) => {
  if (!snapshot) return "—";
  if (snapshot.isDeleted) return "Message deleted by admin";
  return snapshot.content?.trim() || "—";
};

const getSnapshotImageUrl = (snapshot?: ChatMessageHistorySnapshot | null) =>
  snapshot?.imageUrl?.trim() || "";

const isCurrentStateSameAsSnapshot = (
  snapshot: ChatMessageHistorySnapshot | null | undefined,
  message: ChatMessageType | null,
) => {
  if (!snapshot) return false;

  const currentContent = message?.content?.trim() || "";
  const currentImageUrl = message?.imageUrl?.trim() || "";
  const currentIsDeleted = Boolean(message?.isDeleted);

  return (
    (snapshot.content?.trim() || "") === currentContent &&
    (snapshot.imageUrl?.trim() || "") === currentImageUrl &&
    Boolean(snapshot.isDeleted) === currentIsDeleted
  );
};

const getHistoryActionLabel = (entry: ChatMessageHistoryEntry) => {
  const actor = entry.adminName?.trim() || "admin";

  switch (entry.action) {
    case "UPDATE_MESSAGE":
      return `Edited by ${actor}`;
    case "DELETE_IMAGE":
      return `Image removed by ${actor}`;
    case "DELETE_MESSAGE":
      return `Deleted by ${actor}`;
    default:
      return `${entry.action.replace(/_/g, " ").toLowerCase()} by ${actor}`;
  }
};

const hasMessageHistory = (message: ChatMessageType) =>
  Boolean(
    message.isEdited ||
      message.isDeleted ||
      message.isModerated ||
      message.editedAt ||
      message.lastEditedByAdminId ||
      message.lastEditedByAdminName,
  );

const ChatMessages = ({
  messages,
  userId,
  userImgUrl,
  otherUserImgUrl,
  canModerate = false,
  useSuperHistoryRoute = false,
}: ChatMessagesProps) => {
  const [displayMessages, setDisplayMessages] = useState<ChatMessageType[]>(messages);
  const [openedImageUrl, setOpenedImageUrl] = useState("");
  const [imageZoom, setImageZoom] = useState(1);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessageType | null>(null);
  const [messageToRemoveImage, setMessageToRemoveImage] =
    useState<ChatMessageType | null>(null);
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editError, setEditError] = useState("");
  const [loadingActionKey, setLoadingActionKey] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyState, setHistoryState] = useState<ChatMessageHistoryResponse>({
    message: null,
    history: [],
  });
  const [historyError, setHistoryError] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    setDisplayMessages(messages);
  }, [messages]);

  const closeImageModal = () => {
    setOpenedImageUrl("");
    setImageZoom(1);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setHistoryState({ message: null, history: [] });
    setHistoryError("");
  };

  const closeDeleteModal = () => {
    if (loadingActionKey.startsWith("delete-")) return;
    setMessageToDelete(null);
  };

  const closeRemoveImageModal = () => {
    if (loadingActionKey.startsWith("image-")) return;
    setMessageToRemoveImage(null);
  };

  useEffect(() => {
    if (!openedImageUrl && !isHistoryModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (openedImageUrl) {
          closeImageModal();
          return;
        }
        closeHistoryModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHistoryModalOpen, openedImageUrl]);

  const syncMessage = (
    messageId: string,
    updater: (message: ChatMessageType) => ChatMessageType,
  ) => {
    setDisplayMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    );
  };

  const startEditing = (message: ChatMessageType) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content ?? "");
    setEditError("");
  };

  const cancelEditing = () => {
    setEditingMessageId("");
    setEditedContent("");
    setEditError("");
  };

  const saveMessageEdit = async (message: ChatMessageType) => {
    const trimmedContent = editedContent.trim();
    if (!trimmedContent) {
      setEditError("Message text is required.");
      return;
    }

    try {
      setLoadingActionKey(`edit-${message.id}`);
      const response = await updateChatMessageByAdmin(message.id, {
        content: trimmedContent,
      });
      const nextMessage =
        response.data?.result?.message ??
        response.data?.result?.item ??
        response.data?.message ??
        response.data?.item ??
        null;

      syncMessage(message.id, (current) => ({
        ...current,
        ...(nextMessage && typeof nextMessage === "object" ? nextMessage : {}),
        content: trimmedContent,
        isEdited: true,
        isModerated: true,
      }));
      toast.success("Message updated");
      cancelEditing();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update message");
    } finally {
      setLoadingActionKey("");
    }
  };

  const removeMessageImage = async () => {
    if (!messageToRemoveImage) return;

    try {
      setLoadingActionKey(`image-${messageToRemoveImage.id}`);
      await deleteChatMessageImageByAdmin(messageToRemoveImage.id);
      syncMessage(messageToRemoveImage.id, (current) => ({
        ...current,
        imageUrl: null,
        isEdited: true,
        isModerated: true,
      }));
      toast.success("Message image removed");
      setMessageToRemoveImage(null);
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove message image");
    } finally {
      setLoadingActionKey("");
    }
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      setLoadingActionKey(`delete-${messageToDelete.id}`);
      await deleteChatMessageByAdmin(messageToDelete.id);
      syncMessage(messageToDelete.id, (current) => ({
        ...current,
        content: "Message deleted by admin",
        imageUrl: null,
        isEdited: true,
        isModerated: true,
        isDeleted: true,
      }));
      toast.success("Message deleted");
      setMessageToDelete(null);
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete message");
    } finally {
      setLoadingActionKey("");
    }
  };

  const openHistory = async (messageId: string) => {
    try {
      setIsHistoryModalOpen(true);
      setIsHistoryLoading(true);
      setHistoryError("");
      const response = await getChatMessageHistoryByAdmin(
        messageId,
        useSuperHistoryRoute,
      );
      setHistoryState({
        message: response.data?.result?.message ?? null,
        history: Array.isArray(response.data?.result?.history)
          ? response.data.result.history
          : [],
      });
    } catch (error) {
      console.log(error);
      setHistoryError("Failed to load message history");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const historyEntries = useMemo(() => historyState.history ?? [], [historyState.history]);
  const historyEntriesWithoutCurrentState = useMemo(() => {
    if (historyEntries.length === 0) return [];

    const latestEntry = historyEntries[historyEntries.length - 1];
    const latestAfter = latestEntry?.after ?? null;

    if (
      isCurrentStateSameAsSnapshot(latestAfter, historyState.message) ||
      (!historyState.message && latestAfter?.isDeleted)
    ) {
      return historyEntries.slice(0, -1);
    }

    return historyEntries;
  }, [historyEntries, historyState.message]);
  const reversedHistoryEntries = useMemo(
    () => [...historyEntriesWithoutCurrentState].reverse(),
    [historyEntriesWithoutCurrentState],
  );
  const originalSnapshot = historyEntries[0]?.before ?? null;
  const latestHistoryEntry =
    historyEntries.length > 0 ? historyEntries[historyEntries.length - 1] : null;
  const currentStateTimestamp =
    historyState.message?.editedAt ??
    historyState.message?.createdAt ??
    latestHistoryEntry?.createdAt ??
    "";
  const currentStateLabel = historyState.message
    ? getMessageFlag(historyState.message)
    : latestHistoryEntry
      ? getHistoryActionLabel(latestHistoryEntry)
      : "Deleted by admin";

  return (
    <>
      <div className={styles.main}>
        {displayMessages.map((message) => {
          const isFromUser = message.senderId === userId;
          const visibleContent = message.isDeleted
            ? "Message deleted by admin"
            : message.content ?? "";
          const hasText = String(visibleContent).trim().length > 0;
          const hasImage = String(message.imageUrl ?? "").trim().length > 0;
          const messageFlag = getMessageFlag(message);
          const isEditing = editingMessageId === message.id;
          const canShowHistory = hasMessageHistory(message);

          return (
            <div
              key={message.id}
              className={`${styles.messageWrapper} ${
                isFromUser ? styles.alignRight : styles.alignLeft
              }`}
            >
              {!isFromUser && (
                <img
                  className={styles.profileImg}
                  src={otherUserImgUrl.length > 0 ? otherUserImgUrl : avatarImg.src}
                />
              )}
              <div
                className={`${styles.chatBubble} ${
                  isFromUser ? styles.sent : styles.received
                } ${message.isDeleted ? styles.deletedBubble : ""}`}
              >
                {!message.isRead && <span className={styles.messageUnreadDot} />}
                {isEditing ? (
                  <div className={styles.editComposer}>
                    <textarea
                      className={styles.editTextarea}
                      rows={3}
                      value={editedContent}
                      onChange={(event) => {
                        setEditedContent(event.target.value);
                        setEditError("");
                      }}
                    />
                    {editError && <span className={styles.messageFlagError}>{editError}</span>}
                    <div className={styles.messageActions}>
                      <button
                        type="button"
                        className={styles.messageActionBtn}
                        onClick={cancelEditing}
                        disabled={loadingActionKey === `edit-${message.id}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.messageActionBtn}
                        onClick={() => saveMessageEdit(message)}
                        disabled={loadingActionKey === `edit-${message.id}`}
                      >
                        {loadingActionKey === `edit-${message.id}` ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {hasText && <span>{visibleContent}</span>}
                    {hasImage && (
                      <button
                        type="button"
                        className={styles.messageImageButton}
                        onClick={() => {
                          setImageZoom(1);
                          setOpenedImageUrl(message.imageUrl ?? "");
                        }}
                      >
                        <img
                          className={styles.messageImage}
                          src={message.imageUrl ?? ""}
                          alt="Chat image"
                        />
                      </button>
                    )}
                    <div className={styles.messageMetaRow}>
                      <span className={styles.messageTimestamp}>
                        {formatDateTime(message.createdAt)}
                      </span>
                      {message.readAt && (
                        <span className={styles.messageReadAt}>
                          Read: {formatDateTime(message.readAt)}
                        </span>
                      )}
                      {messageFlag && (
                        <span
                          className={`${styles.messageFlag} ${
                            message.isDeleted ? styles.messageFlagDeleted : ""
                          }`}
                        >
                          {messageFlag}
                        </span>
                      )}
                    </div>
                    {canModerate && (
                      <div className={styles.messageActions}>
                        {!message.isDeleted && (
                          <button
                            type="button"
                            className={styles.messageActionBtn}
                            onClick={() => startEditing(message)}
                          >
                            Edit
                          </button>
                        )}
                        {!message.isDeleted && hasImage && (
                          <button
                            type="button"
                            className={styles.messageActionBtn}
                            onClick={() => setMessageToRemoveImage(message)}
                            disabled={loadingActionKey === `image-${message.id}`}
                          >
                            {loadingActionKey === `image-${message.id}`
                              ? "Removing..."
                              : "Remove image"}
                          </button>
                        )}
                        {canShowHistory && (
                          <button
                            type="button"
                            className={styles.messageActionBtn}
                            onClick={() => openHistory(message.id)}
                          >
                            History
                          </button>
                        )}
                        {!message.isDeleted && (
                          <button
                            type="button"
                            className={`${styles.messageActionBtn} ${styles.messageActionDelete}`}
                            onClick={() => setMessageToDelete(message)}
                            disabled={loadingActionKey === `delete-${message.id}`}
                          >
                            {loadingActionKey === `delete-${message.id}`
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {isFromUser && (
                <img
                  className={styles.profileImg}
                  src={userImgUrl.length > 0 ? userImgUrl : avatarImg.src}
                />
              )}
            </div>
          );
        })}
      </div>
      {openedImageUrl && (
        <div
          className={profileInfoStyles.imageModalOverlay}
          onClick={closeImageModal}
        >
          <div
            className={profileInfoStyles.imageModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={profileInfoStyles.imageModalActions}>
              <button
                type="button"
                className={profileInfoStyles.imageModalButton}
                onClick={() =>
                  setImageZoom((current) => Math.max(1, current - 0.25))
                }
              >
                -
              </button>
              <button
                type="button"
                className={profileInfoStyles.imageModalButton}
                onClick={() =>
                  setImageZoom((current) => Math.min(3, current + 0.25))
                }
              >
                +
              </button>
              <button
                type="button"
                className={profileInfoStyles.imageModalButton}
                onClick={() => setImageZoom(1)}
              >
                Reset
              </button>
              <button
                type="button"
                className={profileInfoStyles.imageModalButton}
                onClick={closeImageModal}
              >
                Close
              </button>
            </div>
            <div className={profileInfoStyles.imageViewport}>
              <img
                className={profileInfoStyles.modalImage}
                src={openedImageUrl}
                alt="Chat image"
                style={{ transform: `scale(${imageZoom})` }}
              />
            </div>
          </div>
        </div>
      )}
      {isHistoryModalOpen && (
        <div
          className={profileInfoStyles.imageModalOverlay}
          onClick={closeHistoryModal}
        >
          <div
            className={profileInfoStyles.imageModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={profileInfoStyles.imageModalActions}>
              <button
                type="button"
                className={profileInfoStyles.imageModalButton}
                onClick={closeHistoryModal}
              >
                Close
              </button>
            </div>
            <div className={styles.historyModalContent}>
              <div className={styles.historyCurrentState}>
                <div className={styles.historyCurrentTitle}>Current state</div>
                <div className={styles.historyCurrentBody}>
                  {historyState.message ? (
                    <>
                      <div className={styles.historyContent}>
                        {historyState.message.isDeleted
                          ? "Message deleted by admin"
                          : historyState.message.content || "—"}
                      </div>
                      {historyState.message.imageUrl && (
                        <button
                          type="button"
                          className={styles.messageImageButton}
                          onClick={() => {
                            setImageZoom(1);
                            setOpenedImageUrl(historyState.message?.imageUrl ?? "");
                          }}
                        >
                          <img
                            className={styles.messageImage}
                            src={historyState.message.imageUrl}
                            alt="Current chat image"
                          />
                        </button>
                      )}
                      <div className={styles.historyFlagRow}>
                        <span>{formatDateTime(currentStateTimestamp)}</span>
                        {currentStateLabel && <span>{currentStateLabel}</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.historyContent}>Message deleted by admin</div>
                      <div className={styles.historyFlagRow}>
                        <span>{formatDateTime(currentStateTimestamp)}</span>
                        {currentStateLabel && <span>{currentStateLabel}</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {isHistoryLoading ? (
                <div className={styles.historyEmpty}>Loading history...</div>
              ) : historyError ? (
                <div className={styles.historyEmpty}>{historyError}</div>
              ) : historyEntries.length === 0 ? (
                <div className={styles.historyEmpty}>No history entries</div>
              ) : (
                <div className={styles.historyList}>
                  {reversedHistoryEntries.map((entry) => {
                    const snapshot = entry.after ?? null;
                    const snapshotImageUrl = getSnapshotImageUrl(snapshot);
                    const previousText = getSnapshotText(entry.before);
                    const previousImageUrl = getSnapshotImageUrl(entry.before);
                    return (
                      <div key={entry.id} className={styles.historyCard}>
                        <div className={styles.historyHeader}>
                          <span className={styles.historyBadgeAction}>
                            {getHistoryActionLabel(entry)}
                          </span>
                          <span>{formatDateTime(entry.createdAt)}</span>
                        </div>
                        <div className={styles.historyPrevious}>
                          <span className={styles.historyPreviousLabel}>Previous</span>
                          <div className={styles.historyContent}>{previousText}</div>
                          {previousImageUrl && (
                            <button
                              type="button"
                              className={styles.messageImageButton}
                              onClick={() => {
                                setImageZoom(1);
                                setOpenedImageUrl(previousImageUrl);
                              }}
                            >
                              <img
                                className={styles.messageImage}
                                src={previousImageUrl}
                                alt="Previous chat image"
                              />
                            </button>
                          )}
                        </div>
                        <div className={styles.historyContent}>
                          {getSnapshotText(snapshot)}
                        </div>
                        {snapshotImageUrl && (
                          <button
                            type="button"
                            className={styles.messageImageButton}
                            onClick={() => {
                              setImageZoom(1);
                              setOpenedImageUrl(snapshotImageUrl);
                            }}
                          >
                            <img
                              className={styles.messageImage}
                              src={snapshotImageUrl}
                              alt="Moderated chat image"
                            />
                          </button>
                        )}
                        <div className={styles.historyFlagRow}>
                          {entry.adminName && <span>{entry.adminName}</span>}
                          <span>{entry.action.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    );
                  })}
                  {originalSnapshot && (
                    <div className={styles.historyCard}>
                      <div className={styles.historyHeader}>
                        <span className={styles.historyBadgeOriginal}>Original</span>
                        <span>{formatDateTime(historyEntries[0]?.createdAt)}</span>
                      </div>
                      <div className={styles.historyContent}>
                        {getSnapshotText(originalSnapshot)}
                      </div>
                      {getSnapshotImageUrl(originalSnapshot) && (
                        <button
                          type="button"
                          className={styles.messageImageButton}
                          onClick={() => {
                            setImageZoom(1);
                            setOpenedImageUrl(getSnapshotImageUrl(originalSnapshot));
                          }}
                        >
                          <img
                            className={styles.messageImage}
                            src={getSnapshotImageUrl(originalSnapshot)}
                            alt="Original chat image"
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {messageToDelete && (
        <div className={styles.confirmationBackdrop} onClick={closeDeleteModal}>
          <div
            className={`${styles.confirmationModal} ${nunito.className}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.confirmationTitle}>Delete message?</h2>
            <p className={styles.confirmationBody}>
              This will hide the message for users and mark it as deleted by admin.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeDeleteModal}
                isDisabled={loadingActionKey === `delete-${messageToDelete.id}`}
              />
              <Button
                title={
                  loadingActionKey === `delete-${messageToDelete.id}`
                    ? "Deleting..."
                    : "Confirm delete"
                }
                type="DELETE"
                onClick={deleteMessage}
                isDisabled={loadingActionKey === `delete-${messageToDelete.id}`}
              />
            </div>
          </div>
        </div>
      )}
      {messageToRemoveImage && (
        <div
          className={styles.confirmationBackdrop}
          onClick={closeRemoveImageModal}
        >
          <div
            className={`${styles.confirmationModal} ${nunito.className}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.confirmationTitle}>Remove image?</h2>
            <p className={styles.confirmationBody}>
              This will remove the image from the message and mark the message as
              moderated.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeRemoveImageModal}
                isDisabled={loadingActionKey === `image-${messageToRemoveImage.id}`}
              />
              <Button
                title={
                  loadingActionKey === `image-${messageToRemoveImage.id}`
                    ? "Removing..."
                    : "Confirm remove"
                }
                type="DELETE"
                onClick={removeMessageImage}
                isDisabled={loadingActionKey === `image-${messageToRemoveImage.id}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessages;
