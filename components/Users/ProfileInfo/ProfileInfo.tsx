import { MouseEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { removeUserImgUrl } from "@/pages/api/fetch";
import styles from "./profileInfo.module.css";
import { nunito } from "@/helpers/fonts";
import defaultAvatarImg from "@/assets/images/default-avatar.png";

type ProfileInfoProps = {
  name: string;
  imgUrl: string;
  id: string;
  mode?: "client" | "provider";
  email: string;
  locale?: string;
  appVersion?: string | null;
  platform?: "IOS" | "ANDROID" | null;
  imgUrlRemoveMessage?: string | null;
  allowImageRemoval?: boolean;
  userId?: string;
  finalPrice?: number;
  enableImageViewer?: boolean;
};

const ProfileInfo = ({
  name,
  imgUrl,
  id,
  mode,
  email,
  locale,
  appVersion,
  platform,
  imgUrlRemoveMessage,
  allowImageRemoval = false,
  userId,
  finalPrice,
  enableImageViewer = true,
}: ProfileInfoProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [profileImgUrl, setProfileImgUrl] = useState(imgUrl ?? "");
  const [removeMessage, setRemoveMessage] = useState(imgUrlRemoveMessage ?? "");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonError, setDeleteReasonError] = useState("");
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  useEffect(() => {
    setProfileImgUrl(imgUrl ?? "");
  }, [imgUrl]);

  useEffect(() => {
    setRemoveMessage(imgUrlRemoveMessage ?? "");
  }, [imgUrlRemoveMessage]);

  const hasProfileImage = profileImgUrl.trim().length > 0;
  const showRemovedAvatar = !hasProfileImage && removeMessage.trim().length > 0;
  const hasPlatform = typeof platform === "string" && platform.trim().length > 0;
  const hasAppVersion =
    typeof appVersion === "string" && appVersion.trim().length > 0;
  const appInfoLine =
    hasPlatform || hasAppVersion
      ? `${hasPlatform ? platform : "—"} | ${hasAppVersion ? appVersion : "—"}`
      : "—";

  const openImageModal = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (!enableImageViewer) return;
    if (!hasProfileImage) return;
    setImageZoom(1);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageZoom(1);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteReason("");
    setDeleteReasonError("");
  };

  const confirmDeleteImage = async () => {
    if (!userId) return;

    const trimmedReason = deleteReason.trim();
    if (trimmedReason.length === 0) {
      setDeleteReasonError("Reason is required.");
      return;
    }

    try {
      setIsRemovingImage(true);
      await removeUserImgUrl(userId, trimmedReason);
      setProfileImgUrl("");
      setRemoveMessage(trimmedReason);
      closeDeleteModal();
      closeImageModal();
      toast.success("Profile image was removed");
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove profile image");
    } finally {
      setIsRemovingImage(false);
    }
  };

  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImageModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageModalOpen]);

  return (
    <div className={styles.profileInfo}>
      {hasProfileImage && enableImageViewer ? (
        <button
          type="button"
          className={styles.profileImgButton}
          onClick={openImageModal}
          aria-label="Open profile image"
        >
          <img
            className={styles.profileImg}
            src={profileImgUrl}
            alt="Profile Image"
          />
        </button>
      ) : hasProfileImage ? (
        <img
          className={styles.profileImg}
          src={profileImgUrl}
          alt="Profile Image"
        />
      ) : showRemovedAvatar ? (
        <div className={styles.removedAvatar}>R</div>
      ) : (
        <img
          className={styles.profileImg}
          src={defaultAvatarImg.src}
          alt="Profile Image"
        />
      )}
      <span className={`${styles.name} ${nunito.className}`}>
        {name} {mode && (mode === "provider" ? "(Provider)" : "(Client)")}
      </span>
      <span className={styles.email}>{email}</span>
      <span className={styles.id}>{`USER ID: ${id}`}</span>
      <span className={styles.email}>{`APP INFO: ${appInfoLine}`}</span>
      {locale && (
        <span className={styles.email}>{`USER LOCALE: ${locale}`}</span>
      )}
      {finalPrice !== undefined && (
        <span className={styles.email}>{`Final price: ${finalPrice}`}</span>
      )}

      {isImageModalOpen && (
        <div className={styles.imageModalOverlay} onClick={closeImageModal}>
          <div
            className={styles.imageModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.imageModalActions}>
              <button
                type="button"
                className={styles.imageModalButton}
                onClick={() =>
                  setImageZoom((current) => Math.max(1, current - 0.25))
                }
              >
                -
              </button>
              <button
                type="button"
                className={styles.imageModalButton}
                onClick={() =>
                  setImageZoom((current) => Math.min(3, current + 0.25))
                }
              >
                +
              </button>
              <button
                type="button"
                className={styles.imageModalButton}
                onClick={() => setImageZoom(1)}
              >
                Reset
              </button>
              {allowImageRemoval && userId && (
                <button
                  type="button"
                  className={`${styles.imageModalButton} ${styles.deleteButton}`}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className={styles.imageModalButton}
                onClick={closeImageModal}
              >
                Close
              </button>
            </div>
            <div className={styles.imageViewport}>
              <img
                className={styles.modalImage}
                src={imgUrl}
                alt="Profile Image"
                style={{ transform: `scale(${imageZoom})` }}
              />
            </div>
            {removeMessage.trim().length > 0 && (
              <div className={styles.imageRemoveMessage}>{removeMessage}</div>
            )}
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className={styles.imageModalOverlay} onClick={closeDeleteModal}>
          <div
            className={styles.confirmationModal}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.confirmationTitle}>Delete profile image?</h3>
            <div className={styles.inputBlock}>
              <label
                className={styles.inputLabel}
                htmlFor="profile-image-delete-reason"
              >
                Reason
              </label>
              <textarea
                id="profile-image-delete-reason"
                className={styles.reasonInput}
                value={deleteReason}
                onChange={(event) => {
                  setDeleteReason(event.target.value);
                  setDeleteReasonError("");
                }}
                placeholder="Enter reason..."
                disabled={isRemovingImage}
                rows={3}
              />
              {deleteReasonError && (
                <span className={styles.inputError}>{deleteReasonError}</span>
              )}
            </div>
            <div className={styles.confirmationActions}>
              <button
                type="button"
                className={styles.imageModalButton}
                onClick={closeDeleteModal}
                disabled={isRemovingImage}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.imageModalButton} ${styles.deleteButton}`}
                onClick={confirmDeleteImage}
                disabled={isRemovingImage}
              >
                {isRemovingImage ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;
