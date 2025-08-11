import { Dispatch, SetStateAction, useState } from "react";
import styles from "./searchBar.module.css";

type SearchBarProps = {
  placeholder: string;
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  onButtonClick: () => void;
};

const SearchBar = ({
  placeholder,
  searchText,
  setSearchText,
  onButtonClick,
}: SearchBarProps) => {
  const [isFocused, setFocused] = useState(false);
  return (
    <div className={`${styles.main} ${isFocused && styles.focused}`}>
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <button onClick={onButtonClick} className={styles.searchBtn}></button>
    </div>
  );
};

export default SearchBar;
