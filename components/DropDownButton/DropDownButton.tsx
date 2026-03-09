import React, {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import arrowDownImg from "../../assets/images/arrow-down.svg";
import styles from "./dropDownButton.module.css";

type DropDownButtonProps = {
  options: {
    title: string;
    icon?: string;
    value: string;
    attentionNumber?: number;
  }[];
  selectedOption: number;
  setSelectedOption: Dispatch<SetStateAction<number>>;
  onClickOption?: () => void;
};

const DropDownButton = ({
  options,
  selectedOption,
  setSelectedOption,
  onClickOption,
}: DropDownButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option: number) => {
    setSelectedOption(option);
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
              {options[selectedOption].icon && (
                <img
                  className={styles.optionIcon}
                  src={options[selectedOption].icon}
                  alt={options[selectedOption].title}
                />
              )}

              <span>{options[selectedOption].title}</span>
              {typeof options[selectedOption].attentionNumber === "number" &&
                options[selectedOption].attentionNumber >= 0 && (
                  <span className={styles.attentionBubble}>
                    {options[selectedOption].attentionNumber}
                  </span>
                )}
            </div>
            <img
              className={styles.downArrow}
              src={arrowDownImg.src}
              alt={"Arrow down"}
            />
          </>
        }
      </div>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {options.map((option) => (
            <div
              key={option.title}
              className={styles.dropDownItem}
              onClick={() => {
                if (onClickOption) onClickOption();
                handleSelect(options.indexOf(option));
              }}
            >
              {option.icon && (
                <img
                  className={styles.optionIcon}
                  src={option.icon}
                  alt={option.title}
                />
              )}
              <span>{option.title}</span>
              {typeof option.attentionNumber === "number" &&
                option.attentionNumber >= 0 && (
                  <span className={styles.attentionBubble}>
                    {option.attentionNumber}
                  </span>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropDownButton;
