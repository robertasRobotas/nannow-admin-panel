/* eslint-disable @next/next/no-img-element */
import styles from "./button.module.css";
import arrowDownImg from "../../assets/images/arrow-down.svg";

type ButtonProps = {
  title: string;
  type: string;
  onClick: () => void;
  imgUrl?: string;
  arrowDown?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
};

const Button = ({
  title,
  type,
  onClick,
  imgUrl,
  arrowDown,
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
      {imgUrl && <img className={styles.icon} src={imgUrl} alt="Icon" />}
      {title}
      {arrowDown && <img className={styles.arrowDown} src={arrowDownImg.src} />}
    </button>
  );
};

export default Button;
