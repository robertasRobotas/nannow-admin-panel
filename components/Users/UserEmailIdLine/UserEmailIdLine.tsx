import { MouseEvent } from "react";
import { Copy } from "lucide-react";
import { shortenUserId } from "@/lib/utils";
import { toast } from "react-toastify";
import { copyTextToClipboard } from "@/helpers/clipboardWrites";
import styles from "./userEmailIdLine.module.css";

type UserEmailIdLineProps = {
  email?: string;
  userId: string;
  phoneNumber?: string | null;
};

const normalizeTelHref = (value: string) =>
  value.trim().replace(/[^\d+]/g, "");

const UserEmailIdLine = ({
  email,
  userId,
  phoneNumber,
}: UserEmailIdLineProps) => {
  const displayEmail =
    email != null && String(email).trim() !== ""
      ? String(email).trim()
      : "—";
  const short = shortenUserId(userId);
  const normalizedPhone = (phoneNumber ?? "").trim();
  const phoneHref = normalizedPhone ? normalizeTelHref(normalizedPhone) : "";

  const copyId = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const didCopy = await copyTextToClipboard(userId);
    if (didCopy) {
      toast.success("ID copied");
    } else {
      toast.error("Could not copy");
    }
  };

  return (
    <div className={styles.line}>
      <div className={styles.primaryRow}>
        <span className={styles.text} title={`${displayEmail} · ${userId}`}>
          {displayEmail} · {short}
        </span>
        <button
          type="button"
          className={styles.copyBtn}
          data-row-nav-exclude=""
          aria-label="Copy ID"
          onClick={copyId}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Copy size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>
      {normalizedPhone && (
        <span
          className={styles.phoneLine}
          data-row-nav-exclude=""
          role="button"
          tabIndex={0}
          aria-label={`Call ${normalizedPhone}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (phoneHref.length > 0) {
              window.location.href = `tel:${phoneHref}`;
            }
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            if (phoneHref.length > 0) {
              window.location.href = `tel:${phoneHref}`;
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          title={normalizedPhone}
        >
          <span className={styles.phoneLabel}>Phone:</span>
          <span className={styles.phoneValue}>{normalizedPhone}</span>
        </span>
      )}
    </div>
  );
};

export default UserEmailIdLine;
