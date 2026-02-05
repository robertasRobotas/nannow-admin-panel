import styles from "./headerButton.module.css";

type HeaderButtonProps = {
  title: string;
  isActive?: boolean;
  justify?: string;
  isAttention?: boolean;
};

const HeaderButton = ({
  title,
  isActive = false,
  justify = "JUSTIFY-CENTER",
  isAttention = false,
}: HeaderButtonProps) => {
  return (
    <div
      className={`${styles.main} ${styles[justify]} ${
        isActive && styles.active
      } ${isAttention && styles.attention}`}
    >
      {title}
    </div>
  );
};

export default HeaderButton;
