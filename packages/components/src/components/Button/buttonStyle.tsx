import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";
import * as fragments from "../../theme/fragments";

export type ButtonStyleProps = {
  color?: "primary" | "danger" | "success" | "neutral";
  size?: "normal" | "large" | "small" | "full";
  outline?: boolean;
};

export let makeStyles = ({
  color = "primary",
  size = "normal",
  outline,
}: ButtonStyleProps) => {
  return css`
    ${fragments.withSize(size)}
    border-radius: ${spacing.s1};
    
    border: none;
    font-style: ${typography.fonts.base};
    background-color: ${colors.bg[color]};
    color: ${colors.text.white};
  `;
};
