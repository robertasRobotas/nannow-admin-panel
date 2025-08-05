import { useState } from "react";
import styles from "./searchBar.module.css";

const SearchBar = () => {
  const [text, setText] = useState("");
  const [isFocused, setFocused] = useState(false);
  return (
    <div className={`${styles.main} ${isFocused && styles.focused}`}>
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={(e) => e.preventDefault()}
        className={styles.searchBtn}
      ></button>
    </div>
  );
};

export default SearchBar;
