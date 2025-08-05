import { useState } from "react";
import styles from "./searchBar.module.css";

const SearchBar = () => {
  const [text, setText] = useState("");
  return (
    <div className={styles.main}>
      <input
        placeholder="Search"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className={styles.searchBtn}></button>
    </div>
  );
};

export default SearchBar;
