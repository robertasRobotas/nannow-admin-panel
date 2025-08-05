import { useState } from "react";
import styles from "./searchBar.module.css";

type SearchBarProps = {
  placeholder: string;
};

const SearchBar = ({ placeholder }: SearchBarProps) => {
  const [text, setText] = useState("");
  const [isFocused, setFocused] = useState(false);
  return (
    <div className={`${styles.main} ${isFocused && styles.focused}`}>
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className={styles.searchBtn}></button>
    </div>
  );
};

export default SearchBar;
