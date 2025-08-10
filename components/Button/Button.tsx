/* eslint-disable @next/next/no-img-element */
import styles from "./button.module.css";

type ButtonProps = {
  title: string;
  type: string;
  onClick: () => void;
  imgUrl?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
};

const Button = ({
  title,
  type,
  onClick,
  imgUrl,
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
      {imgUrl && <img src={imgUrl} alt="Icon" />}
      {title}
    </button>
  );
};

export default Button;
