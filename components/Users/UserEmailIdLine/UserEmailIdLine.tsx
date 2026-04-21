import { MouseEvent } from "react";
import { Copy } from "lucide-react";
import { shortenUserId } from "@/lib/utils";
import { toast } from "react-toastify";
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
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(userId);
      toast.success("ID copied");
    } catch {
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
      >
        <Copy size={14} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
};

export default UserEmailIdLine;
