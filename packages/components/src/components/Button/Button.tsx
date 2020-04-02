import React from "react";
import { makeStyles, ButtonStyleProps } from "./Button.style";

type ButtonProps = {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
} & ButtonStyleProps;

export default function Button({
  children,
  className,
  onClick,
  ...styleProps
}: ButtonProps) {
  let styles = makeStyles(styleProps);
  return (
    <button css={styles} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
