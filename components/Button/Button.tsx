/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
import arrowDownImg from "../../assets/images/arrow-down.svg";
import { Button as UiButton, type ButtonProps as UiButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = {
  title: string;
  type: string;
  /** Native `<button type>` — defaults to `button` so in-form actions don’t accidentally submit forms. */
  htmlType?: "button" | "submit" | "reset";
  onClick?: () => void;
  attentionNumber?: number;
  imgUrl?: string;
  arrowDown?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  alignBaseline?: boolean;
  height?: number;
  className?: string;
};

function legacyTypeToVariant(
  type: string,
): NonNullable<UiButtonProps["variant"]> {
  switch (type) {
    case "PLAIN":
      return "ghost";
    case "OUTLINED":
      return "outline";
    case "BLACK":
      return "default";
    case "WHITE":
      return "secondary";
    case "GREEN":
      return "success";
    case "GRAY":
      return "secondary";
    case "DELETE":
      return "destructiveOutline";
    default:
      return "default";
  }
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      title,
      type: legacyType,
      htmlType = "button",
      onClick,
      attentionNumber,
      imgUrl,
      arrowDown,
      isSelected = false,
      isDisabled = false,
      isLoading = false,
      alignBaseline,
      height = 40,
      className,
    },
    ref,
  ) => {
    const showAttentionNumber =
      typeof attentionNumber === "number" && attentionNumber > 0;

    return (
      <UiButton
        type={htmlType}
        style={{ height: `${height}px`, minHeight: `${height}px` }}
        ref={ref}
        onClick={onClick}
        disabled={isDisabled || isLoading}
        variant={legacyTypeToVariant(legacyType)}
        className={cn(
          className,
          isSelected && "bg-accent text-accent-foreground shadow-sm",
          alignBaseline && "self-baseline",
        )}
      >
        {isLoading && (
          <span
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
        )}
        {imgUrl && (
          <img className="size-6 shrink-0 object-contain" src={imgUrl} alt="" />
        )}
        <span>{title}</span>
        {showAttentionNumber && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-1 text-center text-[11px] font-semibold leading-none text-destructive-foreground">
            {attentionNumber}
          </span>
        )}
        {arrowDown && (
          <img
            className="size-4 shrink-0 opacity-70"
            src={arrowDownImg.src}
            alt=""
          />
        )}
      </UiButton>
    );
  },
);

Button.displayName = "Button";

export default Button;
