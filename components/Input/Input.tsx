import { Dispatch, SetStateAction, useState } from "react";
import styles from "./input.module.css";
import eyeImg from "../../assets/images/eye-on.svg";

type InputProps = {
  label: string;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  isPassword?: boolean;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
};

const Input = ({
  label,
  value,
  setValue,
  isPassword = false,
  isError,
  setIsError,
}: InputProps) => {
  const [showPass, setShowPass] = useState(isPassword);
  const [isFocused, setFocused] = useState(false);

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div
        className={`${styles.main} ${isFocused && styles.mainFocused} ${
          value.length > 0 && styles.filled
        } ${isError && styles.error}`}
      >
        <input
          onFocus={() => {
            setFocused(true);
            setIsError(false);
          }}
          onBlur={() => setFocused(false)}
          type={showPass ? "password" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.input}
        />
        {isPassword && (
          <img
            className={styles.passVisibility}
            onClick={() => setShowPass(!showPass)}
            src={eyeImg.src}
          />
        )}
      </div>
    </div>
  );
};

export default Input;
