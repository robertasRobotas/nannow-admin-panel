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
  isLoading?: boolean;
  alignBaseline?: boolean;
  height?: number;
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
      isLoading = false,
      alignBaseline,
      height = 40,
    },
    ref
  ) => {
    return (
      <button
        style={{ height: `${height}px` }}
        ref={ref}
        onClick={onClick}
        disabled={isDisabled || isLoading}
        className={`${styles.main} ${styles[type]} ${
          isSelected && styles.selected
        } ${(isDisabled || isLoading) && styles.disabled} ${
          alignBaseline && styles.alignBaseline
        }`}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
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
