import { useState } from "react";
import styles from "./headerButton.module.css";

type HeaderButtonProps = {
  title: string;
  justify?: string;
};

const HeaderButton = ({
  title,
  justify = "JUSTIFY-CENTER",
}: HeaderButtonProps) => {
  const [isActive, setActive] = useState(false);

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
