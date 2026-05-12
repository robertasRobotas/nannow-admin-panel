import { MouseEvent } from "react";
import { Copy } from "lucide-react";
import { shortenUserId } from "@/lib/utils";
import { toast } from "react-toastify";
import { copyTextToClipboard } from "@/helpers/clipboardWrites";
import styles from "./userEmailIdLine.module.css";

type UserEmailIdLineProps = {
  email?: string;
  userId: string;
};

const UserEmailIdLine = ({ email, userId }: UserEmailIdLineProps) => {
  const displayEmail =
    email != null && String(email).trim() !== ""
      ? String(email).trim()
      : "—";
  const short = shortenUserId(userId);

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
  );
};

export default UserEmailIdLine;
