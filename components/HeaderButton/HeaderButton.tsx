import styles from "./headerButton.module.css";

type HeaderButtonProps = {
  title: string;
  isActive: boolean;
};

const HeaderButton = ({ title, isActive }: HeaderButtonProps) => {
  return (
    <div className={`${styles.main} ${isActive && styles.active}`}>{title}</div>
  );
};

export default HeaderButton;
