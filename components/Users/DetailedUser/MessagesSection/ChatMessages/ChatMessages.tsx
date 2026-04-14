import { useEffect, useState } from "react";
import { ChatMessageType } from "@/types/Chats";
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
};

const ChatMessages = ({
  messages,
  userId,
  userImgUrl,
  otherUserImgUrl,
}: ChatMessagesProps) => {
  const [openedImageUrl, setOpenedImageUrl] = useState("");
  const [imageZoom, setImageZoom] = useState(1);

  const closeImageModal = () => {
    setOpenedImageUrl("");
    setImageZoom(1);
  };

  useEffect(() => {
    if (!openedImageUrl) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImageModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openedImageUrl]);

  return (
    <>
      <div className={styles.main}>
        {messages.map((m) => {
          const isFromUser = m.senderId === userId;
          const hasText = String(m.content ?? "").trim().length > 0;
          const hasImage = String(m.imageUrl ?? "").trim().length > 0;

          return (
            <div
              key={m.id}
              className={`${styles.messageWrapper} ${
                isFromUser ? styles.alignRight : styles.alignLeft
              }`}
            >
              {!isFromUser && (
                <img
                  className={styles.profileImg}
                  src={
                    otherUserImgUrl.length > 0 ? otherUserImgUrl : avatarImg.src
                  }
                />
              )}
              <div
                className={`${styles.chatBubble} ${
                  isFromUser ? styles.sent : styles.received
                }`}
              >
                {hasText && <span>{m.content}</span>}
                {hasImage && (
                  <button
                    type="button"
                    className={styles.messageImageButton}
                    onClick={() => {
                      setImageZoom(1);
                      setOpenedImageUrl(m.imageUrl ?? "");
                    }}
                  >
                    <img
                      className={styles.messageImage}
                      src={m.imageUrl ?? ""}
                      alt="Chat image"
                    />
                  </button>
                )}
                <span className={styles.messageTimestamp}>
                  {formatDateTime(m.createdAt)}
                </span>
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
    </>
  );
};

export default ChatMessages;
