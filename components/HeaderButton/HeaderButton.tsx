import styles from "./headerButton.module.css";

type HeaderButtonProps = {
  title: string;
  isActive: boolean;
  justify?: string;
};

const HeaderButton = ({
  title,
  isActive,
  justify = "JUSTIFY-CENTER",
}: HeaderButtonProps) => {
  return (
    <div
      className={`${styles.main} ${styles[justify]} ${
        isActive && styles.active
      }`}
    >
      {title}
    </div>
  );
};

export default HeaderButton;
