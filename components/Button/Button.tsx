/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
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
  alignBaseline?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      title,
      type,
      onClick,
      imgUrl,
      arrowDown,
      isSelected = false,
      isDisabled = false,
      alignBaseline,
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={isDisabled}
        className={`${styles.main} ${styles[type]} ${
          isSelected && styles.selected
        } ${isDisabled && styles.disabled} ${
          alignBaseline && styles.alignBaseline
        }`}
      >
        {imgUrl && <img className={styles.icon} src={imgUrl} alt="Icon" />}
        {title}
        {arrowDown && (
          <img className={styles.arrowDown} src={arrowDownImg.src} alt="" />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
