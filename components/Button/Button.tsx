import styles from "./button.module.css";

type ButtonProps = {
  title: string;
  type: string;
  isDisabled: boolean;
};

const Button = ({ title, type, isDisabled }: ButtonProps) => {
  return (
    <button
      disabled={isDisabled}
      className={`${styles.main} ${styles[type]} ${
        isDisabled && styles.disabled
      }`}
    >
      {title}
    </button>
  );
};

export default Button;
