import styles from "./headerButton.module.css";

type HeaderButtonProps = {
  title: string;
  isActive?: boolean;
  justify?: string;
  attentionNumber?: number;
};

const HeaderButton = ({
  title,
  isActive = false,
  justify = "JUSTIFY-CENTER",
  attentionNumber,
}: HeaderButtonProps) => {
  const showAttention =
    typeof attentionNumber === "number" && attentionNumber > 0;

  return (
    <div
      className={`${styles.main} ${styles[justify]} ${isActive && styles.active}`}
    >
      <span className={styles.title}>{title}</span>
      {showAttention && (
        <span className={styles.attentionBubble}>{attentionNumber}</span>
      )}
    </div>
  );
};

export default HeaderButton;
