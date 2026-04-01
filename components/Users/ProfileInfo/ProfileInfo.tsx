import { useEffect, useState } from "react";
import styles from "./profileInfo.module.css";
import { nunito } from "@/helpers/fonts";

type ProfileInfoProps = {
  name: string;
  imgUrl: string;
  id: string;
  mode?: "client" | "provider";
  email: string;
  locale?: string;
};

const ProfileInfo = ({
  name,
  imgUrl,
  id,
  mode,
  email,
  locale,
}: ProfileInfoProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  const openImageModal = () => {
    setImageZoom(1);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageZoom(1);
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
      <button
        type="button"
        className={styles.profileImgButton}
        onClick={openImageModal}
        aria-label="Open profile image"
      >
        <img className={styles.profileImg} src={imgUrl} alt="Profile Image" />
      </button>
      <span className={`${styles.name} ${nunito.className}`}>
        {name} {mode && (mode === "provider" ? "(Provider)" : "(Client)")}
      </span>
      <span className={styles.email}>{email}</span>
      <span className={styles.id}>{`USER ID: ${id}`}</span>
      {locale && (
        <span className={styles.email}>{`USER LOCALE: ${locale}`}</span>
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
                onClick={() => setImageZoom((current) => Math.max(1, current - 0.25))}
              >
                -
              </button>
              <button
                type="button"
                className={styles.imageModalButton}
                onClick={() => setImageZoom((current) => Math.min(3, current + 0.25))}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;
