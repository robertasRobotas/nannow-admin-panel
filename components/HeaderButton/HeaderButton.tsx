import { ReactNode } from "react";
import styles from "./headerButton.module.css";

type HeaderButtonProps = {
  title: string;
  isActive?: boolean;
  justify?: string;
  attentionNumber?: number;
  icon?: ReactNode;
  hideTitle?: boolean;
};

const HeaderButton = ({
  title,
  isActive = false,
  justify = "JUSTIFY-CENTER",
  attentionNumber,
  icon,
  hideTitle = false,
}: HeaderButtonProps) => {
  const showAttention =
    typeof attentionNumber === "number" && attentionNumber > 0;

  return (
    <div
      className={`${styles.main} ${styles[justify]} ${isActive && styles.active}`}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {!hideTitle && <span className={styles.title}>{title}</span>}
      {showAttention && (
        <span className={styles.attentionBubble}>{attentionNumber}</span>
      )}
    </div>
  );
};

export default HeaderButton;
