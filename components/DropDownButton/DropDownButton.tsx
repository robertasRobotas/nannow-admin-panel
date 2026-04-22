import React, {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import arrowDownImg from "../../assets/images/arrow-down.svg";
import { cn } from "@/lib/utils";

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
    <div className="relative text-foreground" ref={dropdownRef}>
      <button
        type="button"
        className={cn(
          "flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-input bg-background px-3 text-left text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {options[selectedOption].icon && (
            <img
              className="size-6 shrink-0 object-contain"
              src={options[selectedOption].icon}
              alt=""
            />
          )}

          <span className="truncate">{options[selectedOption].title}</span>
          {typeof options[selectedOption].attentionNumber === "number" &&
            options[selectedOption].attentionNumber > 0 && (
              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 py-1 text-center text-[11px] font-semibold leading-none text-destructive-foreground">
                {options[selectedOption].attentionNumber}
              </span>
            )}
        </div>
        <img
          className="size-4 shrink-0 opacity-70"
          src={arrowDownImg.src}
          alt=""
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-[9999] mt-2 flex min-w-full flex-col rounded-xl border border-border bg-popover py-1.5 text-popover-foreground shadow-md outline-none"
          role="listbox"
        >
          {options.map((option) => (
            <div
              key={option.title}
              role="option"
              aria-selected={options.indexOf(option) === selectedOption}
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                if (onClickOption) onClickOption();
                handleSelect(options.indexOf(option));
              }}
            >
              {option.icon && (
                <img
                  className="size-6 shrink-0 object-contain"
                  src={option.icon}
                  alt=""
                />
              )}
              <span>{option.title}</span>
              {typeof option.attentionNumber === "number" &&
                option.attentionNumber > 0 && (
                  <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-1 text-center text-[11px] font-semibold leading-none text-destructive-foreground">
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
