import React, {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import starImg from "../../../../assets/images/star-filled.svg";
import arrowDownImg from "../../../../assets/images/arrow-down.svg";
import styles from "./dropDownMenu.module.css";

type DropDownMenuProps = {
  options: string[];
  selectedRating: string;
  setSelectedRating: Dispatch<SetStateAction<string>>;
};

const DropDownMenu = ({
  options,
  selectedRating,
  setSelectedRating,
}: DropDownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option: string) => {
    setSelectedRating(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <div className={styles.dropdownToggle} onClick={toggleDropdown}>
        {
          <>
            <div className={styles.option}>
              <img src={starImg.src} alt={selectedRating} />
              <span>{selectedRating}</span>
            </div>
            <img src={arrowDownImg.src} alt={"Arrow down"} />
          </>
        }
      </div>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {options.map((option) => (
            <div
              key={option}
              className={styles.dropDownItem}
              onClick={() => handleSelect(option)}
            >
              <img src={starImg.src} alt={option} />
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropDownMenu;
