import styles from "./button.module.css";

type ButtonProps = {
  title: string;
  type: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
};

const Button = ({
  title,
  type,
  onClick,
  isSelected = false,
  isDisabled = false,
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${styles.main} ${styles[type]} ${
        isSelected && styles.selected
      } ${isDisabled && styles.disabled}`}
    >
      {title}
    </button>
  );
};

export default Button;
