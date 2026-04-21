import { Dispatch, SetStateAction, useId } from "react";
import styles from "./searchBar.module.css";
import searchIconBlack from "@/assets/images/search-icon-black.svg";

type SearchBarProps = {
  placeholder: string;
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  onButtonClick: () => void;
  className?: string;
};

const SearchBar = ({
  placeholder,
  searchText,
  setSearchText,
  onButtonClick,
  className,
}: SearchBarProps) => {
  const inputId = useId();

  return (
    <div className={`${styles.main} ${className ?? ""}`}>
      <label
        htmlFor={inputId}
        className={styles.leftSearchIconWrap}
        aria-hidden="true"
      >
        <img
          className={styles.leftSearchIcon}
          src={searchIconBlack.src}
          alt=""
        />
      </label>
      <input
        id={inputId}
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={onButtonClick}
        className={styles.searchBtn}
        aria-label="Search"
      >
        <img
          className={styles.searchBtnIcon}
          src={searchIconBlack.src}
          alt=""
          width={18}
          height={18}
        />
      </button>
    </div>
  );
};

export default SearchBar;
